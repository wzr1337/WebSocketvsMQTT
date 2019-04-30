
const url = require('url');
const WebSocket = require('ws');


const start = (server) => {
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
}

module.exports = {
  start
}