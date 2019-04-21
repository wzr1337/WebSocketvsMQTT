// globals  
var d_stringify_min, d_stringify_avg, d_stringify_max;
var d_send_min, d_send_avg, d_send_max;
var d_transport_min, d_transport_avg, d_transport_max;
var d_parse_min, d_parse_avg, d_parse_max;
var d_sum_min, d_sum_avg, d_sum_max;
var datapoints;

const resetData = function() {
  d_stringify_min = Infinity;
  d_stringify_avg = 0;
  d_stringify_max = -Infinity;

  d_send_min = Infinity;
  d_send_avg = 0;
  d_send_max = -Infinity;

  d_transport_min = Infinity;
  d_transport_avg = 0;
  d_transport_max = -Infinity;  
  
  d_parse_min = Infinity;
  d_parse_avg = 0;
  d_parse_max = -Infinity;  

  d_sum_min = Infinity;
  d_sum_avg = 0;
  d_sum_max = -Infinity;  
  
  datapoints = 0;
}
resetData();

/**
 * Get the yize of a string in Bytes
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
  	  
  	  var d_stringify_curr = messagesLog[perf.id].t_stringified - perf.t_born;
  	  d_stringify_min = fctMin(d_stringify_min, d_stringify_curr);
  	  d_stringify_avg = fctAvg(d_stringify_curr, d_stringify_avg, datapoints);
      d_stringify_max = fctMax(d_stringify_max, d_stringify_curr);
      
  	  var d_send_curr = messagesLog[perf.id].t_sent - messagesLog[perf.id].t_stringified;
  	  d_send_min = fctMin(d_send_min, d_send_curr);
  	  d_send_avg = fctAvg(d_send_curr, d_send_avg, datapoints);
      d_send_max = fctMax(d_send_max, d_send_curr);

  	  var d_transport_curr = t_received - messagesLog[perf.id].t_sent;
  	  d_transport_min = fctMin(d_transport_min, d_transport_curr);
  	  d_transport_avg = fctAvg(d_transport_curr, d_transport_avg, datapoints);
      d_transport_max = fctMax(d_transport_max, d_transport_curr);

  	  var d_parse_curr = t_parsed - t_received;
  	  d_parse_min = fctMin(d_parse_min, d_parse_curr);
  	  d_parse_avg = fctAvg(d_parse_curr, d_parse_avg, datapoints);
      d_parse_max = fctMax(d_parse_max, d_parse_curr);

  	  var d_sum_curr = t_parsed - perf.t_born;
  	  d_sum_min = fctMin(d_sum_min, d_sum_curr);
  	  d_sum_avg = fctAvg(d_sum_curr, d_sum_avg, datapoints);
      d_sum_max = fctMax(d_sum_max, d_sum_curr);
  	  
  	  datapoints = datapoints + 1;
	  
      delete messagesLog[perf.id];
    };
    // see initial setting in index.html - toggleButtons();
  }

  // start button handler
  const onStart = async (event) => {
    console.log("Measurement started");
    toggleButtons();

    let payload = await $.get(`${window.location.origin}/rsi/samples/`,{size: "128k"});
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
    $('#val_samples').text(datapoints);
  
    $('#val_stringify_min').text(d_stringify_min.toFixed(3));
    $('#val_stringify_avg').text(d_stringify_avg.toFixed(3));
    $('#val_stringify_max').text(d_stringify_max.toFixed(3));

    $('#val_send_min').text(d_send_min.toFixed(3));
    $('#val_send_avg').text(d_send_avg.toFixed(3));
    $('#val_send_max').text(d_send_max.toFixed(3));
  
    $('#val_transport_min').text(d_transport_min.toFixed(3));
    $('#val_transport_avg').text(d_transport_avg.toFixed(3));
    $('#val_transport_max').text(d_transport_max.toFixed(3));

    $('#val_parse_min').text(d_parse_min.toFixed(3));
    $('#val_parse_avg').text(d_parse_avg.toFixed(3));
    $('#val_parse_max').text(d_parse_max.toFixed(3));

    $('#val_sum_min').text(d_sum_min.toFixed(3));
    $('#val_sum_avg').text(d_sum_avg.toFixed(3));
    $('#val_sum_max').text(d_sum_max.toFixed(3));

    // tick next frame 
    window.requestAnimationFrame(updateUI);
 // }, 100 );
  }

// cyclic GUI update
window.requestAnimationFrame(updateUI);