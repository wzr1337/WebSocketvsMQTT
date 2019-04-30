const helpers = require("./helpers");

/**
 * Generates the sample payload of a given size
 * 
 * Expects size as a query parameter
 *
 * @param {*} req
 * @param {*} res
 */
const GETsample = (req, res) => {
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
}

module.exports = {
  GETsample
}