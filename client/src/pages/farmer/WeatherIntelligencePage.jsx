import React, { useState, useEffect, useCallback } from 'react';
import {
  Sun,
  CloudRain,
  CloudSun,
  CloudFog,
  CloudLightning,
  Cloud,
  MapPin,
  MapPinOff,
  Navigation,
  RefreshCw,
  AlertTriangle,
  Thermometer,
  Droplets,
  Wind,
  CheckCircle2,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import getLiveWeather from '../../services/weatherClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { useTranslation } from '../../i18n/LanguageContext';

const WeatherConditionIcon = ({ icon, condition, className = 'w-10 h-10' }) => {
  const cond = (condition || '').toLowerCase();
  const iconType = (icon || '').toLowerCase();

  if (iconType === 'thunderstorm' || cond.includes('thunder') || cond.includes('lightning')) {
    return <CloudLightning className={`${className} text-amber-300`} />;
  }
  if (iconType === 'rainy' || cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower')) {
    return <CloudRain className={`${className} text-sky-300`} />;
  }
  if (iconType === 'foggy' || cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) {
    return <CloudFog className={`${className} text-slate-300`} />;
  }
  if (iconType === 'partly_cloudy' || cond.includes('partly') || cond.includes('scattered')) {
    return <CloudSun className={`${className} text-amber-200`} />;
  }
  if (iconType === 'cloudy' || cond.includes('cloud') || cond.includes('overcast')) {
    return <Cloud className={`${className} text-slate-300`} />;
  }
  return <Sun className={`${className} text-amber-400`} />;
};

const WeatherIntelligencePage = () => {
  const { t } = useTranslation();
  const [district, setDistrict] = useState('Pune');
  const [coords, setCoords] = useState(null);
  const [locationMode, setLocationMode] = useState('detecting'); // 'detecting' | 'gps' | 'manual'
  const [permissionStatus, setPermissionStatus] = useState('requesting'); // 'requesting' | 'granted' | 'denied' | 'unavailable'
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Core weather fetcher using universal weatherClient
  const fetchWeather = useCallback(async (params = {}, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setApiError(null);

      const targetLat = params.lat !== undefined ? params.lat : coords?.lat;
      const targetLon = params.lon !== undefined ? params.lon : coords?.lon;
      const targetDistrict = params.district || district;

      const data = await getLiveWeather({
        lat: targetLat,
        lon: targetLon,
        district: targetDistrict,
      });

      if (data && data.current) {
        setWeatherData(data);
      } else {
        throw new Error('Could not retrieve meteorological data');
      }
    } catch (err) {
      console.error('Failed to load weather records', err);
      setApiError(err.message || 'Unable to connect to weather telemetry service');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coords, district]);

  // Request browser geolocation
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPermissionStatus('unavailable');
      setLocationMode('manual');
      fetchWeather({ district });
      return;
    }

    setLocationMode('detecting');
    setPermissionStatus('requesting');
    setApiError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = {
          lat: Number(latitude.toFixed(4)),
          lon: Number(longitude.toFixed(4)),
        };
        setCoords(newCoords);
        setPermissionStatus('granted');
        setLocationMode('gps');
        fetchWeather(newCoords);
      },
      (error) => {
        console.warn('Geolocation error or permission denied:', error.message);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionStatus('denied');
        } else {
          setPermissionStatus('unavailable');
        }
        setLocationMode('manual');
        // Graceful fallback to default district so UI remains functional
        fetchWeather({ district });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [district, fetchWeather]);

  // Trigger geolocation detection on initial mount
  useEffect(() => {
    requestLocation();
  }, []);

  // Handle manual district selection
  const handleDistrictChange = (newDistrict) => {
    setDistrict(newDistrict);
    setLocationMode('manual');
    setCoords(null);
    fetchWeather({ district: newDistrict });
  };

  // Handle refresh button
  const handleRefresh = () => {
    if (locationMode === 'gps' && coords) {
      fetchWeather(coords, true);
    } else {
      fetchWeather({ district }, true);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Top Header & Location Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface rounded-[24px] p-6 border border-surface-variant soil-shadow">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
              {t('weatherPage.headerBadge')}
            </span>
            {locationMode === 'gps' && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                {t('weatherPage.liveLocation')}
              </span>
            )}
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
            {t('weatherPage.pageTitle')}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t('weatherPage.pageSubtitle')}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Live GPS button */}
          <button
            onClick={requestLocation}
            disabled={locationMode === 'detecting' || refreshing}
            className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 rounded-[14px] transition-all ${
              locationMode === 'gps'
                ? 'bg-primary text-on-primary soil-shadow'
                : 'bg-surface-container hover:bg-surface-container-high text-primary border border-surface-variant'
            }`}
            title="Detect actual current location via GPS"
          >
            <Navigation className={`w-3.5 h-3.5 ${locationMode === 'detecting' ? 'animate-spin' : ''}`} />
            <span>
              {locationMode === 'detecting'
                ? t('weatherPage.detectingLocation')
                : t('weatherPage.useCurrentLocation')}
            </span>
          </button>

          {/* District selector override */}
          <div className="flex items-center gap-2">
            <select
              value={locationMode === 'gps' ? '' : district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="bg-surface-container text-on-surface rounded-[14px] py-2.5 px-3 text-xs border border-surface-variant font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {locationMode === 'gps' && (
                <option value="" disabled>
                  📍 {weatherData?.location?.city || weatherData?.location?.district || t('weatherPage.currentLocation')} (GPS)
                </option>
              )}
              <option value="Pune">Pune (पुणे)</option>
              <option value="Nashik">Nashik (नाशिक)</option>
              <option value="Nagpur">Nagpur (नागपूर)</option>
              <option value="Solapur">Solapur (सोलापूर)</option>
              <option value="Kolhapur">Kolhapur (कोल्हापूर)</option>
              <option value="Indore">Indore (इंदौर)</option>
              <option value="Bhopal">Bhopal (भोपाल)</option>
              <option value="Ahmedabad">Ahmedabad (अहमदाबाद)</option>
              <option value="Surat">Surat (सूरत)</option>
              <option value="Karnal">Karnal (करनाल)</option>
              <option value="Ludhiana">Ludhiana (लुधियाना)</option>
              <option value="Jaipur">Jaipur (जयपुर)</option>
              <option value="Lucknow">Lucknow (लखनऊ)</option>
              <option value="Varanasi">Varanasi (वाराणसी)</option>
              <option value="Bengaluru">Bengaluru (बेंगलुरु)</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-[14px] border border-surface-variant transition-colors"
            title={t('weatherPage.refreshWeather')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Permission Denied Alert Banner */}
      {permissionStatus === 'denied' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-[20px] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <MapPinOff className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {t('weatherPage.locationPermissionDenied')}
              </h4>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-1 leading-relaxed max-w-2xl">
                {t('weatherPage.locationPermissionNotice')}
              </p>
            </div>
          </div>
          <button
            onClick={requestLocation}
            className="shrink-0 text-xs font-bold px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-[12px] transition-colors shadow-sm"
          >
            {t('weatherPage.retryLocation')}
          </button>
        </div>
      )}

      {/* API Error Banner if any */}
      {apiError && (
        <div className="bg-error-container/20 border border-error/30 rounded-[20px] p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-error shrink-0" />
          <p className="text-xs text-on-surface font-medium">{apiError}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-64 rounded-[24px]" />
          <Skeleton className="h-48 rounded-[24px]" />
          <Skeleton className="h-56 rounded-[24px]" />
        </div>
      ) : (
        <>
          {/* Main Current Conditions Hero Card */}
          <div className="relative overflow-hidden bg-primary text-on-primary rounded-[28px] p-6 sm:p-10 grain-overlay soil-shadow flex flex-col lg:flex-row justify-between gap-8 items-start lg:items-center">
            {/* Left section: Temperature, condition, city, feels-like */}
            <div className="flex flex-col gap-3 z-10 max-w-md">
              <div className="flex items-center gap-2.5">
                <WeatherConditionIcon
                  icon={weatherData?.current?.icon}
                  condition={weatherData?.current?.condition}
                  className="w-8 h-8 shrink-0"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-secondary-fixed font-mono">
                  {t('weatherPage.liveAgriConditions')}
                </span>
                {weatherData?.location?.isLiveGps && (
                  <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    GPS Live
                  </span>
                )}
              </div>

              {/* Big Temperature Display */}
              <div className="flex items-baseline gap-4 mt-1">
                <span className="font-display font-bold text-6xl sm:text-7xl text-secondary-fixed font-mono tracking-tight">
                  {weatherData?.current?.temperatureC ?? '--'}°C
                </span>
                {weatherData?.current?.iconUrl && (
                  <img
                    src={weatherData.current.iconUrl}
                    alt={weatherData.current.condition}
                    className="w-16 h-16 object-contain -mt-2 drop-shadow-md hidden sm:inline-block"
                  />
                )}
              </div>

              {/* Weather Condition & Location Name */}
              <div className="flex flex-col gap-1">
                <div className="text-lg sm:text-xl font-semibold text-on-primary">
                  {weatherData?.current?.condition || 'Clear Sky'}
                </div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-on-primary/90 font-medium">
                  <MapPin className="w-4 h-4 text-secondary-fixed shrink-0" />
                  <span>
                    {weatherData?.location?.city
                      ? `${weatherData.location.city}, `
                      : ''}
                    {weatherData?.location?.district || 'Local Area'}
                    {weatherData?.location?.state ? `, ${weatherData.location.state}` : ''}
                  </span>
                </div>
              </div>

              {/* Feels Like Pill */}
              <div className="inline-flex items-center gap-2 bg-surface/15 backdrop-blur-sm border border-surface-variant/20 rounded-full px-3.5 py-1.5 text-xs text-on-primary w-fit mt-1">
                <Thermometer className="w-3.5 h-3.5 text-secondary-fixed" />
                <span className="font-medium">
                  {t('weatherPage.feelsLike')}:{' '}
                  <strong className="text-secondary-fixed font-mono">
                    {weatherData?.current?.feelsLikeC ?? weatherData?.current?.temperatureC ?? '--'}°C
                  </strong>
                </span>
              </div>
            </div>

            {/* Right section: Important Agro-Meteorological Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full lg:w-auto z-10">
              {/* Humidity */}
              <div className="p-4 rounded-[20px] bg-surface/10 backdrop-blur-sm border border-surface-variant/20 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-2">
                  <Droplets className="w-3.5 h-3.5 text-sky-300" />
                  <span className="text-[10px] uppercase font-bold text-on-primary-container block tracking-wider">
                    {t('weatherPage.relHumidity')}
                  </span>
                </div>
                <span className="font-display font-bold text-2xl sm:text-3xl text-on-primary font-mono">
                  {weatherData?.current?.humidityPercent ?? '--'}%
                </span>
              </div>

              {/* Wind Speed & Direction */}
              <div className="p-4 rounded-[20px] bg-surface/10 backdrop-blur-sm border border-surface-variant/20 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-2">
                  <Wind className="w-3.5 h-3.5 text-teal-300" />
                  <span className="text-[10px] uppercase font-bold text-on-primary-container block tracking-wider">
                    {t('weatherPage.windSpeed')}
                  </span>
                </div>
                <div>
                  <span className="font-display font-bold text-2xl sm:text-3xl text-on-primary font-mono">
                    {weatherData?.current?.windSpeedKmh ?? '--'}
                  </span>
                  <span className="text-xs text-on-primary/80 font-normal ml-1">km/h</span>
                  {weatherData?.current?.windDirection && (
                    <span className="text-[10px] font-bold text-secondary-fixed ml-1 uppercase">
                      {weatherData.current.windDirection}
                    </span>
                  )}
                </div>
              </div>

              {/* Rainfall */}
              <div className="p-4 rounded-[20px] bg-surface/10 backdrop-blur-sm border border-surface-variant/20 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-2">
                  <CloudRain className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="text-[10px] uppercase font-bold text-on-primary-container block tracking-wider">
                    {t('weatherPage.rainfall24h')}
                  </span>
                </div>
                <div>
                  <span className="font-display font-bold text-2xl sm:text-3xl text-on-primary font-mono">
                    {weatherData?.current?.rainfallMm ?? '0'}
                  </span>
                  <span className="text-xs text-on-primary/80 font-normal ml-1">mm</span>
                </div>
              </div>

              {/* UV Index */}
              <div className="p-4 rounded-[20px] bg-surface/10 backdrop-blur-sm border border-surface-variant/20 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-[10px] uppercase font-bold text-on-primary-container block tracking-wider">
                    {t('weatherPage.uvRadiation')}
                  </span>
                </div>
                <span className="font-display font-bold text-2xl sm:text-3xl text-on-primary font-mono">
                  {weatherData?.current?.uvIndex ?? 6}
                </span>
              </div>
            </div>
          </div>

          {/* Actionable Field Operations Advisories */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-xl text-primary">
                {t('weatherPage.actionMatrixTitle')}
              </h3>
              <span className="text-[11px] text-on-surface-variant font-mono">
                Source: {weatherData?.source || 'Meteorological Telemetry'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {weatherData?.advisories?.map((adv, idx) => (
                <Card
                  key={idx}
                  className={`p-6 flex flex-col justify-between rounded-[24px] ${
                    adv.severity === 'WARNING'
                      ? 'border-error/40 bg-error-container/10'
                      : 'bg-surface-container-low border border-surface-variant'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
                        {adv.category}
                      </span>
                      <Badge
                        variant={
                          adv.severity === 'WARNING'
                            ? 'error'
                            : adv.severity === 'ADVISORY'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {adv.severity}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-on-surface leading-relaxed mb-4">
                      {adv.message}
                    </p>
                  </div>
                  <span className="text-[10px] text-on-surface-variant/70 italic border-t border-surface-variant/50 pt-3 block">
                    {adv.confidenceLevel || t('weatherPage.confidenceNote')}
                  </span>
                </Card>
              ))}
            </div>
          </div>

          {/* 5-Day Regional Agricultural Forecast */}
          <Card className="p-6 sm:p-8 rounded-[28px]">
            <h3 className="font-display font-semibold text-xl text-primary mb-6 pb-4 border-b border-surface-variant/60">
              {t('weatherPage.forecast5DayTitle')}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {weatherData?.forecast?.map((day, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-[20px] bg-surface-container flex flex-col items-center text-center border border-surface-variant/50 hover:border-primary/30 transition-colors"
                >
                  <span className="text-xs font-bold text-on-surface-variant mb-2">
                    {new Date(day.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <div className="my-2 flex items-center justify-center">
                    {day.iconUrl ? (
                      <img src={day.iconUrl} alt={day.condition} className="w-8 h-8 object-contain" />
                    ) : day.precipitationProbabilityPercent > 40 ? (
                      <CloudRain className="w-7 h-7 text-sky-600" />
                    ) : (
                      <Sun className="w-7 h-7 text-amber-500" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-primary mt-1 line-clamp-1">
                    {day.condition}
                  </span>
                  <div className="flex items-baseline gap-1 mt-2 text-xs font-mono">
                    <span className="font-bold text-primary text-sm">{day.tempMaxC}°</span>
                    <span className="text-on-surface-variant">/ {day.tempMinC}°</span>
                  </div>
                  <span className="text-[10px] text-secondary mt-1.5 font-semibold">
                    {t('weatherPage.rainProb', { percent: day.precipitationProbabilityPercent })}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-on-surface-variant/70 mt-6 text-center italic">
              {t('weatherPage.probabilisticNotice')}
            </p>
          </Card>
        </>
      )}
    </div>
  );
};

export default WeatherIntelligencePage;
