import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';

const WeatherIntelligencePage = () => {
  const [district, setDistrict] = useState('Pune');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/weather?district=${district}`);
      setWeatherData(res.data.data);
    } catch (err) {
      console.error('Failed to load weather records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [district]);

  return (
    <div className="flex flex-col gap-10">
      {/* Header & District Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
            Agro-Meteorology
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
            Weather Intelligence & Field Advisories
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Farming recommendations calibrated for spraying suitability, irrigation and harvest safety
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-on-surface-variant">District:</span>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="bg-surface-container text-on-surface rounded-[12px] py-2 px-3 text-xs border border-surface-variant font-semibold"
          >
            <option value="Pune">Pune (पुणे)</option>
            <option value="Nashik">Nashik (नाशिक)</option>
            <option value="Nagpur">Nagpur (नागपूर)</option>
            <option value="Solapur">Solapur (सोलापूर)</option>
            <option value="Indore">Indore (इंदौर)</option>
            <option value="Ahmedabad">Ahmedabad (अहमदाबाद)</option>
            <option value="Karnal">Karnal (करनाल)</option>
            <option value="Ludhiana">Ludhiana (लुधियाना)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-64 rounded-[24px]" />
          <Skeleton className="h-48 rounded-[24px]" />
        </div>
      ) : (
        <>
          {/* Main Current Conditions Hero Card (Deep Forest Grain from code.html) */}
          <div className="bg-primary text-on-primary rounded-[24px] p-8 sm:p-10 grain-overlay soil-shadow flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-secondary-fixed text-[32px]">
                  {weatherData?.current?.icon || 'sunny'}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-on-primary-container">
                  Live Agricultural Conditions
                </span>
              </div>
              <h2 className="font-display font-bold text-5xl sm:text-6xl text-secondary-fixed mb-2">
                {weatherData?.current?.temperatureC}°C
              </h2>
              <p className="text-base text-on-primary font-medium">
                {weatherData?.current?.condition} • {weatherData?.location?.district}, {weatherData?.location?.state}
              </p>
            </div>

            {/* Micro Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
              <div className="p-4 rounded-[16px] bg-surface/10 border border-surface-variant/20">
                <span className="text-[10px] uppercase font-bold text-on-primary-container block">
                  Relative Humidity
                </span>
                <span className="font-display font-bold text-2xl text-on-primary">
                  {weatherData?.current?.humidityPercent}%
                </span>
              </div>
              <div className="p-4 rounded-[16px] bg-surface/10 border border-surface-variant/20">
                <span className="text-[10px] uppercase font-bold text-on-primary-container block">
                  Wind Speed
                </span>
                <span className="font-display font-bold text-2xl text-on-primary">
                  {weatherData?.current?.windSpeedKmh} <span className="text-xs font-normal">km/h</span>
                </span>
              </div>
              <div className="p-4 rounded-[16px] bg-surface/10 border border-surface-variant/20">
                <span className="text-[10px] uppercase font-bold text-on-primary-container block">
                  Rainfall (24h)
                </span>
                <span className="font-display font-bold text-2xl text-on-primary">
                  {weatherData?.current?.rainfallMm} <span className="text-xs font-normal">mm</span>
                </span>
              </div>
              <div className="p-4 rounded-[16px] bg-surface/10 border border-surface-variant/20">
                <span className="text-[10px] uppercase font-bold text-on-primary-container block">
                  UV Radiation
                </span>
                <span className="font-display font-bold text-2xl text-on-primary">
                  {weatherData?.current?.uvIndex}
                </span>
              </div>
            </div>
          </div>

          {/* Actionable Field Operations Advisories */}
          <div className="flex flex-col gap-4">
            <h3 className="font-display font-semibold text-xl text-primary">
              Field Operations Action Matrix
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {weatherData?.advisories?.map((adv, idx) => (
                <Card
                  key={idx}
                  className={`p-6 flex flex-col justify-between ${
                    adv.severity === 'WARNING'
                      ? 'border-error/40 bg-error-container/10'
                      : 'bg-surface-container-low'
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
                    {adv.confidenceLevel || 'Rule-based agro-meteorology inference'}
                  </span>
                </Card>
              ))}
            </div>
          </div>

          {/* 5-Day Agricultural Forecast */}
          <Card className="p-8">
            <h3 className="font-display font-semibold text-xl text-primary mb-6 pb-4 border-b border-surface-variant/60">
              5-Day Regional Meteorological Forecast
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {weatherData?.forecast?.map((day, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-[16px] bg-surface-container flex flex-col items-center text-center border border-surface-variant/50"
                >
                  <span className="text-xs font-bold text-on-surface-variant mb-2">
                    {new Date(day.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="material-symbols-outlined text-[28px] text-secondary my-1">
                    {day.precipitationProbabilityPercent > 40 ? 'rainy' : 'sunny'}
                  </span>
                  <span className="text-xs font-medium text-primary mt-1">{day.condition}</span>
                  <div className="flex items-baseline gap-1 mt-2 text-xs">
                    <span className="font-bold text-primary">{day.tempMaxC}°</span>
                    <span className="text-on-surface-variant">/ {day.tempMinC}°</span>
                  </div>
                  <span className="text-[10px] text-secondary mt-1 font-semibold">
                    💧 {day.precipitationProbabilityPercent}% Rain
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-on-surface-variant/70 mt-6 text-center italic">
              Notice: Forecast models are probabilistic guidance. Always observe in-situ field moisture and local micro-climate conditions before major pesticide or harvesting actions.
            </p>
          </Card>
        </>
      )}
    </div>
  );
};

export default WeatherIntelligencePage;
