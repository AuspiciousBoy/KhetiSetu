const weatherService = require('../services/weatherService');
const { success } = require('../utils/response');

const getWeather = async (req, res, next) => {
  try {
    const { district, state } = req.query;
    const weather = await weatherService.getWeather({ district, state });
    return success(res, weather);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWeather,
};
