const NodeCache = require('node-cache');

// TTL = 6 hours (in seconds)
const cache = new NodeCache({ stdTTL: 21600, checkperiod: 600 });

function getCache(key) {
  return cache.get(key);
}

function setCache(key, value) {
  cache.set(key, value);
}

module.exports = {
  getCache,
  setCache
};
