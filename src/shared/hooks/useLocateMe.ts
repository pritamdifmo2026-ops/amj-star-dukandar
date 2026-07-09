import { useState } from 'react';
import { geocodeApi, type GeocodedAddress } from '@/shared/services/geocode.api';

/**
 * Browser geolocation → backend reverse-geocode. The Google Maps key never
 * reaches the browser; the frontend only ever sends raw lat/lng.
 */
export function useLocateMe() {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = (onResolved: (address: GeocodedAddress) => void) => {
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const address = await geocodeApi.reverse(latitude, longitude);
          onResolved(address);
        } catch (err: any) {
          setError(err?.response?.data?.message || 'Could not resolve your address. Please enter it manually.');
        } finally {
          setLocating(false);
        }
      },
      (geoErr) => {
        setLocating(false);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setError('Location permission denied. Please enter your address manually.');
        } else {
          setError('Could not detect your location. Please enter it manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  return { locate, locating, error };
}
