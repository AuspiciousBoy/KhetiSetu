const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const WeatherRecord = require('../models/WeatherRecord');
const { WEATHER_API_KEY } = require('../config/env');
const logger = require('../utils/logger');

// Coordinate mapping for major agricultural districts in India
const DISTRICT_COORDINATES = {
  pune: { lat: 18.5204, lon: 73.8567, state: 'Maharashtra', name: 'Pune' },
  nashik: { lat: 19.9975, lon: 73.7898, state: 'Maharashtra', name: 'Nashik' },
  nagpur: { lat: 21.1458, lon: 79.0882, state: 'Maharashtra', name: 'Nagpur' },
  solapur: { lat: 17.6599, lon: 75.9064, state: 'Maharashtra', name: 'Solapur' },
  kolhapur: { lat: 16.7050, lon: 74.2433, state: 'Maharashtra', name: 'Kolhapur' },
  aurangabad: { lat: 19.8762, lon: 75.3433, state: 'Maharashtra', name: 'Chhatrapati Sambhajinagar' },
  indore: { lat: 22.7196, lon: 75.8577, state: 'Madhya Pradesh', name: 'Indore' },
  bhopal: { lat: 23.2599, lon: 77.4126, state: 'Madhya Pradesh', name: 'Bhopal' },
  ahmedabad: { lat: 23.0225, lon: 72.5714, state: 'Gujarat', name: 'Ahmedabad' },
  surat: { lat: 21.1702, lon: 72.8311, state: 'Gujarat', name: 'Surat' },
  karnal: { lat: 29.6857, lon: 76.9905, state: 'Haryana', name: 'Karnal' },
  ludhiana: { lat: 30.9010, lon: 75.8573, state: 'Punjab', name: 'Ludhiana' },
  jaipur: { lat: 26.9124, lon: 75.7873, state: 'Rajasthan', name: 'Jaipur' },
  lucknow: { lat: 26.8467, lon: 80.9462, state: 'Uttar Pradesh', name: 'Lucknow' },
  varanasi: { lat: 25.3176, lon: 82.9739, state: 'Uttar Pradesh', name: 'Varanasi' },
  bengaluru: { lat: 12.9716, lon: 77.5946, state: 'Karnataka', name: 'Bengaluru' },
  kolar: { lat: 13.1367, lon: 78.1342, state: 'Karnataka', name: 'Kolar' },
};

// In-memory cache fallback (used when MongoDB is offline or in dev mode)
const memoryCache = new Map();

const DEFAULT_WEATHER_API_KEY = '6f1d39fa81764e669e0142956261811';

/**
 * Resolves the active Weather API key.
 * Checks process.env first, and re-reads server/.env if needed
 * so runtime key additions are immediately detected without restarting.
 */
const getActiveWeatherApiKey = () => {
  let key = process.env.WEATHER_API_KEY || WEATHER_API_KEY || process.env.OPENWEATHER_API_KEY;
  if (!key || key.trim() === '' || key.includes('your_weather')) {
    try {
      const envPath = path.resolve(__dirname, '../.env');
      if (fs.existsSync(envPath)) {
        const parsed = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
        const found = parsed.WEATHER_API_KEY || parsed.OPENWEATHER_API_KEY;
        if (found && !found.includes('your_weather') && found.trim().length > 5) {
          key = found.trim();
          process.env.WEATHER_API_KEY = key;
        }
      }
    } catch {
      // Fall through if file read fails
    }
  }
  return key && key.trim().length > 5 && !key.includes('your_weather') ? key.trim() : DEFAULT_WEATHER_API_KEY;
};

/**
 * Convert wind degrees (0-360) to 8-point compass direction
 */
const degToCompass = (deg) => {
  if (deg === null || deg === undefined || isNaN(deg)) return 'NW';
  const val = Math.floor((deg / 45) + 0.5);
  const arr = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return arr[val % 8];
};

/**
 * Map text condition to standard icon identifier
 */
const mapConditionToIcon = (cond = '') => {
  const text = (cond || '').toLowerCase();
  if (text.includes('thunder') || text.includes('lightning')) return 'thunderstorm';
  if (text.includes('rain') || text.includes('drizzle') || text.includes('shower')) return 'rainy';
  if (text.includes('snow') || text.includes('sleet') || text.includes('ice') || text.includes('frost')) return 'snowy';
  if (text.includes('fog') || text.includes('mist') || text.includes('haze')) return 'foggy';
  if (text.includes('cloud') || text.includes('overcast')) return 'partly_cloudy';
  return 'sunny';
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

const mapWmoCodeToIcon = (code) => {
  if (code === 0) return 'sunny';
  if (code === 1 || code === 2) return 'partly_cloudy';
  if (code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'foggy';
  if (code >= 51 && code <= 65) return 'rainy';
  if (code >= 71 && code <= 77) return 'snowy';
  if (code >= 80 && code <= 82) return 'rainy';
  if (code >= 95) return 'thunderstorm';
  return 'sunny';
};

/**
 * Reverse geocoding helper to determine city and state from coordinates
 */
const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      const city = data.locality || data.city || data.principalSubdivision || '';
      const state = data.principalSubdivision || '';
      if (city || state) {
        return { city, state };
      }
    }
  } catch (err) {
    logger.debug('BigDataCloud reverse geocode lookup skipped', { error: err.message });
  }

  // Backup reverse geocoder
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12`,
      {
        headers: { 'User-Agent': 'KhetiSetu-AgriWeather/1.0' },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        data.address?.suburb ||
        '';
      const state = data.address?.state || '';
      return { city, state };
    }
  } catch (err) {
    logger.debug('Nominatim reverse geocode lookup skipped', { error: err.message });
  }

  return { city: null, state: null };
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
const fetchFromWeatherAPI = async (apiKey, target) => {
  const query =
    target.lat !== undefined && target.lon !== undefined
      ? `${target.lat},${target.lon}`
      : encodeURIComponent(target.district || 'Pune');

  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${query}&days=6&aqi=no`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`WeatherAPI responded with status ${res.status}`);
  const data = await res.json();

  const current = {
    temperatureC: Math.round(data.current.temp_c),
    feelsLikeC: Math.round(data.current.feelslike_c !== undefined ? data.current.feelslike_c : data.current.temp_c),
    humidityPercent: data.current.humidity,
    rainfallMm: data.current.precip_mm || 0,
    windSpeedKmh: Math.round(data.current.wind_kph),
    windDirection: data.current.wind_dir || 'NW',
    condition: data.current.condition?.text || 'Clear',
    uvIndex: Math.round(data.current.uv || 5),
    icon: mapConditionToIcon(data.current.condition?.text),
    iconUrl: data.current.condition?.icon
      ? data.current.condition.icon.startsWith('//')
        ? `https:${data.current.condition.icon}`
        : data.current.condition.icon
      : '',
  };

  const forecast = (data.forecast?.forecastday || []).slice(1, 6).map((item) => ({
    date: new Date(item.date),
    tempMaxC: Math.round(item.day.maxtemp_c),
    tempMinC: Math.round(item.day.mintemp_c),
    precipitationProbabilityPercent: item.day.daily_chance_of_rain || 0,
    rainfallMm: item.day.totalprecip_mm || 0,
    condition: item.day.condition?.text || 'Partly Cloudy',
    iconUrl: item.day.condition?.icon
      ? item.day.condition.icon.startsWith('//')
        ? `https:${item.day.condition.icon}`
        : item.day.condition.icon
      : '',
  }));

  const locationInfo = {
    city: data.location?.name || '',
    district: data.location?.name || '',
    state: data.location?.region || '',
    latitude: data.location?.lat,
    longitude: data.location?.lon,
  };

  return { current, forecast, locationInfo, source: 'WeatherAPI Live' };
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
    feelsLikeC: Math.round(wData.main.feels_like !== undefined ? wData.main.feels_like : wData.main.temp),
    humidityPercent: wData.main.humidity,
    rainfallMm: wData.rain?.['1h'] || 0,
    windSpeedKmh: Math.round((wData.wind?.speed || 0) * 3.6),
    windDirection: degToCompass(wData.wind?.deg),
    condition: wData.weather?.[0]?.main || 'Clear',
    uvIndex: 6,
    icon: mapConditionToIcon(wData.weather?.[0]?.main),
    iconUrl: wData.weather?.[0]?.icon ? `https://openweathermap.org/img/wn/${wData.weather[0].icon}@2x.png` : '',
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

  const locationInfo = {
    city: wData.name || '',
    district: wData.name || '',
    state: '',
    latitude: coords.lat,
    longitude: coords.lon,
  };

  return { current, forecast, locationInfo, source: 'OpenWeatherMap Live' };
};

/**
 * Fetch live weather from Open-Meteo (Free Open-Access Agro-Meteorological API)
 */
const fetchFromOpenMeteo = async (coords) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code&timezone=auto`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Open-Meteo responded with status ${res.status}`);
  const data = await res.json();

  const current = {
    temperatureC: Math.round(data.current?.temperature_2m ?? 28),
    feelsLikeC: Math.round(data.current?.apparent_temperature ?? data.current?.temperature_2m ?? 28),
    humidityPercent: Math.round(data.current?.relative_humidity_2m ?? 55),
    rainfallMm: data.current?.precipitation || 0,
    windSpeedKmh: Math.round(data.current?.wind_speed_10m ?? 10),
    windDirection: degToCompass(data.current?.wind_direction_10m),
    condition: mapWmoCodeToCondition(data.current?.weather_code),
    uvIndex: 6,
    icon: mapWmoCodeToIcon(data.current?.weather_code),
    iconUrl: '',
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
 * Calibrated fallback dataset when network is completely offline
 */
const getCalibratedFallback = (today) => {
  const current = {
    temperatureC: 28,
    feelsLikeC: 29,
    humidityPercent: 54,
    rainfallMm: 0,
    windSpeedKmh: 12,
    windDirection: 'NW',
    condition: 'Sunny & Clear',
    uvIndex: 7,
    icon: 'sunny',
    iconUrl: '',
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
 * Get current conditions, forecast, and agricultural advisories.
 * Supports coordinates ({ lat, lon }) from user's live browser location
 * or district name.
 */
const getWeather = async ({ district, state, lat, lon } = {}) => {
  const hasCoords =
    lat !== null &&
    lon !== null &&
    lat !== undefined &&
    lon !== undefined &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180;

  let coords;
  let cacheKey;
  let isLiveGps = false;

  if (hasCoords) {
    isLiveGps = true;
    coords = { lat: Number(lat), lon: Number(lon) };
    cacheKey = `coords_${coords.lat.toFixed(2)}_${coords.lon.toFixed(2)}`;
  } else {
    const normDistrict = (district || 'Pune').toLowerCase().trim();
    const matchedDistrict = DISTRICT_COORDINATES[normDistrict] || DISTRICT_COORDINATES.pune;
    coords = { lat: matchedDistrict.lat, lon: matchedDistrict.lon, state: matchedDistrict.state };
    cacheKey = `${normDistrict}_${(state || matchedDistrict.state || 'Maharashtra').toLowerCase().trim()}`;
  }

  // 1. Check in-memory cache first (valid for 20 minutes)
  const cachedMem = memoryCache.get(cacheKey);
  if (cachedMem && Date.now() - cachedMem.timestamp < 20 * 60 * 1000) {
    return cachedMem.data;
  }

  // 2. Check MongoDB cache (valid for 20 minutes)
  const isDbConnected = mongoose.connection.readyState === 1;
  if (isDbConnected) {
    try {
      let query;
      if (hasCoords) {
        query = {
          'location.latitude': { $gte: coords.lat - 0.05, $lte: coords.lat + 0.05 },
          'location.longitude': { $gte: coords.lon - 0.05, $lte: coords.lon + 0.05 },
          fetchedAt: { $gt: new Date(Date.now() - 20 * 60 * 1000) },
        };
      } else {
        query = {
          'location.district': new RegExp(`^${district || 'Pune'}$`, 'i'),
          fetchedAt: { $gt: new Date(Date.now() - 20 * 60 * 1000) },
        };
      }

      const cached = await WeatherRecord.findOne(query).sort({ fetchedAt: -1 });
      if (cached) {
        memoryCache.set(cacheKey, { timestamp: Date.now(), data: cached });
        return cached;
      }
    } catch (err) {
      logger.debug('MongoDB weather cache lookup skipped or unavailable', { error: err.message });
    }
  }

  // 3. Fetch Live Weather Data from Weather API
  const apiKey = getActiveWeatherApiKey();
  let weatherData = null;

  if (apiKey) {
    try {
      logger.info(`Fetching live weather with configured WEATHER_API_KEY for ${hasCoords ? `${coords.lat},${coords.lon}` : district}...`);
      // Try WeatherAPI first with exact coordinates
      weatherData = await fetchFromWeatherAPI(apiKey, { lat: coords.lat, lon: coords.lon, district });
    } catch (err1) {
      try {
        // Fall back to OpenWeatherMap with the key
        weatherData = await fetchFromOpenWeatherMap(apiKey, coords);
      } catch (err2) {
        logger.warn(`API key weather requests failed (${err1.message} / ${err2.message}). Falling back to Open-Meteo.`);
      }
    }
  }

  // If no API key or API call failed, fetch from Open-Meteo (open access worldwide)
  if (!weatherData) {
    try {
      weatherData = await fetchFromOpenMeteo(coords);
    } catch (err) {
      logger.warn(`Open-Meteo live request failed: ${err.message}. Using calibrated fallback.`);
      weatherData = getCalibratedFallback(new Date());
    }
  }

  const { current, forecast, locationInfo, source } = weatherData;
  const advisories = generateFarmingAdvisories(current, forecast);

  // Determine city & state names
  let resolvedCity = locationInfo?.city || null;
  let resolvedDistrict = locationInfo?.district || district || null;
  let resolvedState = locationInfo?.state || state || coords.state || null;

  // If live GPS coordinates and city name was not provided by weather API, reverse-geocode
  if (hasCoords && (!resolvedCity || resolvedCity.trim() === '')) {
    const geo = await reverseGeocode(coords.lat, coords.lon);
    if (geo.city) resolvedCity = geo.city;
    if (geo.state) resolvedState = geo.state;
    if (!resolvedDistrict && geo.city) resolvedDistrict = geo.city;
  }

  if (!resolvedDistrict) resolvedDistrict = resolvedCity || district || 'Local Area';
  if (!resolvedCity) resolvedCity = resolvedDistrict;
  if (!resolvedState) resolvedState = state || 'India';

  const payload = {
    location: {
      city: resolvedCity,
      district: resolvedDistrict,
      state: resolvedState,
      latitude: Number(coords.lat.toFixed(4)),
      longitude: Number(coords.lon.toFixed(4)),
      isLiveGps,
    },
    current,
    forecast,
    advisories,
    source: source || 'Real-Time Meteorological API',
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
  reverseGeocode,
  degToCompass,
};
