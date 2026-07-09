import apiClient from '@/api/client';

export interface GeocodedAddress {
  formattedAddress: string;
  houseNo: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

export const geocodeApi = {
  reverse: async (lat: number, lng: number): Promise<GeocodedAddress> => {
    const res = await apiClient.get('/geocode/reverse', { params: { lat, lng } });
    return res.data.address;
  },
};
