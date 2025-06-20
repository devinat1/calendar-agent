import { ParsedEvent } from './ical-parser.service';
export declare class UrlGeneratorService {
    /**
     * Generate fallback URLs for events that don't have URLs
     */
    generateFallbackUrls(events: ParsedEvent[], location: string, genre?: string): ParsedEvent[];
    /**
     * Generate a useful URL for an event based on its details
     */
    private generateEventUrl;
    /**
     * Check if a location string represents a specific venue
     */
    private isSpecificVenue;
    /**
     * Generate a venue-specific search URL
     */
    private generateVenueSearchUrl;
    /**
     * Generate an Eventbrite search URL
     */
    private generateEventbriteSearchUrl;
    /**
     * Generate a generic event search URL
     */
    private generateGenericEventSearchUrl;
    /**
     * Generate URLs for specific event platforms
     */
    static generatePlatformUrls(eventName: string, location: string, date?: Date): {
        eventbrite: string;
        meetup: string;
        facebook: string;
        ticketmaster: string;
        googleapis: string;
    };
    /**
     * Enhance events with multiple search URLs
     */
    enhanceEventsWithSearchUrls(events: ParsedEvent[], location: string, genre?: string): ParsedEvent[];
    /**
     * Create a universal event search URL that works well as a fallback
     */
    static createUniversalSearchUrl(eventName: string, location: string, date?: Date): string;
}
//# sourceMappingURL=url-generator.service.d.ts.map