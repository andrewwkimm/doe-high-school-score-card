const axios = require('axios');
const { getCache, setCache } = require('./cache');

const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function createCacheKey(origin, destination) {
  return `transit_${origin.trim().toLowerCase().replace(/\s+/g, '_')}_to_${destination.trim().toLowerCase().replace(/\s+/g, '_')}`;
}

async function getTransitTime(origin, destination) {
  if (!origin || !destination) return 'N/A';

  const cacheKey = createCacheKey(origin, destination);
  const cached = getCache(cacheKey);
  if (cached) {
    console.log(`✅ Transit time (cache): ${origin} → ${destination} = ${cached}`);
    return cached;
  }

  const url = `https://maps.googleapis.com/maps/api/directions/json`;
  const params = {
    origin,
    destination,
    mode: 'transit',
    departure_time: 'now',
    key: MAPS_API_KEY
  };

  try {
    const response = await axios.get(url, { params });
    
    // Log full response data for debugging
    console.dir(response.data, { depth: null });

    if (response.data.status !== 'OK') {
      console.error(`❌ Directions API error: ${response.data.status}`);
      if (response.data.error_message) {
        console.error(`🔍 Error message: ${response.data.error_message}`);
      }
      return 'N/A';
    }
    
    const route = response.data.routes?.[0];
    const leg = route?.legs?.[0];
    const durationSec = leg?.duration?.value;

    if (!durationSec) throw new Error('No route found');

    const durationMin = Math.round(durationSec / 60).toString();
    setCache(cacheKey, durationMin);
    console.log(`📡 Transit time (API): ${origin} → ${destination} = ${durationMin}`);
    return durationMin;
  } catch (err) {
    console.error(`❌ Maps API error for ${origin} → ${destination}:`, err.message);
    return 'N/A';
  }
}

module.exports = {
  getTransitTime
};
