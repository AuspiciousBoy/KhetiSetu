const weatherService = require('../services/weatherService');
const { success } = require('../utils/response');

const getWeather = async (req, res, next) => {
  try {
    const { district, state, lat, lon, latitude, longitude } = req.query;

    const rawLat = lat !== undefined && lat !== '' ? lat : latitude;
    const rawLon = lon !== undefined && lon !== '' ? lon : longitude;

    const parsedLat = rawLat !== undefined && rawLat !== '' ? parseFloat(rawLat) : null;
    const parsedLon = rawLon !== undefined && rawLon !== '' ? parseFloat(rawLon) : null;

    const weather = await weatherService.getWeather({
      district,
      state,
      lat: Number.isFinite(parsedLat) ? parsedLat : null,
      lon: Number.isFinite(parsedLon) ? parsedLon : null,
    });
    return success(res, weather);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWeather,
};
