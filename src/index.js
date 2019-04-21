const express = require('express');
const http = require('http');
const path = require('path');
const url = require('url');
const WebSocket = require('ws');
const mqtt = require("mqtt");
const broker = require("./broker");
const helpers = require("./helpers");
const compression = require('compression')

const app = express();

app.use(express.static(path.join(__dirname,'html')));
app.use(compression({ filter: (req, res) => {
  if (req.headers['x-no-compression']) {
    // don't compress responses with this request header
    return false
  }
  // fallback to standard filter function
  return compression.filter(req, res) 
  }
}));

app.get('/rsi/samples/', (req, res) => {
  if (!req.query.size) {
    res.status(400);
    res.json(
      {
        status: "error",
        message: `missing size query parameter` 
      }
    )
  }

  // first: make sure we get the actual desired size in Bytes
  const BYTESIZE_REGEX = /^(\d+)([mMkK]?)B?$/;
  const parsedSize = req.query.size.match(BYTESIZE_REGEX);
  if (parsedSize === null) {
    res.status(400);
    res.json(
      {
        status: "error",
        message: `invalid size ${req.params.size}` 
      }
    )
    return
  } 
  let size = parseInt(parsedSize[1]);
  switch (parsedSize[2].toLowerCase()) {
    case "k":
      size *= 1024
      break;
    case "m":
      size *= 1024*1024
      break;
  }
  // now size is the size in Bytes
  
  // the response template goes below. it is the minimum RSI message we can send
  let resp = {
    status: "ok", 
      data: {
        id: "69601056-18e5-469f-9ff3-7902f893774c",
        name: "",
        uri: "/a/b/69601056-18e5-469f-9ff3-7902f893774c"
      }
  };


  const GENERATOR_LIMIT = 1024;
  
  if ((GENERATOR_LIMIT) <= size) {
    console.log("size larger then 256kB");
  }

  const numberOfKeys = Math.max(1, parseInt(size/GENERATOR_LIMIT));
  
  for (let iter = 0; iter !== numberOfKeys; iter++) {
    const key = "randomKey" + iter.toString();
    const valSize = Math.max(0, Math.min(size, GENERATOR_LIMIT) - helpers.getByteLength(key));
    const remaining = size - helpers.getByteLength(JSON.stringify(resp));
    if ((remaining - valSize) < 0) {
      break;
    } else {
      resp.data[key] = helpers.generateRandomString(valSize);
    }
  }
  const remaining = size - helpers.getByteLength(JSON.stringify(resp));
  if (0 <= remaining) {
    const key = "finalizer";
    const valSize = Math.max(0, remaining - helpers.getByteLength(key));
    resp.data[key] = helpers.generateRandomString(valSize);
  }
  res.json(resp)
})

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws, req) {
  const location = url.parse(req.url, true);
  // You might use location.query.access_token to authenticate or share sessions
  // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
  const ip = req.connection.remoteAddress;
  console.log(`New client ${ip}`);
  ws.on('message', function incoming(message) {
    ws.send(message);
  });
});


/// MQTT section controlled client side, executed server side
const TOPIC = "/vehicle/remotecontrol/";

mqttClient = mqtt.connect('mqtt://localhost:1883')

mqttClient.on('connect', function () {
  mqttClient.subscribe(TOPIC, function (err) {
    if (!err) {
      const payload = JSON.stringify({
        status: "ok", 
        data: {
          id: "69601056-18e5-469f-9ff3-7902f893774c",
          name: "",
          uri: "/vehicle/remotecontrol/69601056-18e5-469f-9ff3-7902f893774c"
        }
      });
      mqttClient.publish(TOPIC, payload);
      console.log("publishing", helpers.getByteLength(payload));
    }
  })
});

mqttClient.on('message', function (topic, message) {
  // message is Buffer
  console.log('MQTT message:', message.toString())
  mqttClient.end()
});

server.listen(3000, function listening() {
  let host = server.address().address == "::" ? "127.0.0.1" : server.address().address;
  console.log("starting broker");
  broker.start();
  console.log(`WebSocket listening on http://${host}:${server.address().port}/`);
  console.log(`Serving UI on http://${host}:${server.address().port}/index.html`);
});