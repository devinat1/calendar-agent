import axios from 'axios';

export class RatingService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.opentripmap.com/0.1';

  constructor() {
    this.apiKey = process.env.OPENTRIPMAP_API_KEY || '';
  }

  async getRatingForPlace(place: string): Promise<number | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const geocodeResp = await axios.get(`${this.baseUrl}/en/places/geoname`, {
        params: { name: place, apikey: this.apiKey }
      });

      const { lat, lon } = geocodeResp.data;
      if (!lat || !lon) {
        return null;
      }

      const searchResp = await axios.get(`${this.baseUrl}/en/places/radius`, {
        params: {
          radius: 1000,
          lon,
          lat,
          limit: 1,
          format: 'json',
          apikey: this.apiKey
        }
      });

      const placeData = Array.isArray(searchResp.data) ? searchResp.data[0] : null;
      if (!placeData || placeData.rate === undefined) {
        return null;
      }

      // OpenTripMap rate is 0..3; scale to 1..5
      const rating = (placeData.rate / 3) * 5;
      return Math.round(rating * 10) / 10;
    } catch (error) {
      console.error('Rating service error:', error);
      return null;
    }
  }
}
