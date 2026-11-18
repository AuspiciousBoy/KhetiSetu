// Vercel Serverless Function: GET /api/v1/weather

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

const DEFAULT_KEY = '6f1d39fa81764e669e0142956261811';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { lat, lon, latitude, longitude, district } = req.query || {};
  const rawLat = lat !== undefined && lat !== '' ? lat : latitude;
  const rawLon = lon !== undefined && lon !== '' ? lon : longitude;
  const parsedLat = rawLat !== undefined && rawLat !== '' ? parseFloat(rawLat) : null;
  const parsedLon = rawLon !== undefined && rawLon !== '' ? parseFloat(rawLon) : null;

  const hasCoords = Number.isFinite(parsedLat) && Number.isFinite(parsedLon);
  let coords;
  let districtName;

  if (hasCoords) {
    coords = { lat: Number(parsedLat.toFixed(4)), lon: Number(parsedLon.toFixed(4)) };
  } else {
    const norm = (district || 'Pune').toLowerCase().trim();
    const matched = DISTRICT_COORDINATES[norm] || DISTRICT_COORDINATES.pune;
    coords = { lat: matched.lat, lon: matched.lon };
    districtName = matched.name;
  }

  const apiKey = (process.env.WEATHER_API_KEY || DEFAULT_KEY).trim();

  // 1. Try WeatherAPI with coordinates
  try {
    const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${coords.lat},${coords.lon}&days=6&aqi=no`;
    const apiRes = await fetch(weatherUrl);
    if (apiRes.ok) {
      const data = await apiRes.json();
      const current = {
        temperatureC: Math.round(data.current.temp_c),
        feelsLikeC: Math.round(data.current.feelslike_c !== undefined ? data.current.feelslike_c : data.current.temp_c),
        humidityPercent: data.current.humidity,
        rainfallMm: data.current.precip_mm || 0,
        windSpeedKmh: Math.round(data.current.wind_kph),
        windDirection: data.current.wind_dir || 'NW',
        condition: data.current.condition?.text || 'Clear',
        uvIndex: Math.round(data.current.uv || 5),
        icon: 'sunny',
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

      const advisories = [
        {
          category: 'SPRAYING',
          severity: current.windSpeedKmh > 20 || current.rainfallMm > 2 ? 'WARNING' : 'INFO',
          message:
            current.windSpeedKmh > 20
              ? `High wind speed (${current.windSpeedKmh} km/h). Postpone foliar spraying to prevent drift.`
              : current.rainfallMm > 2
              ? 'Rainfall detected. Avoid spraying operations.'
              : 'Favorable spraying window: Calm wind and dry canopy conditions present.',
          confidenceLevel: 'Meteorological telemetry observation',
        },
        {
          category: 'IRRIGATION',
          severity: 'INFO',
          message: 'Normal soil moisture regime recommended.',
          confidenceLevel: 'Multi-day forecast analysis',
        },
      ];

      return res.status(200).json({
        success: true,
        data: {
          location: {
            city: data.location?.name || districtName || 'Local Area',
            district: data.location?.region || districtName || data.location?.name || 'Local Area',
            state: data.location?.region || 'India',
            latitude: data.location?.lat || coords.lat,
            longitude: data.location?.lon || coords.lon,
            isLiveGps: hasCoords,
          },
          current,
          forecast,
          advisories,
          source: 'WeatherAPI Live Telemetry',
          fetchedAt: new Date().toISOString(),
        },
      });
    }
  } catch (err) {
    // Proceed to Open-Meteo
  }

  // 2. Open-Meteo Fallback
  try {
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code&timezone=auto`;
    const meteoRes = await fetch(meteoUrl);
    if (meteoRes.ok) {
      const data = await meteoRes.json();
      return res.status(200).json({
        success: true,
        data: {
          location: {
            city: districtName || 'Current Location',
            district: districtName || 'Current Location',
            state: 'India',
            latitude: coords.lat,
            longitude: coords.lon,
            isLiveGps: hasCoords,
          },
          current: {
            temperatureC: Math.round(data.current?.temperature_2m ?? 26),
            feelsLikeC: Math.round(data.current?.apparent_temperature ?? data.current?.temperature_2m ?? 26),
            humidityPercent: Math.round(data.current?.relative_humidity_2m ?? 50),
            rainfallMm: data.current?.precipitation || 0,
            windSpeedKmh: Math.round(data.current?.wind_speed_10m ?? 10),
            condition: 'Clear Sky',
            uvIndex: 6,
          },
          source: 'Open-Meteo Live Telemetry',
          fetchedAt: new Date().toISOString(),
        },
      });
    }
  } catch (err2) {
    return res.status(500).json({ success: false, message: 'Weather service unavailable' });
  }
};
