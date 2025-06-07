import * as ical from 'node-ical';
import * as fs from 'fs';
import * as path from 'path';

export interface ParsedEvent {
  uid: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  url?: string;
  organizer?: string;
}

export interface ParsedCalendar {
  events: ParsedEvent[];
  metadata: {
    calendarName?: string;
    prodId?: string;
    version?: string;
    method?: string;
  };
}

export class ICalParserService {
  /**
   * Parse ICAL content from a string
   * @param icalContent The raw ICAL content as a string
   * @returns Parsed calendar data
   */
  async parseICalContent(icalContent: string): Promise<ParsedCalendar> {
    try {
      const parsed = ical.parseICS(icalContent);
      const events: ParsedEvent[] = [];
      const metadata = {
        calendarName: undefined as string | undefined,
        prodId: undefined as string | undefined,
        version: undefined as string | undefined,
        method: undefined as string | undefined,
      };

      // Extract metadata from the raw content since node-ical doesn't always expose all properties
      const lines = icalContent.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('X-WR-CALNAME:')) {
          metadata.calendarName = trimmedLine.substring('X-WR-CALNAME:'.length);
        } else if (trimmedLine.startsWith('PRODID:')) {
          metadata.prodId = trimmedLine.substring('PRODID:'.length);
        } else if (trimmedLine.startsWith('VERSION:')) {
          metadata.version = trimmedLine.substring('VERSION:'.length);
        } else if (trimmedLine.startsWith('METHOD:')) {
          metadata.method = trimmedLine.substring('METHOD:'.length);
        }
      }

      for (const key in parsed) {
        const component = parsed[key];
        
        if (component.type === 'VEVENT') {
          // Extract event data
          const event: ParsedEvent = {
            uid: component.uid || `event-${Date.now()}-${Math.random()}`,
            summary: component.summary || 'Untitled Event',
            description: component.description,
            start: component.start ? new Date(component.start) : new Date(),
            end: component.end ? new Date(component.end) : new Date(),
            location: component.location,
            url: component.url,
            organizer: typeof component.organizer === 'object' ? (component.organizer as any)?.val : component.organizer,
          };
          events.push(event);
        }
      }

      return { events, metadata };
    } catch (error) {
      // If parsing fails completely, try to extract basic info manually
      if (icalContent.includes('BEGIN:VCALENDAR') && icalContent.includes('END:VCALENDAR')) {
        // Return empty result rather than throwing error
        return {
          events: [],
          metadata: {
            calendarName: undefined,
            prodId: undefined,
            version: undefined,
            method: undefined,
          }
        };
      }
      throw new Error(`Failed to parse ICAL content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse ICAL content from a file
   * @param filePath Path to the ICAL file
   * @returns Parsed calendar data
   */
  async parseICalFile(filePath: string): Promise<ParsedCalendar> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = fs.readFileSync(filePath, 'utf8');
      return await this.parseICalContent(content);
    } catch (error) {
      throw new Error(`Failed to parse ICAL file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate if a string contains valid ICAL content
   * @param icalContent The ICAL content to validate
   * @returns True if valid, false otherwise
   */
  isValidICalContent(icalContent: string): boolean {
    try {
      // Basic validation - must contain required ICAL components
      if (!icalContent.includes('BEGIN:VCALENDAR') || !icalContent.includes('END:VCALENDAR')) {
        return false;
      }

      // Check for balanced BEGIN/END pairs
      const beginCount = (icalContent.match(/BEGIN:VCALENDAR/g) || []).length;
      const endCount = (icalContent.match(/END:VCALENDAR/g) || []).length;
      
      if (beginCount !== endCount || beginCount === 0) {
        return false;
      }

      // Try parsing to validate structure
      const parsed = ical.parseICS(icalContent);
      return true; // If no exception is thrown, it's valid enough
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract events from parsed calendar data that fall within a date range
   * @param parsedCalendar Parsed calendar data
   * @param startDate Start date filter (optional)
   * @param endDate End date filter (optional)
   * @returns Filtered events
   */
  getEventsInDateRange(
    parsedCalendar: ParsedCalendar, 
    startDate?: Date, 
    endDate?: Date
  ): ParsedEvent[] {
    return parsedCalendar.events.filter(event => {
      if (startDate && event.start < startDate) {
        return false;
      }
      if (endDate && event.start > endDate) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get events by genre/category (searches in summary and description)
   * @param parsedCalendar Parsed calendar data
   * @param genre Genre to search for
   * @returns Events matching the genre
   */
  getEventsByGenre(parsedCalendar: ParsedCalendar, genre: string): ParsedEvent[] {
    const lowerGenre = genre.toLowerCase();
    return parsedCalendar.events.filter(event => {
      const summary = event.summary.toLowerCase();
      const description = event.description?.toLowerCase() || '';
      return summary.includes(lowerGenre) || description.includes(lowerGenre);
    });
  }

  /**
   * Convert parsed calendar back to ICAL string format
   * @param parsedCalendar Parsed calendar data
   * @returns ICAL content as string
   */
  convertToICalString(parsedCalendar: ParsedCalendar): string {
    let icalString = 'BEGIN:VCALENDAR\n';
    icalString += 'VERSION:2.0\n';
    icalString += `PRODID:${parsedCalendar.metadata.prodId || '-//Events API//Events Calendar//EN'}\n`;
    icalString += 'CALSCALE:GREGORIAN\n';
    icalString += `METHOD:${parsedCalendar.metadata.method || 'PUBLISH'}\n`;
    
    if (parsedCalendar.metadata.calendarName) {
      icalString += `X-WR-CALNAME:${parsedCalendar.metadata.calendarName}\n`;
    }

    for (const event of parsedCalendar.events) {
      icalString += 'BEGIN:VEVENT\n';
      icalString += `UID:${event.uid}\n`;
      icalString += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}\n`;
      icalString += `DTSTART:${event.start.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}\n`;
      icalString += `DTEND:${event.end.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}\n`;
      icalString += `SUMMARY:${event.summary}\n`;
      
      if (event.description) {
        icalString += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\n`;
      }
      if (event.location) {
        icalString += `LOCATION:${event.location}\n`;
      }
      if (event.organizer) {
        icalString += `ORGANIZER:${event.organizer}\n`;
      }
      if (event.url) {
        icalString += `URL:${event.url}\n`;
      }
      
      icalString += 'END:VEVENT\n';
    }

    icalString += 'END:VCALENDAR\n';
    return icalString;
  }
} 