
const helpers = require("./helpers");
const mqtt = require("mqtt");
const uuidv4 = require('uuid/v4');

// global memory
let runs = {
}

const RUN_PROPERTIES = ['state'];

const run = (id, payloadSize) => {
  if (!id || id === "") throw new Error("Need test run `id`");
  console.log(`running MQTT test with ${payloadSize} messages`);

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
    runs[id].state = "finished";
  });
}

/**
 * Creates a new Test run
 * 
 * expects the POST body to contain a `size` field 
 * size regex is ^[0-9]+[kKmM]?B?$
 *
 * @param {*} req
 * @param {*} res
 */
const CREATEElement = (req, res) => {
  if (!req.body.size || null === req.body.size.match(/^[0-9]+[kKmM]?B?$/)) {
    res.status(400);
    res.json({status: "error", message: "malformed size in JSON body"});
    return;
  }
  const id = uuidv4()
  const newTest = {
    id,
    name: "",
    uri: req.url + id,
    state: "initialized",
    log: [],
    result: {}
  }
  runs[id] = newTest;
  res.set('Location', newTest.uri);
  res.status(201);
  res.json({status: "ok"});

}

const READElement = (req, res) => {
  const id = req.params.id;
  if (!id || !runs[id]) {
    res.status(404);
    res.json({status: "error", message: "Are you sure this testrun exists? I can not find it.."});
    return;
  }
  res.status(200);
  res.json({status: "ok", data: runs[id]});
}

const READCollection = (req, res) => {
  res.status(200);
  res.json({status: "ok", data: Object.values(runs)});
}

const UPDATEElement = (req, res) => {
  const id = req.params.id;
  if (!id || !runs[id]) {
    res.status(404);
    res.json({status: "error", message: "Are you sure this testrun exists? I can not find it.."});
    return;
  }
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400);
    res.json({status: "error", message: "You did not tell me what to do.. POST body empty"});
    return;
  }
  let newState = req.body;

  // for each property, assign.. others leave aside
  RUN_PROPERTIES.map((property) => {
    if (newState[property]) runs[id][property] = newState[property];
  });

  if(newState.state && newState.state === "started") {
    run(id, newState.size || runs[id].size)// needed
  }

  res.status(200);
  res.json({status: "ok"});
}


module.exports = {
  READCollection,
  CREATEElement,
  READElement,
  UPDATEElement
}