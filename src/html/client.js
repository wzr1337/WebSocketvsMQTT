// globals  
var results = {};
const initializer =  {
  min : Infinity,
  avg : 0,
  max : -Infinity
}

const MESSAGESIZE = "10k";

const resetData = function() {
  results = {
    stringify : initializer,
    send : initializer,
    transport : initializer,
    parse : initializer,
    sum : initializer,
    datapoints : 0
  }
}
resetData();

/**
 * Get the size of a string in Bytes
 *
 * @param {string} str the input string
 * @param {boolean} [pretty=false] return the bytes in human readable format
 * @returns the byte size or the byte size in human readable format
 */
const getByteSize = (str, pretty = false) => {
  const len = (new TextEncoder('utf-8').encode(str)).length;
  if (!pretty) return len;
  return  (len > 1024*1024) ? parseInt(len/1024/1024) + "MBytes" : (len > 1024) ? parseInt(len/1024) + "kBytes" : len + "Bytes"
}

$( document ).ready(function() {
  console.log( "ready!" );
  
  resetData();
  
  var measuring = false;
  var messagesLog = {};
  
  const toggleButtons = function() {
    $('#btnStart').prop('disabled', !$('#btnStart').prop('disabled'));
    $('#btnStop').prop('disabled', !$('#btnStop').prop('disabled'));
  }

  const fctMin = function (curr, previous) { return (curr < previous) ? curr : previous; }  
  const fctAvg= function(curr, previous, samples) { return (previous * samples + curr) / (samples + 1); }
  const fctMax= function(curr, previous) { return (previous < curr) ? curr : previous; }  

  ws = new WebSocket("ws://" + location.host);
  ws.onopen = function () {
    ws.onmessage = function(data) {
      var t_received = performance.now()
      var payload = JSON.parse(data.data); 
      const t_parsed = performance.now(); // parsing influences the measurement
      var perf = payload.perf;
      
  	  // t_born - t_stringified - t_sent - t_received - t_parsed
  	  
      const d_stringify_curr = messagesLog[perf.id].t_stringified - perf.t_born;
      results.stringify = {
        min : fctMin(results.stringify.min, d_stringify_curr),
        avg : fctAvg(d_stringify_curr, results.stringify.avg, results.datapoints),
        max : fctMax(results.stringify.max, d_stringify_curr)
      }

  	  const d_send_curr = messagesLog[perf.id].t_sent - messagesLog[perf.id].t_stringified;
  	  results.send = {
        min : fctMin(results.send.min, d_send_curr),
  	    avg : fctAvg(d_send_curr, results.send.avg, results.datapoints),
        max : fctMax(results.send.max, d_send_curr)
      }

  	  const d_transport_curr = t_received - messagesLog[perf.id].t_sent;
  	  results.transport = {
        min : fctMin(results.transport.min, d_transport_curr),
    	  avg : fctAvg(d_transport_curr, results.transport.avg, results.datapoints),
        max : fctMax(results.transport.max, d_transport_curr)
      }

  	  const d_parse_curr = t_parsed - t_received;
  	  results.parse ={
        min : fctMin(results.parse.min, d_parse_curr),
  	    avg : fctAvg(d_parse_curr, results.parse.avg, results.datapoints),
        max : fctMax(results.parse.max, d_parse_curr)
      }

  	  const d_sum_curr = t_parsed - perf.t_born;
  	  results.sum = {
        min : fctMin(results.sum.min, d_sum_curr),
  	    avg : fctAvg(d_sum_curr, results.sum.avg, results.datapoints),
        max : fctMax(results.sum.max, d_sum_curr)
      }
  	  
  	  results.datapoints = results.datapoints + 1;
	  
      delete messagesLog[perf.id];
    };
    // see initial setting in index.html - toggleButtons();
  }

  // start button handler
  const onStart = async (event) => {
    console.log("Measurement started");
    toggleButtons();

    let payload = await $.get(`${window.location.origin}/rsi/samples/`,{size: MESSAGESIZE});
    // add some performance counter (should be abvoided as being overhead)
    payload.perf= {
      id: 0,
      t_born: performance.now()
    };

    $("#fakeMessage").text(JSON.stringify(payload, undefined, 2));
    $("#fakeMessageSize").text(getByteSize(JSON.stringify(payload), true));

 
    measuring = setInterval(function() {
      payload.perf.id += 1;
  	  payload.perf.t_born = performance.now();
  	  var myJSON = JSON.stringify(payload);
  	  var t_stringified = performance.now();
        ws.send(myJSON);
  	    messagesLog[payload.perf.id] = {
  	      t_stringified: t_stringified,
  		    t_sent: performance.now()
  	  }	  
    }, 10); // unblock the thread
  };

  // stop button handler
  const onStop = function (event) {
    console.log("Measurement stopped");
    toggleButtons();
    clearInterval(measuring);
  }
  
  // reset button handler
  const onReset = function (event) {
    console.log("Reset triggered");
	  resetData();
  }  

  // add click handlers
  $('#btnStart').click(onStart);
  $('#btnStop').click(onStop);
  $('#btnReset').click(onReset);
});

const updateUI = () => {
  //setInterval(function() {
    $('#val_samples').text(results.datapoints);
  
    $('#val_stringify_min').text(results.stringify.min.toFixed(3));
    $('#val_stringify_avg').text(results.stringify.avg.toFixed(3));
    $('#val_stringify_max').text(results.stringify.max.toFixed(3));

    $('#val_send_min').text(results.send.min.toFixed(3));
    $('#val_send_avg').text(results.send.avg.toFixed(3));
    $('#val_send_max').text(results.send.max.toFixed(3));
  
    $('#val_transport_min').text(results.transport.min.toFixed(3));
    $('#val_transport_avg').text(results.transport.avg.toFixed(3));
    $('#val_transport_max').text(results.transport.max.toFixed(3));

    $('#val_parse_min').text(results.parse.min.toFixed(3));
    $('#val_parse_avg').text(results.parse.avg.toFixed(3));
    $('#val_parse_max').text(results.parse.max.toFixed(3));

    $('#val_sum_min').text(results.sum.min.toFixed(3));
    $('#val_sum_avg').text(results.sum.avg.toFixed(3));
    $('#val_sum_max').text(results.sum.max.toFixed(3));

    // tick next frame 
    window.requestAnimationFrame(updateUI);
 // }, 100 );
  }

// cyclic GUI update
window.requestAnimationFrame(updateUI);