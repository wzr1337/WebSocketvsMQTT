var mosca = require('mosca');
var settings = {
		port:1883
		}


const start = () => {
	const broker = new mosca.Server(settings);

	broker.on('ready', function(){
		console.log("Mosca MQTT broker ready.");
		console.log("mqtt://127.0.0.1:"+settings.port)
	});

	broker.on("error", function (err) {
		console.log(err);
	});

	broker.on('clientConnected', function (client) {
		// console.log('Client Connected \t:= ', client.id);
	});

	broker.on('published', function (packet, client) {
		// console.log("Published :=", packet);
	});

	broker.on('subscribed', function (topic, client) {
		// console.log("Subscribed :=", client.packet);
	});

	broker.on('unsubscribed', function (topic, client) {
		// console.log('unsubscribed := ', topic);
	});

	broker.on('clientDisconnecting', function (client) {
		// console.log('clientDisconnecting := ', client.id);
	});

	broker.on('clientDisconnected', function (client) {
		// console.log('Client Disconnected     := ', client.id);
	});
}


module.exports = {
	start
};