"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSourcesService = void 0;
const axios_1 = __importDefault(require("axios"));
const date_fns_1 = require("date-fns");
class EventSourcesService {
    constructor() {
        this.eventbriteToken = process.env.EVENTBRITE_TOKEN || '';
        this.ticketmasterApiKey = process.env.TICKETMASTER_API_KEY || '';
        this.meetupApiKey = process.env.MEETUP_API_KEY || '';
        this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    }
    /**
     * Fetch events from all available sources
     */
    async getAllEvents(options) {
        const promises = [];
        let sourceCount = 0;
        if (this.eventbriteToken) {
            sourceCount++;
            promises.push(this.getEventbriteEvents(options).catch(err => {
                console.error('Eventbrite error:', err);
                return [];
            }));
        }
        if (this.ticketmasterApiKey) {
            sourceCount++;
            promises.push(this.getTicketmasterEvents(options).catch(err => {
                console.error('Ticketmaster error:', err);
                return [];
            }));
        }
        if (this.meetupApiKey) {
            sourceCount++;
            promises.push(this.getMeetupEvents(options).catch(err => {
                console.error('Meetup error:', err);
                return [];
            }));
        }
        if (this.googlePlacesApiKey) {
            sourceCount++;
            promises.push(this.getGoogleEvents(options).catch(err => {
                console.error('Google Places error:', err);
                return [];
            }));
        }
        console.log(`Event sources: ${sourceCount} configured API keys found`);
        if (sourceCount === 0) {
            console.warn('No event source API keys configured - verification will rely on URL generation only');
        }
        const results = await Promise.all(promises);
        const totalEvents = results.flat();
        console.log(`Event sources fetched ${totalEvents.length} real events for verification`);
        return totalEvents;
    }
    /**
     * Fetch events from Eventbrite
     */
    async getEventbriteEvents(options) {
        try {
            const params = {
                'location.address': options.location,
                'location.within': `${options.radius || 50}km`,
                expand: 'venue,organizer,category',
            };
            if (options.startDateTime) {
                params['start_date.range_start'] = (0, date_fns_1.parseISO)(options.startDateTime).toISOString();
            }
            if (options.endDateTime) {
                params['start_date.range_end'] = (0, date_fns_1.parseISO)(options.endDateTime).toISOString();
            }
            if (options.genre) {
                params.q = options.genre;
            }
            const response = await axios_1.default.get('https://www.eventbriteapi.com/v3/events/search/', {
                headers: {
                    'Authorization': `Bearer ${this.eventbriteToken}`,
                },
                params,
            });
            return response.data.events.map((event) => ({
                id: `eventbrite-${event.id}`,
                source: 'eventbrite',
                name: event.name.text,
                description: event.description?.text,
                startDateTime: new Date(event.start.utc),
                endDateTime: event.end?.utc ? new Date(event.end.utc) : undefined,
                location: event.venue?.address?.localized_address_display,
                venue: event.venue?.name,
                address: event.venue?.address?.localized_address_display,
                url: event.url,
                price: event.is_free ? 'Free' : 'Paid',
                imageUrl: event.logo?.url,
                categories: event.category ? [event.category.name] : [],
                organizer: event.organizer?.name,
            }));
        }
        catch (error) {
            console.error('Eventbrite API error:', error);
            return [];
        }
    }
    /**
     * Fetch events from Ticketmaster
     */
    async getTicketmasterEvents(options) {
        try {
            const params = {
                apikey: this.ticketmasterApiKey,
                city: options.location,
                radius: options.radius || 50,
                unit: 'km',
                size: 50,
            };
            if (options.startDateTime) {
                params.startDateTime = (0, date_fns_1.format)((0, date_fns_1.parseISO)(options.startDateTime), "yyyy-MM-dd'T'HH:mm:ss'Z'");
            }
            if (options.endDateTime) {
                params.endDateTime = (0, date_fns_1.format)((0, date_fns_1.parseISO)(options.endDateTime), "yyyy-MM-dd'T'HH:mm:ss'Z'");
            }
            if (options.genre) {
                params.keyword = options.genre;
            }
            const response = await axios_1.default.get('https://app.ticketmaster.com/discovery/v2/events.json', {
                params,
            });
            if (!response.data._embedded?.events) {
                return [];
            }
            return response.data._embedded.events.map((event) => ({
                id: `ticketmaster-${event.id}`,
                source: 'ticketmaster',
                name: event.name,
                description: event.info || event.pleaseNote,
                startDateTime: new Date(event.dates.start.dateTime),
                endDateTime: event.dates.end?.dateTime ? new Date(event.dates.end.dateTime) : undefined,
                location: event._embedded?.venues?.[0]?.city?.name,
                venue: event._embedded?.venues?.[0]?.name,
                address: event._embedded?.venues?.[0]?.address?.line1,
                url: event.url,
                price: event.priceRanges?.[0] ?
                    `$${event.priceRanges[0].min}-$${event.priceRanges[0].max}` :
                    undefined,
                imageUrl: event.images?.[0]?.url,
                categories: event.classifications?.[0] ?
                    [event.classifications[0].genre?.name, event.classifications[0].segment?.name].filter(Boolean) :
                    [],
                organizer: event.promoter?.name,
            }));
        }
        catch (error) {
            console.error('Ticketmaster API error:', error);
            return [];
        }
    }
    /**
     * Fetch events from Meetup
     */
    async getMeetupEvents(options) {
        try {
            // Note: Meetup API v3 requires OAuth, this is a simplified example
            // You might need to use their GraphQL API or implement OAuth flow
            const params = {
                key: this.meetupApiKey,
                lat: 0, // You'd need to geocode the location first
                lon: 0,
                radius: options.radius || 50,
                fields: 'venue,fee,description_images',
            };
            if (options.genre) {
                params.text = options.genre;
            }
            // This is a placeholder - actual implementation would need proper Meetup API integration
            console.log('Meetup integration not fully implemented');
            return [];
        }
        catch (error) {
            console.error('Meetup API error:', error);
            return [];
        }
    }
    /**
     * Fetch events from Google Places
     */
    async getGoogleEvents(options) {
        try {
            // First, geocode the location
            const geocodeResponse = await axios_1.default.get('https://maps.googleapis.com/maps/api/geocode/json', {
                params: {
                    address: options.location,
                    key: this.googlePlacesApiKey,
                },
            });
            if (!geocodeResponse.data.results?.[0]) {
                return [];
            }
            const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
            // Search for event venues nearby
            const placesResponse = await axios_1.default.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
                params: {
                    location: `${lat},${lng}`,
                    radius: (options.radius || 50) * 1000, // Convert km to meters
                    type: 'event_venue|night_club|stadium|theater|concert_hall',
                    keyword: options.genre || 'events',
                    key: this.googlePlacesApiKey,
                },
            });
            // Google Places doesn't provide event details, just venues
            // This would need to be combined with other sources
            return placesResponse.data.results.map((place) => ({
                id: `google-${place.place_id}`,
                source: 'google',
                name: place.name,
                description: `Event venue in ${options.location}`,
                startDateTime: new Date(), // Placeholder
                location: place.vicinity,
                venue: place.name,
                address: place.vicinity,
                categories: place.types || [],
                // Google Places doesn't provide actual events, just venues
            }));
        }
        catch (error) {
            console.error('Google Places API error:', error);
            return [];
        }
    }
    /**
     * Search for a specific event across all sources
     */
    async findEvent(eventName, location, date) {
        const options = {
            location,
            genre: eventName,
        };
        if (date) {
            const eventDate = (0, date_fns_1.parseISO)(date);
            options.startDateTime = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000).toISOString();
            options.endDateTime = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
        }
        const events = await this.getAllEvents(options);
        // Find best match based on name similarity
        const normalizedSearchName = eventName.toLowerCase().trim();
        return events.find(event => event.name.toLowerCase().includes(normalizedSearchName) ||
            normalizedSearchName.includes(event.name.toLowerCase())) || null;
    }
}
exports.EventSourcesService = EventSourcesService;
//# sourceMappingURL=event-sources.service.js.map