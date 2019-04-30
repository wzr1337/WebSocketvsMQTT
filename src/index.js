const express = require('express');
const http = require('http');
const path = require('path');
const url = require('url');
const WebSocket = require('ws');
const broker = require("./broker");
const mqtt = require("./mqttTester");
const samples = require("./samples");
const compression = require('compression');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json())
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

app.get('/rsi/samples/', samples.GETsample);

app.get('/mqtt/testruns/', mqtt.READCollection);
app.post('/mqtt/testruns/', mqtt.CREATEElement);
app.get('/mqtt/testruns/:id', mqtt.READElement);
app.post('/mqtt/testruns/:id', mqtt.UPDATEElement);


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


server.listen(3000, function listening() {
  let host = server.address().address == "::" ? "127.0.0.1" : server.address().address;
  console.log("starting broker");
  broker.start();
  console.log(`WebSocket listening on http://${host}:${server.address().port}/`);
  console.log(`Serving UI on http://${host}:${server.address().port}/index.html`);
});
