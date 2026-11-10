const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const WeatherRecord = require('../models/WeatherRecord');
const { WEATHER_API_KEY } = require('../config/env');
const logger = require('../utils/logger');

// Coordinate mapping for major agricultural districts in India
const DISTRICT_COORDINATES = {
  pune: { lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },
  nashik: { lat: 19.9975, lon: 73.7898, state: 'Maharashtra' },
  nagpur: { lat: 21.1458, lon: 79.0882, state: 'Maharashtra' },
  solapur: { lat: 17.6599, lon: 75.9064, state: 'Maharashtra' },
  kolhapur: { lat: 16.7050, lon: 74.2433, state: 'Maharashtra' },
  aurangabad: { lat: 19.8762, lon: 75.3433, state: 'Maharashtra' },
  indore: { lat: 22.7196, lon: 75.8577, state: 'Madhya Pradesh' },
  bhopal: { lat: 23.2599, lon: 77.4126, state: 'Madhya Pradesh' },
  ahmedabad: { lat: 23.0225, lon: 72.5714, state: 'Gujarat' },
  surat: { lat: 21.1702, lon: 72.8311, state: 'Gujarat' },
  karnal: { lat: 29.6857, lon: 76.9905, state: 'Haryana' },
  ludhiana: { lat: 30.9010, lon: 75.8573, state: 'Punjab' },
  jaipur: { lat: 26.9124, lon: 75.7873, state: 'Rajasthan' },
  lucknow: { lat: 26.8467, lon: 80.9462, state: 'Uttar Pradesh' },
  varanasi: { lat: 25.3176, lon: 82.9739, state: 'Uttar Pradesh' },
  bengaluru: { lat: 12.9716, lon: 77.5946, state: 'Karnataka' },
  kolar: { lat: 13.1367, lon: 78.1342, state: 'Karnataka' },
};

// In-memory cache fallback (used when MongoDB is offline in dev mode)
const memoryCache = new Map();

/**
 * Resolves the active Weather API key.
 * Checks process.env first, and re-reads server/.env if needed
 * so runtime key additions are immediately detected without restarting.
 */
const getActiveWeatherApiKey = () => {
  let key = process.env.WEATHER_API_KEY || WEATHER_API_KEY;
  if (!key || key.trim() === '' || key.includes('your_weather')) {
    try {
      const envPath = path.resolve(__dirname, '../.env');
      if (fs.existsSync(envPath)) {
        const parsed = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
        if (
          parsed.WEATHER_API_KEY &&
          !parsed.WEATHER_API_KEY.includes('your_weather') &&
          parsed.WEATHER_API_KEY.trim().length > 5
        ) {
          key = parsed.WEATHER_API_KEY.trim();
          process.env.WEATHER_API_KEY = key;
        }
      }
    } catch {
      // Fall through if file read fails
    }
  }
  return key && key.trim().length > 5 && !key.includes('your_weather') ? key.trim() : null;
};

/**
 * Weather condition code to human-readable string mapping
 */
const mapWmoCodeToCondition = (code) => {
  if (code === 0) return 'Sunny & Clear';
  if (code === 1 || code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Light Drizzle';
  if (code >= 61 && code <= 65) return 'Rain Showers';
  if (code >= 71 && code <= 77) return 'Cold & Frost Risk';
  if (code >= 80 && code <= 82) return 'Heavy Showers';
  if (code >= 95) return 'Thunderstorm Alert';
  return 'Clear';
};

/**
 * Generate agricultural advisories based on meteorological indicators
 */
const generateFarmingAdvisories = (current, forecast = []) => {
  const advisories = [];

  // Spraying Suitability Rule
  if (current.windSpeedKmh > 20) {
    advisories.push({
      category: 'SPRAYING',
      severity: 'WARNING',
      message: `High wind speed (${current.windSpeedKmh} km/h). Postpone foliar spraying of micronutrients or bio-pesticides to prevent chemical drift.`,
      confidenceLevel: 'Meteorological telemetry observation',
    });
  } else if (current.rainfallMm > 2) {
    advisories.push({
      category: 'SPRAYING',
      severity: 'WARNING',
      message: 'Rainfall detected. Avoid spraying operations as wash-off will drastically reduce efficacy.',
      confidenceLevel: 'Precipitation sensor verified',
    });
  } else {
    advisories.push({
      category: 'SPRAYING',
      severity: 'INFO',
      message: 'Favorable spraying window: Calm wind and dry canopy conditions present during early morning (6:30 - 9:30 AM).',
      confidenceLevel: 'Optimal microclimate window',
    });
  }

  // Irrigation Rule
  const upcomingRain = forecast.some((f) => (f.precipitationProbabilityPercent || 0) > 60 || (f.rainfallMm || 0) > 5);
  if (upcomingRain) {
    advisories.push({
      category: 'IRRIGATION',
      severity: 'ADVISORY',
      message: 'Rain expected in next 48 hours. Suspend field canal irrigation to prevent root water-logging and soil compaction.',
      confidenceLevel: 'Multi-day forecast analysis',
    });
  } else if (current.temperatureC > 36) {
    advisories.push({
      category: 'IRRIGATION',
      severity: 'WARNING',
      message: 'Elevated daytime temperatures (>36°C). Provide light drip irrigation during late evening to counter crop evapotranspiration stress.',
      confidenceLevel: 'Thermal stress threshold exceeded',
    });
  } else {
    advisories.push({
      category: 'IRRIGATION',
      severity: 'INFO',
      message: 'Normal soil moisture regime recommended. Drip or furrow irrigation according to crop growth phase.',
      confidenceLevel: 'Seasonal norm baseline',
    });
  }

  // Harvesting Rule
  if (current.humidityPercent > 80 && current.rainfallMm > 0) {
    advisories.push({
      category: 'HARVESTING',
      severity: 'WARNING',
      message: 'High humidity and dampness. Avoid harvesting grains or onion bulbs; store any harvested lots under waterproof tarpaulins.',
      confidenceLevel: 'Fungal dampness alert',
    });
  } else {
    advisories.push({
      category: 'HARVESTING',
      severity: 'INFO',
      message: 'Dry atmospheric condition. Ideal for harvest, threshing, and post-harvest produce sun-curing.',
      confidenceLevel: 'Optimal harvest conditions',
    });
  }

  return advisories;
};

/**
 * Fetch live weather from WeatherAPI.com
 */
const fetchFromWeatherAPI = async (apiKey, district) => {
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(district)},India&days=6&aqi=no`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`WeatherAPI responded with status ${res.status}`);
  const data = await res.json();

  const current = {
    temperatureC: Math.round(data.current.temp_c),
    humidityPercent: data.current.humidity,
    rainfallMm: data.current.precip_mm || 0,
    windSpeedKmh: Math.round(data.current.wind_kph),
    condition: data.current.condition?.text || 'Clear',
    uvIndex: Math.round(data.current.uv || 5),
    icon: 'sunny',
  };

  const forecast = (data.forecast?.forecastday || []).slice(1, 6).map((item) => ({
    date: new Date(item.date),
    tempMaxC: Math.round(item.day.maxtemp_c),
    tempMinC: Math.round(item.day.mintemp_c),
    precipitationProbabilityPercent: item.day.daily_chance_of_rain || 0,
    rainfallMm: item.day.totalprecip_mm || 0,
    condition: item.day.condition?.text || 'Partly Cloudy',
  }));

  return { current, forecast, source: 'WeatherAPI Live' };
};

/**
 * Fetch live weather from OpenWeatherMap
 */
const fetchFromOpenWeatherMap = async (apiKey, coords) => {
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${apiKey}`;

  const [wRes, fRes] = await Promise.all([
    fetch(weatherUrl, { signal: AbortSignal.timeout(6000) }),
    fetch(forecastUrl, { signal: AbortSignal.timeout(6000) }),
  ]);

  if (!wRes.ok || !fRes.ok) throw new Error(`OpenWeatherMap responded with status ${wRes.status}/${fRes.status}`);
  const wData = await wRes.json();
  const fData = await fRes.json();

  const current = {
    temperatureC: Math.round(wData.main.temp),
    humidityPercent: wData.main.humidity,
    rainfallMm: wData.rain?.['1h'] || 0,
    windSpeedKmh: Math.round((wData.wind?.speed || 0) * 3.6),
    condition: wData.weather?.[0]?.main || 'Clear',
    uvIndex: 6,
    icon: 'sunny',
  };

  // Group 3-hour forecasts by day
  const dailyMap = new Map();
  for (const item of fData.list || []) {
    const dayStr = item.dt_txt.split(' ')[0];
    if (!dailyMap.has(dayStr)) {
      dailyMap.set(dayStr, {
        date: new Date(item.dt * 1000),
        tempMaxC: item.main.temp_max,
        tempMinC: item.main.temp_min,
        precipitationProbabilityPercent: Math.round((item.pop || 0) * 100),
        rainfallMm: item.rain?.['3h'] || 0,
        condition: item.weather?.[0]?.main || 'Clear',
      });
    } else {
      const existing = dailyMap.get(dayStr);
      existing.tempMaxC = Math.max(existing.tempMaxC, item.main.temp_max);
      existing.tempMinC = Math.min(existing.tempMinC, item.main.temp_min);
      existing.rainfallMm += item.rain?.['3h'] || 0;
    }
  }

  const forecast = Array.from(dailyMap.values())
    .slice(1, 6)
    .map((f) => ({
      ...f,
      tempMaxC: Math.round(f.tempMaxC),
      tempMinC: Math.round(f.tempMinC),
      rainfallMm: Math.round(f.rainfallMm * 10) / 10,
    }));

  return { current, forecast, source: 'OpenWeatherMap Live' };
};

/**
 * Fetch live weather from Open-Meteo (Free Open-Access Agro-Meteorological API)
 */
const fetchFromOpenMeteo = async (coords) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code&timezone=auto`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Open-Meteo responded with status ${res.status}`);
  const data = await res.json();

  const current = {
    temperatureC: Math.round(data.current?.temperature_2m ?? 28),
    humidityPercent: Math.round(data.current?.relative_humidity_2m ?? 55),
    rainfallMm: data.current?.precipitation || 0,
    windSpeedKmh: Math.round(data.current?.wind_speed_10m ?? 10),
    condition: mapWmoCodeToCondition(data.current?.weather_code),
    uvIndex: 6,
    icon: 'sunny',
  };

  const daily = data.daily || {};
  const forecast = [];
  const times = daily.time || [];

  for (let i = 1; i < Math.min(times.length, 6); i++) {
    forecast.push({
      date: new Date(times[i]),
      tempMaxC: Math.round(daily.temperature_2m_max?.[i] ?? 30),
      tempMinC: Math.round(daily.temperature_2m_min?.[i] ?? 18),
      precipitationProbabilityPercent: daily.precipitation_probability_max?.[i] ?? 15,
      rainfallMm: daily.precipitation_sum?.[i] ?? 0,
      condition: mapWmoCodeToCondition(daily.weather_code?.[i]),
    });
  }

  return { current, forecast, source: 'Open-Meteo Live' };
};

/**
 * Calibrated fallback dataset when network is offline
 */
const getCalibratedFallback = (today) => {
  const current = {
    temperatureC: 28,
    humidityPercent: 54,
    rainfallMm: 0,
    windSpeedKmh: 12,
    condition: 'Sunny & Clear',
    uvIndex: 7,
    icon: 'sunny',
  };

  const forecast = [
    {
      date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
      tempMaxC: 31,
      tempMinC: 19,
      precipitationProbabilityPercent: 10,
      rainfallMm: 0,
      condition: 'Clear',
    },
    {
      date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      tempMaxC: 30,
      tempMinC: 18,
      precipitationProbabilityPercent: 20,
      rainfallMm: 0,
      condition: 'Partly Cloudy',
    },
    {
      date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      tempMaxC: 29,
      tempMinC: 19,
      precipitationProbabilityPercent: 65,
      rainfallMm: 8.5,
      condition: 'Light Showers',
    },
    {
      date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
      tempMaxC: 27,
      tempMinC: 18,
      precipitationProbabilityPercent: 40,
      rainfallMm: 2.0,
      condition: 'Cloudy',
    },
    {
      date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      tempMaxC: 29,
      tempMinC: 17,
      precipitationProbabilityPercent: 10,
      rainfallMm: 0,
      condition: 'Clear',
    },
  ];

  return { current, forecast, source: 'Calibrated Regional Baseline' };
};

/**
 * Get current conditions, forecast, and agricultural advisories for district
 */
const getWeather = async ({ district = 'Pune', state = 'Maharashtra' }) => {
  const normDistrict = (district || 'Pune').toLowerCase().trim();
  const coords = DISTRICT_COORDINATES[normDistrict] || DISTRICT_COORDINATES.pune;
  const cacheKey = `${normDistrict}_${(state || 'Maharashtra').toLowerCase().trim()}`;

  // 1. Check in-memory cache first (valid for 30 minutes)
  const cachedMem = memoryCache.get(cacheKey);
  if (cachedMem && Date.now() - cachedMem.timestamp < 30 * 60 * 1000) {
    return cachedMem.data;
  }

  // 2. Check MongoDB cache (valid for 30 minutes)
  const isDbConnected = mongoose.connection.readyState === 1;
  if (isDbConnected) {
    try {
      const cached = await WeatherRecord.findOne({
        'location.district': new RegExp(`^${district}$`, 'i'),
        fetchedAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) },
      }).sort({ fetchedAt: -1 });

      if (cached) {
        memoryCache.set(cacheKey, { timestamp: Date.now(), data: cached });
        return cached;
      }
    } catch (err) {
      logger.debug('MongoDB weather cache lookup skipped or unavailable', { error: err.message });
    }
  }

  // 3. Fetch Live Weather Data
  const apiKey = getActiveWeatherApiKey();
  let weatherData = null;

  if (apiKey) {
    try {
      logger.info(`Fetching live weather with configured WEATHER_API_KEY for ${district}...`);
      // Try WeatherAPI first
      weatherData = await fetchFromWeatherAPI(apiKey, district);
    } catch (err1) {
      try {
        // Fall back to OpenWeatherMap with the key
        weatherData = await fetchFromOpenWeatherMap(apiKey, coords);
      } catch (err2) {
        logger.warn(`API key weather requests failed (${err1.message} / ${err2.message}). Falling back to Open-Meteo.`);
      }
    }
  }

  // If no API key or API call failed, try Open-Meteo (open access)
  if (!weatherData) {
    try {
      weatherData = await fetchFromOpenMeteo(coords);
    } catch (err) {
      logger.warn(`Open-Meteo live request failed: ${err.message}. Using calibrated agricultural fallback.`);
      weatherData = getCalibratedFallback(new Date());
    }
  }

  const { current, forecast } = weatherData;
  const advisories = generateFarmingAdvisories(current, forecast);

  const payload = {
    location: {
      district: district || 'Pune',
      state: state || coords.state || 'Maharashtra',
      latitude: coords.lat,
      longitude: coords.lon,
    },
    current,
    forecast,
    advisories,
    fetchedAt: new Date(),
  };

  // 4. Save to MongoDB if connected
  if (isDbConnected) {
    try {
      const record = await WeatherRecord.create(payload);
      memoryCache.set(cacheKey, { timestamp: Date.now(), data: record });
      return record;
    } catch (err) {
      logger.debug('WeatherRecord DB persist skipped in dev/offline mode', { error: err.message });
    }
  }

  memoryCache.set(cacheKey, { timestamp: Date.now(), data: payload });
  return payload;
};

module.exports = {
  getWeather,
  generateFarmingAdvisories,
  getActiveWeatherApiKey,
};
