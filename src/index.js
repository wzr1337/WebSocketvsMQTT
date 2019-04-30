const express = require('express');
const http = require('http');
const path = require('path');
const wsEcho = require('./wsEcho')
const broker = require("./broker");
const mqtt = require("./mqttTester");
const rsi = require("./rsiTester");
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

app.get('/rsi/testruns/', rsi.READCollection);
app.post('/rsi/testruns/', rsi.CREATEElement);
app.get('/rsi/testruns/:id', rsi.READElement);
app.post('/rsi/testruns/:id', rsi.UPDATEElement);


const server = http.createServer(app);

server.listen(3000, function listening() {
  let host = server.address().address == "::" ? "127.0.0.1" : server.address().address;
  console.log("starting broker");
  broker.start();
  wsEcho.start(server);
  console.log(`WebSocket listening on http://${host}:${server.address().port}/`);
  console.log(`Serving UI on http://${host}:${server.address().port}/index.html`);
});
