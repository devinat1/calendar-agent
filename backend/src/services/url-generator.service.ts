import { ParsedEvent } from './ical-parser.service';

export class UrlGeneratorService {
  /**
   * Generate fallback URLs for events that don't have URLs
   */
  generateFallbackUrls(events: ParsedEvent[], location: string, genre?: string): ParsedEvent[] {
    return events.map(event => {
      // If event already has a URL, keep it
      if (event.url) {
        return event;
      }

      // Try to generate useful URLs based on event information
      const fallbackUrl = this.generateEventUrl(event, location, genre);
      
      return {
        ...event,
        url: fallbackUrl
      };
    });
  }

  /**
   * Generate a useful URL for an event based on its details
   */
  private generateEventUrl(event: ParsedEvent, location: string, genre?: string): string {
    const eventName = encodeURIComponent(event.summary);
    const locationEncoded = encodeURIComponent(location);
    const venueEncoded = event.location ? encodeURIComponent(event.location) : '';
    
    // Try different strategies to find event information
    
    // 1. If we have a specific venue, search for it
    if (event.location && this.isSpecificVenue(event.location)) {
      return this.generateVenueSearchUrl(event.location, eventName);
    }
    
    // 2. Search for the event name + location on Eventbrite
    if (eventName && locationEncoded) {
      return this.generateEventbriteSearchUrl(eventName, locationEncoded);
    }
    
    // 3. Generic event search
    return this.generateGenericEventSearchUrl(eventName, locationEncoded, genre);
  }

  /**
   * Check if a location string represents a specific venue
   */
  private isSpecificVenue(location: string): boolean {
    const venueKeywords = [
      'theater', 'theatre', 'hall', 'center', 'centre', 'club', 'bar', 
      'restaurant', 'hotel', 'stadium', 'arena', 'gallery', 'museum',
      'park', 'beach', 'plaza', 'square', 'auditorium', 'ballroom',
      'pavilion', 'civic', 'library', 'church', 'temple', 'synagogue'
    ];
    
    const lowerLocation = location.toLowerCase();
    return venueKeywords.some(keyword => lowerLocation.includes(keyword));
  }

  /**
   * Generate a venue-specific search URL
   */
  private generateVenueSearchUrl(venue: string, eventName: string): string {
    const venueEncoded = encodeURIComponent(venue);
    const eventEncoded = encodeURIComponent(eventName);
    
    // Search for the venue website first
    return `https://www.google.com/search?q="${venueEncoded}"+events+"${eventEncoded}"+tickets`;
  }

  /**
   * Generate an Eventbrite search URL
   */
  private generateEventbriteSearchUrl(eventName: string, location: string): string {
    const query = encodeURIComponent(`${eventName} ${location}`);
    return `https://www.eventbrite.com/d/${encodeURIComponent(location)}/${query}/`;
  }

  /**
   * Generate a generic event search URL
   */
  private generateGenericEventSearchUrl(eventName: string, location: string, genre?: string): string {
    let query = `"${eventName}" ${location}`;
    if (genre) {
      query += ` ${genre}`;
    }
    query += ' tickets OR registration OR events';
    
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  /**
   * Generate URLs for specific event platforms
   */
  static generatePlatformUrls(eventName: string, location: string, date?: Date) {
    const eventEncoded = encodeURIComponent(eventName);
    const locationEncoded = encodeURIComponent(location);
    
    const urls = {
      eventbrite: `https://www.eventbrite.com/d/${locationEncoded}/${eventEncoded}/`,
      meetup: `https://www.meetup.com/find/?keywords=${eventEncoded}&location=${locationEncoded}`,
      facebook: `https://www.facebook.com/events/search/?q=${eventEncoded}%20${locationEncoded}`,
      ticketmaster: `https://www.ticketmaster.com/search?tm_link=tm_homeA_header_search&q=${eventEncoded}&geolocation=${locationEncoded}`,
      googleapis: `https://www.google.com/search?q=${encodeURIComponent(`"${eventName}" ${location} events tickets`)}`
    };

    return urls;
  }

  /**
   * Enhance events with multiple search URLs
   */
  enhanceEventsWithSearchUrls(events: ParsedEvent[], location: string, genre?: string): ParsedEvent[] {
    return events.map(event => {
      const platformUrls = UrlGeneratorService.generatePlatformUrls(event.summary, location, event.start);
      
      // If no URL exists, use the most likely platform
      if (!event.url) {
        event.url = platformUrls.eventbrite;
      }

      // Add search URLs to description for user reference
      if (!event.description?.includes('Search on:')) {
        const searchLinks = [
          `Eventbrite: ${platformUrls.eventbrite}`,
          `Meetup: ${platformUrls.meetup}`,
          `Ticketmaster: ${platformUrls.ticketmaster}`,
          `Google: ${platformUrls.googleapis}`
        ].join('\n');

        event.description = (event.description || '') + 
          `\n\nSearch on:\n${searchLinks}`;
      }

      return event;
    });
  }

  /**
   * Create a universal event search URL that works well as a fallback
   */
  static createUniversalSearchUrl(eventName: string, location: string, date?: Date): string {
    let query = `"${eventName}" ${location} events`;
    
    if (date) {
      const year = date.getFullYear();
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      query += ` ${month} ${year}`;
    }
    
    query += ' tickets OR registration OR "buy tickets" OR eventbrite OR meetup';
    
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
} 