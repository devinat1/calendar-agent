"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingService = void 0;
const axios_1 = __importDefault(require("axios"));
class RatingService {
    constructor() {
        this.baseUrl = 'https://api.opentripmap.com/0.1';
        this.apiKey = process.env.OPENTRIPMAP_API_KEY || '';
    }
    async getRatingForPlace(place) {
        if (!this.apiKey) {
            return null;
        }
        try {
            const geocodeResp = await axios_1.default.get(`${this.baseUrl}/en/places/geoname`, {
                params: { name: place, apikey: this.apiKey }
            });
            const { lat, lon } = geocodeResp.data;
            if (!lat || !lon) {
                return null;
            }
            const searchResp = await axios_1.default.get(`${this.baseUrl}/en/places/radius`, {
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
        }
        catch (error) {
            console.error('Rating service error:', error);
            return null;
        }
    }
}
exports.RatingService = RatingService;
//# sourceMappingURL=rating.service.js.map