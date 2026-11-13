import React, { useState } from 'react';
import { MapPin, Navigation, Search, Check, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Production-ready Location Picker for KhetiSetu
 * Supports:
 * 1. "Use Current Location" (Browser Geolocation API + OSM Nominatim Reverse Geocoding)
 * 2. "Search on Map" (Nominatim Search API + Interactive OSM Map pin)
 * 3. Editable fields: address, latitude, longitude, city, state, pincode, landmark
 */
const LocationPicker = ({
  initialLocation = null,
  onLocationSelect,
  showFullForm = true,
  className = '',
}) => {
  const [latitude, setLatitude] = useState(initialLocation?.latitude || initialLocation?.coordinates?.latitude || 18.5204);
  const [longitude, setLongitude] = useState(initialLocation?.longitude || initialLocation?.coordinates?.longitude || 73.8567);
  const [addressLine, setAddressLine] = useState(
    initialLocation?.line1 || initialLocation?.address || initialLocation?.farmAddress || ''
  );
  const [city, setCity] = useState(initialLocation?.city || 'Pune');
  const [district, setDistrict] = useState(initialLocation?.district || 'Pune');
  const [state, setState] = useState(initialLocation?.state || 'Maharashtra');
  const [pincode, setPincode] = useState(initialLocation?.pincode || '411001');
  const [landmark, setLandmark] = useState(initialLocation?.landmark || '');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState('info'); // 'info' | 'error' | 'success'

  // Reverse geocode lat/lon to full postal address via OpenStreetMap Nominatim
  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) throw new Error('Geocoding service unavailable');
      const data = await res.json();
      const addr = data.address || {};

      const detectedCity = addr.city || addr.town || addr.village || addr.municipality || 'Pune';
      const detectedDistrict = addr.county || addr.state_district || detectedCity;
      const detectedState = addr.state || 'Maharashtra';
      const detectedPincode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : pincode;
      const line = [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || addressLine;

      setAddressLine(line);
      setCity(detectedCity);
      setDistrict(detectedDistrict);
      setState(detectedState);
      if (detectedPincode && detectedPincode.length === 6) {
        setPincode(detectedPincode);
      }

      const locationPayload = {
        address: line,
        line1: line,
        latitude: Number(lat),
        longitude: Number(lon),
        city: detectedCity,
        district: detectedDistrict,
        state: detectedState,
        pincode: detectedPincode || pincode,
        landmark,
      };

      if (onLocationSelect) {
        onLocationSelect(locationPayload);
      }
      setStatusMessage(`Location detected: ${detectedCity}, ${detectedState}`);
      setStatusType('success');
    } catch (err) {
      console.warn('Reverse geocode error:', err);
      setStatusMessage('Coordinates captured. Please confirm address details below.');
      setStatusType('info');
    }
  };

  // 1. Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatusMessage('Geolocation is not supported by your browser.');
      setStatusType('error');
      return;
    }

    setIsLocating(true);
    setStatusMessage('Acquiring high-accuracy GPS coordinates...');
    setStatusType('info');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lon = parseFloat(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lon);
        await reverseGeocode(lat, lon);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Could not retrieve your location.';
        if (err.code === 1) msg = 'Location permission was denied. Please use "Search on Map" or enter coordinates.';
        else if (err.code === 2) msg = 'Location unavailable. Please search your place on the map.';
        else if (err.code === 3) msg = 'Location request timed out. Please try again.';
        setStatusMessage(msg);
        setStatusType('error');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 2. Search on Map
  const handleSearchPlaces = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setStatusMessage(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) throw new Error('Search failed');
      const results = await res.json();
      setSearchResults(results);
      if (results.length === 0) {
        setStatusMessage('No places found matching your search. Please refine keywords.');
        setStatusType('error');
      }
    } catch (err) {
      console.warn('Place search error:', err);
      setStatusMessage('Place search service unavailable. You can enter coordinates directly.');
      setStatusType('error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(parseFloat(result.lat).toFixed(6));
    const lon = parseFloat(parseFloat(result.lon).toFixed(6));
    setLatitude(lat);
    setLongitude(lon);
    setSearchResults([]);
    setSearchQuery(result.display_name.split(',').slice(0, 3).join(','));

    const addr = result.address || {};
    const detectedCity = addr.city || addr.town || addr.village || addr.municipality || 'Pune';
    const detectedDistrict = addr.county || addr.state_district || detectedCity;
    const detectedState = addr.state || 'Maharashtra';
    const detectedPincode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : pincode;
    const line = [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ') || result.display_name?.split(',').slice(0, 2).join(',') || addressLine;

    setAddressLine(line);
    setCity(detectedCity);
    setDistrict(detectedDistrict);
    setState(detectedState);
    if (detectedPincode && detectedPincode.length === 6) {
      setPincode(detectedPincode);
    }

    const payload = {
      address: line,
      line1: line,
      latitude: lat,
      longitude: lon,
      city: detectedCity,
      district: detectedDistrict,
      state: detectedState,
      pincode: detectedPincode || pincode,
      landmark,
    };

    if (onLocationSelect) {
      onLocationSelect(payload);
    }
    setStatusMessage(`Selected: ${result.display_name.split(',')[0]} (${lat}, ${lon})`);
    setStatusType('success');
  };

  // Manual coordinate change
  const handleCoordinateChange = (newLat, newLon) => {
    const lat = parseFloat(newLat);
    const lon = parseFloat(newLon);
    if (!isNaN(lat)) setLatitude(lat);
    if (!isNaN(lon)) setLongitude(lon);

    if (!isNaN(lat) && !isNaN(lon) && onLocationSelect) {
      onLocationSelect({
        address: addressLine,
        line1: addressLine,
        latitude: lat,
        longitude: lon,
        city,
        district,
        state,
        pincode,
        landmark,
      });
    }
  };

  // OpenStreetMap embed URL with bounded view and target pin marker
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.015}%2C${latitude - 0.015}%2C${longitude + 0.015}%2C${latitude + 0.015}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <div className={`flex flex-col gap-3.5 ${className}`}>
      {/* Action Toolbar: Current Location & Place Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="flex items-center justify-center gap-1.5 shrink-0 bg-surface text-primary border-primary/40 hover:bg-primary/5 text-xs py-2"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-secondary" />
          )}
          <span>{isLocating ? 'Detecting Location...' : 'Use Current Location'}</span>
        </Button>

        {/* Search on Map Input */}
        <form onSubmit={handleSearchPlaces} className="flex-1 flex gap-1.5 relative">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search place, mandi, village, or pincode..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-surface border border-surface-variant text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={isSearching}
            className="text-xs px-3 py-1.5 shrink-0"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
          </Button>

          {/* Autocomplete Suggestions Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface rounded-xl shadow-lg border border-surface-variant max-h-48 overflow-y-auto divide-y divide-surface-variant/40">
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSearchResult(result)}
                  className="p-2.5 hover:bg-surface-container cursor-pointer text-xs text-on-surface flex items-start gap-2 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-primary">{result.display_name.split(',')[0]}</p>
                    <p className="text-[10px] text-on-surface-variant line-clamp-1">{result.display_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
            statusType === 'error'
              ? 'bg-error/10 text-error border border-error/20'
              : statusType === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-surface-variant text-on-surface-variant'
          }`}
        >
          {statusType === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          )}
          <span className="flex-1">{statusMessage}</span>
        </div>
      )}

      {/* Interactive OpenStreetMap Preview with Pin */}
      <div className="rounded-2xl overflow-hidden border border-surface-variant bg-surface-container relative">
        <div className="h-44 sm:h-52 w-full relative">
          <iframe
            title="OpenStreetMap Location Pin"
            src={osmEmbedUrl}
            className="w-full h-full border-0 pointer-events-auto"
            loading="lazy"
          />
          <div className="absolute top-2 right-2 bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold text-primary border border-surface-variant/80 flex items-center gap-1 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
            </span>
          </div>
        </div>

        {/* Coordinate confirmation bar */}
        <div className="p-2.5 bg-surface-container border-t border-surface-variant/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant font-medium">Pin Coordinates:</span>
            <span className="font-mono font-semibold text-primary">
              Lat: {latitude.toFixed(5)}, Lon: {longitude.toFixed(5)}
            </span>
          </div>
          <a
            href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:underline inline-flex items-center gap-1 font-medium"
          >
            <span>Open in OSM</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Editable Address & Coordinates Fields */}
      {showFullForm && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-1">
              Address / Line 1 *
            </label>
            <input
              type="text"
              required
              value={addressLine}
              onChange={(e) => {
                setAddressLine(e.target.value);
                onLocationSelect?.({
                  address: e.target.value,
                  line1: e.target.value,
                  latitude,
                  longitude,
                  city,
                  district,
                  state,
                  pincode,
                  landmark,
                });
              }}
              placeholder="House, street, farm gate or landmark"
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-1">
              City / Taluka *
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                onLocationSelect?.({
                  address: addressLine,
                  line1: addressLine,
                  latitude,
                  longitude,
                  city: e.target.value,
                  district,
                  state,
                  pincode,
                  landmark,
                });
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-1">
              District
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                onLocationSelect?.({
                  address: addressLine,
                  line1: addressLine,
                  latitude,
                  longitude,
                  city,
                  district: e.target.value,
                  state,
                  pincode,
                  landmark,
                });
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-1">
              State *
            </label>
            <input
              type="text"
              required
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                onLocationSelect?.({
                  address: addressLine,
                  line1: addressLine,
                  latitude,
                  longitude,
                  city,
                  district,
                  state: e.target.value,
                  pincode,
                  landmark,
                });
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-1">
              PIN Code *
            </label>
            <input
              type="text"
              maxLength={6}
              required
              value={pincode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPincode(val);
                onLocationSelect?.({
                  address: addressLine,
                  line1: addressLine,
                  latitude,
                  longitude,
                  city,
                  district,
                  state,
                  pincode: val,
                  landmark,
                });
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="0.0001"
              value={latitude}
              onChange={(e) => handleCoordinateChange(e.target.value, longitude)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="0.0001"
              value={longitude}
              onChange={(e) => handleCoordinateChange(latitude, e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
