export interface RealEvent {
    id: string;
    source: 'eventbrite' | 'ticketmaster' | 'meetup' | 'google';
    name: string;
    description?: string;
    startDateTime: Date;
    endDateTime?: Date;
    location?: string;
    venue?: string;
    address?: string;
    url?: string;
    price?: string;
    imageUrl?: string;
    categories?: string[];
    organizer?: string;
}
export interface EventSourceOptions {
    location: string;
    genre?: string;
    startDateTime?: string;
    endDateTime?: string;
    radius?: number;
}
export declare class EventSourcesService {
    private readonly eventbriteToken;
    private readonly ticketmasterApiKey;
    private readonly meetupApiKey;
    private readonly googlePlacesApiKey;
    constructor();
    /**
     * Fetch events from all available sources
     */
    getAllEvents(options: EventSourceOptions): Promise<RealEvent[]>;
    /**
     * Fetch events from Eventbrite
     */
    private getEventbriteEvents;
    /**
     * Fetch events from Ticketmaster
     */
    private getTicketmasterEvents;
    /**
     * Fetch events from Meetup
     */
    private getMeetupEvents;
    /**
     * Fetch events from Google Places
     */
    private getGoogleEvents;
    /**
     * Search for a specific event across all sources
     */
    findEvent(eventName: string, location: string, date?: string): Promise<RealEvent | null>;
}
//# sourceMappingURL=event-sources.service.d.ts.map