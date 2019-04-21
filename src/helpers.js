const LoremIpsum = require("lorem-ipsum").LoremIpsum;

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4
  },
  wordsPerSentence: {
    max: 16,
    min: 4
  }
});


/**
 * Get the yize of a string in Bytes
 *
 * @param {string} str the input string
 * @param {boolean} [pretty=false] return the bytes in human readable format
 * @returns the byte size or the byte size in human readable format
 */
const getByteSize = (str, pretty = false) => {
  const len = Buffer.byteLength(str, 'utf8');
  if (!pretty) return len;
  return  (len > 1024*1024) ? parseInt(len/1024/1024) + "MBytes" : (len > 1024) ? parseInt(len/1024) + "kBytes" : len + "Bytes"
}

/**
 * Generates a random lorem ispum text of given byte size
 *
 * @param {number} [bytes=100] the desired byte size of the returned string in UFT-8
 * @returns string of desired length
 */
const generateRandomString = (bytes = 100) => {
  if(bytes > 1024*256) throw new Error("Can not generate more than 256kBytes of raw text at once. Call multiple times an concat..");
  var str = lorem.generateWords(parseInt(bytes)).slice(0, bytes)
  if ( getByteSize(str) !== bytes) return generateRandomString(bytes); // just in case
  return str;
} 


module.exports = {
  getByteLength: getByteSize,
  generateRandomString
}


//console.log(getByteSize(generateRandomString(256*1024) + generateRandomString(256*1024), true));