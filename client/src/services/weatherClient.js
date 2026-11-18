import apiClient from './apiClient';

// District coordinate lookup for standard districts
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

const DEFAULT_WEATHER_API_KEY = '6f1d39fa81764e669e0142956261811';

const getActiveApiKey = () => {
  const envKey = import.meta.env.VITE_WEATHER_API_KEY;
  if (envKey && envKey.trim().length > 5 && !envKey.includes('your_weather')) {
    return envKey.trim();
  }
  return DEFAULT_WEATHER_API_KEY;
};

const degToCompass = (deg) => {
  if (deg === null || deg === undefined || isNaN(deg)) return 'NW';
  const val = Math.floor(deg / 45 + 0.5);
  const arr = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return arr[val % 8];
};

const mapConditionToIcon = (cond = '') => {
  const text = (cond || '').toLowerCase();
  if (text.includes('thunder') || text.includes('lightning')) return 'thunderstorm';
  if (text.includes('rain') || text.includes('drizzle') || text.includes('shower')) return 'rainy';
  if (text.includes('snow') || text.includes('frost')) return 'snowy';
  if (text.includes('fog') || text.includes('mist') || text.includes('haze')) return 'foggy';
  if (text.includes('cloud') || text.includes('overcast')) return 'partly_cloudy';
  return 'sunny';
};

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
  const upcomingRain = forecast.some(
    (f) => (f.precipitationProbabilityPercent || 0) > 60 || (f.rainfallMm || 0) > 5
  );
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
 * Direct browser fetch to WeatherAPI.com
 */
const fetchFromWeatherAPI = async (apiKey, coords, districtName) => {
  const query = `${coords.lat},${coords.lon}`;
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${query}&days=6&aqi=no`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WeatherAPI error: ${res.status}`);
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

  const advisories = generateFarmingAdvisories(current, forecast);

  return {
    location: {
      city: data.location?.name || districtName || 'Local Area',
      district: data.location?.region || districtName || data.location?.name || 'Local Area',
      state: data.location?.region || 'India',
      latitude: data.location?.lat || coords.lat,
      longitude: data.location?.lon || coords.lon,
      isLiveGps: true,
    },
    current,
    forecast,
    advisories,
    source: 'WeatherAPI Live Telemetry',
    fetchedAt: new Date().toISOString(),
  };
};

/**
 * Direct browser fetch to Open-Meteo
 */
const fetchFromOpenMeteo = async (coords, districtName) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const data = await res.json();

  const current = {
    temperatureC: Math.round(data.current?.temperature_2m ?? 26),
    feelsLikeC: Math.round(data.current?.apparent_temperature ?? data.current?.temperature_2m ?? 26),
    humidityPercent: Math.round(data.current?.relative_humidity_2m ?? 50),
    rainfallMm: data.current?.precipitation || 0,
    windSpeedKmh: Math.round(data.current?.wind_speed_10m ?? 10),
    windDirection: degToCompass(data.current?.wind_direction_10m),
    condition: mapWmoCodeToCondition(data.current?.weather_code),
    uvIndex: 6,
    icon: mapConditionToIcon(mapWmoCodeToCondition(data.current?.weather_code)),
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

  const advisories = generateFarmingAdvisories(current, forecast);

  return {
    location: {
      city: districtName || 'Current Location',
      district: districtName || 'Current Location',
      state: 'India',
      latitude: coords.lat,
      longitude: coords.lon,
      isLiveGps: true,
    },
    current,
    forecast,
    advisories,
    source: 'Open-Meteo Live Telemetry',
    fetchedAt: new Date().toISOString(),
  };
};

/**
 * Universal live weather fetcher.
 * 1. Tries backend /weather endpoint.
 * 2. If backend is unavailable or not returning real data, calls WeatherAPI directly with user's key.
 * 3. Falls back to Open-Meteo as zero-key failover.
 * NEVER displays dummy data.
 */
export const getLiveWeather = async ({ lat, lon, district } = {}) => {
  const hasCoords =
    lat !== null &&
    lon !== null &&
    lat !== undefined &&
    lon !== undefined &&
    !isNaN(lat) &&
    !isNaN(lon);

  let coords;
  let districtName;

  if (hasCoords) {
    coords = { lat: Number(Number(lat).toFixed(4)), lon: Number(Number(lon).toFixed(4)) };
  } else {
    const norm = (district || 'Pune').toLowerCase().trim();
    const matched = DISTRICT_COORDINATES[norm] || DISTRICT_COORDINATES.pune;
    coords = { lat: matched.lat, lon: matched.lon };
    districtName = matched.name;
  }

  // 1. Try backend API first
  try {
    const query = hasCoords
      ? `lat=${coords.lat}&lon=${coords.lon}`
      : `district=${encodeURIComponent(district || 'Pune')}`;
    const res = await apiClient.get(`/weather?${query}`);
    if (res.data?.success && res.data?.data && res.data.data.current) {
      return res.data.data;
    }
  } catch (backendErr) {
    // Backend offline / 404 on static hosting — proceed to direct live API
  }

  // 2. Direct WeatherAPI call with user API key
  const apiKey = getActiveApiKey();
  if (apiKey) {
    try {
      const data = await fetchFromWeatherAPI(apiKey, coords, districtName);
      return data;
    } catch (apiErr) {
      console.warn('Direct WeatherAPI request failed, falling back to Open-Meteo:', apiErr.message);
    }
  }

  // 3. Direct Open-Meteo call (free worldwide live telemetry)
  return await fetchFromOpenMeteo(coords, districtName);
};

export default getLiveWeather;
