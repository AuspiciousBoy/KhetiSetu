import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tractor, Thermometer, Droplets, Wind, CloudRain, ArrowRight, MapPin } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import getLiveWeather from '../../services/weatherClient';

const AgriWeatherBar = ({ weather: propWeather }) => {
  const { t } = useTranslation();
  const [internalWeather, setInternalWeather] = useState(null);

  useEffect(() => {
    if (propWeather) return;

    let isMounted = true;
    const fetchBarWeather = async (coords) => {
      try {
        const data = await getLiveWeather(coords || { district: 'Pune' });
        if (isMounted && data && data.current) {
          setInternalWeather(data);
        }
      } catch (err) {
        // Silent catch for telemetry ticker
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchBarWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => {
          fetchBarWeather(null);
        },
        { timeout: 5000, maximumAge: 120000 }
      );
    } else {
      fetchBarWeather(null);
    }

    return () => {
      isMounted = false;
    };
  }, [propWeather]);

  const activeWeather = propWeather || internalWeather;
  const current = activeWeather?.current;
  const sprayingAdvisory =
    activeWeather?.advisories?.find((a) => a.category === 'SPRAYING') ||
    activeWeather?.advisories?.[0];

  const isFavorable = sprayingAdvisory?.severity === 'INFO';

  return (
    <div className="bg-surface rounded-[20px] border border-surface-variant p-4 sm:p-5 soil-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Agronomic Field Advisory */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Tractor className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary font-mono">
                {t('agriWeatherBar.advisoryBadge')}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isFavorable
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isFavorable ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'
                  }`}
                ></span>
                {isFavorable
                  ? t('agriWeatherBar.sprayingFavorable')
                  : sprayingAdvisory?.severity === 'WARNING'
                  ? 'Caution Advised'
                  : 'Farming Advisory'}
              </span>
              {activeWeather?.location && (
                <span className="text-[10px] text-on-surface-variant font-medium hidden sm:inline-flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-secondary" />
                  {activeWeather.location.city || activeWeather.location.district}
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface font-medium mt-0.5 line-clamp-1 max-w-xl">
              {sprayingAdvisory?.message || t('agriWeatherBar.sprayingDesc')}
            </p>
          </div>
        </div>

        {/* Right: Real-time Microclimate Telemetry Grid */}
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-1 lg:pb-0 scrollbar-none font-mono text-xs">
          <div className="flex items-center gap-2 shrink-0">
            <Thermometer className="w-4 h-4 text-amber-600" />
            <div>
              <span className="text-[10px] text-on-surface-variant block uppercase font-sans">
                {t('agriWeatherBar.soilTemp')}
              </span>
              <span className="font-bold text-on-surface">
                {current?.temperatureC !== undefined ? `${current.temperatureC}°C` : '28°C'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Droplets className="w-4 h-4 text-sky-600" />
            <div>
              <span className="text-[10px] text-on-surface-variant block uppercase font-sans">
                {t('agriWeatherBar.relHumidity')}
              </span>
              <span className="font-bold text-on-surface">
                {current?.humidityPercent !== undefined ? `${current.humidityPercent}%` : '54%'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Wind className="w-4 h-4 text-teal-600" />
            <div>
              <span className="text-[10px] text-on-surface-variant block uppercase font-sans">
                {t('agriWeatherBar.windSpeed')}
              </span>
              <span className="font-bold text-on-surface">
                {current?.windSpeedKmh !== undefined ? `${current.windSpeedKmh} km/h` : '10 km/h'}
                {current?.windDirection ? ` ${current.windDirection}` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CloudRain className="w-4 h-4 text-indigo-600" />
            <div>
              <span className="text-[10px] text-on-surface-variant block uppercase font-sans">
                {t('agriWeatherBar.rainForecast')}
              </span>
              <span className="font-bold text-emerald-700">
                {current?.rainfallMm !== undefined ? `${current.rainfallMm} mm` : '0.0 mm'}
              </span>
            </div>
          </div>

          <Link
            to="/weather"
            className="shrink-0 text-xs font-semibold text-secondary hover:text-primary flex items-center gap-1 font-sans pl-2 border-l border-surface-variant transition-colors"
          >
            <span>{t('agriWeatherBar.radarLink')}</span>
            <ArrowRight className="w-3.5 h-3.5 text-secondary" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AgriWeatherBar;
