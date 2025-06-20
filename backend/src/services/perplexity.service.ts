import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { isAfter, parseISO } from 'date-fns';
import { ICalParserService, ParsedCalendar } from './ical-parser.service';
import { EventVerificationService, VerifiedEvent } from './event-verification.service';

export interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface GetEventsOptions {
  genre?: string;
  startDateTime?: string; // ISO string
  endDateTime?: string;   // ISO string
  enableVerification?: boolean; // Enable event verification
}

export class PerplexityService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.perplexity.ai/chat/completions';
  private readonly icalParser: ICalParserService;
  private readonly verificationService: EventVerificationService;
  
  constructor() {
    // You'll need to set your API key here or pass it as a parameter
    this.apiKey = process.env.PERPLEXITY_API_KEY || 'your-api-key-here';
    this.icalParser = new ICalParserService();
    this.verificationService = new EventVerificationService();
  }

  /**
   * Get events for a location, with optional genre and time interval.
   * @param location The location to search events for
   * @param options Optional: genre, startDateTime, endDateTime (all ISO strings)
   */
  async getEventsForLocation(location: string, options: GetEventsOptions = {}): Promise<string> {
    try {
      const { genre, startDateTime, endDateTime } = options;
      // Validate time interval (must be in the future)
      let intervalString = '';
      if (startDateTime && endDateTime) {
        const now = new Date();
        const start = parseISO(startDateTime);
        const end = parseISO(endDateTime);
        
        // More specific date validation errors
        if (!isAfter(start, now)) {
          throw new Error('The start date and time must be in the future. Please select a date and time that hasn\'t passed yet.');
        }
        if (!isAfter(end, now)) {
          throw new Error('The end date and time must be in the future. Please select a date and time that hasn\'t passed yet.');
        }
        if (!isAfter(end, start)) {
          throw new Error('The end date and time must be after the start date and time. Please check your date selection.');
        }
        
        intervalString = ` between ${start.toISOString()} and ${end.toISOString()}`;
      } else if (startDateTime || endDateTime) {
        throw new Error('Both start and end date/time must be provided together. Please fill in both date fields or leave both empty.');
      }
      
      // Validate API key
      if (!this.apiKey || this.apiKey === 'your-api-key-here') {
        throw new Error('Perplexity API key is not configured. Please contact the administrator to set up the API key.');
      }
      
      const genreString = genre ? ` of genre "${genre}"` : '';
      const prompt = `Give events${genreString} happening in ${location}${intervalString ? intervalString : ' this week'}. Only include events that are scheduled in the future. Format the response as a valid ICAL (.ics) calendar file with proper VEVENT entries. Include event titles, descriptions, start/end times, locations, and whenever possible include URL links to event pages, ticket purchase links, or venue websites. Use proper ICAL formatting with BEGIN:VCALENDAR, VERSION:2.0, PRODID, and END:VCALENDAR structure. If you find specific events with URLs, include them in the URL field of each VEVENT.`;
      console.log(`Making API call to Perplexity with prompt: "${prompt}"`);
      
      const response = await axios.post<PerplexityResponse>(
        this.baseUrl,
        {
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const eventsContent = response.data.choices[0]?.message?.content || 'No events found';
      
      // Parse and validate ICAL content
      let parsedCalendar: ParsedCalendar | null = null;
      let icalContentToReturn = eventsContent;
      
      try {
        if (this.icalParser.isValidICalContent(eventsContent)) {
          parsedCalendar = await this.icalParser.parseICalContent(eventsContent);
          console.log(`Successfully parsed ${parsedCalendar.events.length} events from ICAL content`);
        } else {
          console.log('Content is not valid ICAL format, using fallback structure');
        }
      } catch (error) {
        console.log('Failed to parse ICAL content, using fallback structure:', error);
      }
      
      // Generate proper ICAL content for return if needed
      if (parsedCalendar && parsedCalendar.events.length > 0) {
        console.log(`Using parsed calendar with ${parsedCalendar.events.length} events`);
        icalContentToReturn = this.icalParser.convertToICalString(parsedCalendar);
      } else if (!eventsContent.includes('BEGIN:VCALENDAR')) {
        // If Perplexity didn't return proper ICAL format, create a basic one with the content as description
        console.log('Creating fallback ICAL structure for return');
        icalContentToReturn = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Events API//Events Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Events for ${location}${genre ? ` (${genre})` : ''}
X-WR-TIMEZONE:UTC
BEGIN:VEVENT
UID:events-${Date.now()}@events-api
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}
DTSTART:${startDateTime ? parseISO(startDateTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z') : new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}
DTEND:${endDateTime ? parseISO(endDateTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z') : new Date(Date.now() + 86400000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}
SUMMARY:Events in ${location}${genre ? ` - ${genre}` : ''}
DESCRIPTION:${eventsContent.replace(/\n/g, '\\n')}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;
      }
      
      // Verify events if requested
      if (options.enableVerification && parsedCalendar && parsedCalendar.events.length > 0) {
        const verificationResult = await this.verificationService.verifyEvents(
          parsedCalendar.events,
          location,
          genre,
          startDateTime,
          endDateTime
        );
        
        console.log(`Event verification complete:`, {
          total: verificationResult.stats.totalEvents,
          verified: verificationResult.stats.verifiedCount,
          partial: verificationResult.stats.partialCount,
          unverified: verificationResult.stats.unverifiedCount,
          avgConfidence: verificationResult.stats.averageConfidence
        });
        
        // Update parsedCalendar with verified events
        parsedCalendar.events = verificationResult.verifiedEvents;
        
        // Regenerate ICAL with verification metadata
        icalContentToReturn = this.generateVerifiedICalString(parsedCalendar, verificationResult.verifiedEvents);
      }
      
      // Save to file
      await this.saveToFile(location, eventsContent, genre, startDateTime, endDateTime, parsedCalendar);
      return icalContentToReturn;
    } catch (error) {
      console.error('Error calling Perplexity API:', error);
      
      // Handle specific axios errors
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid or expired API key. Please contact the administrator to update the Perplexity API key.');
        } else if (error.response?.status === 403) {
          throw new Error('Access forbidden. The API key may not have the required permissions.');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (error.response?.status === 500) {
          throw new Error('The Perplexity API is experiencing issues. Please try again later.');
        } else if (error.response && error.response.status >= 400) {
          throw new Error(`API request failed with status ${error.response.status}. Please check your request and try again.`);
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new Error('Unable to connect to the Perplexity API. Please check your internet connection.');
        }
        throw new Error(`API Error: ${error.response?.status || 'Unknown'} - ${error.response?.statusText || 'Unknown error'}`);
      }
      
      // If it's already our custom error message, pass it through
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('An unexpected error occurred while fetching events. Please try again.');
    }
  }

  private async saveToFile(location: string, content: string, genre?: string, startDateTime?: string, endDateTime?: string, parsedCalendar?: ParsedCalendar | null): Promise<void> {
    try {
      // Only save files when running on localhost (not on Vercel production)
      const isLocalhost = process.env.NODE_ENV !== 'production' || 
                         process.env.VERCEL !== '1' || 
                         process.env.PORT === '3000';
      
      if (!isLocalhost) {
        console.log('Skipping file save - running on production/Vercel');
        return;
      }

      // Create responses/ical directory if it doesn't exist
      const icalDir = path.join(process.cwd(), 'responses', 'ical');
      if (!fs.existsSync(icalDir)) {
        fs.mkdirSync(icalDir, { recursive: true });
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const genrePart = genre ? `-${genre.toLowerCase().replace(/\s+/g, '-')}` : '';
      const filename = `events-${location.toLowerCase().replace(/\s+/g, '-')}${genrePart}-${timestamp}.ics`;
      const filepath = path.join(icalDir, filename);
      
      let icalContent = content;
      
      // If we have a parsed calendar, use the parser to create proper ICAL
      if (parsedCalendar && parsedCalendar.events.length > 0) {
        console.log(`Using parsed calendar with ${parsedCalendar.events.length} events`);
        icalContent = this.icalParser.convertToICalString(parsedCalendar);
      } else if (!content.includes('BEGIN:VCALENDAR')) {
        // If Perplexity didn't return proper ICAL format, create a basic one with the content as description
        console.log('Creating fallback ICAL structure');
        icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Events API//Events Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Events for ${location}${genre ? ` (${genre})` : ''}
X-WR-TIMEZONE:UTC
BEGIN:VEVENT
UID:events-${Date.now()}@events-api
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}
DTSTART:${startDateTime ? parseISO(startDateTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z') : new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}
DTEND:${endDateTime ? parseISO(endDateTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z') : new Date(Date.now() + 86400000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}
SUMMARY:Events in ${location}${genre ? ` - ${genre}` : ''}
DESCRIPTION:${content.replace(/\n/g, '\\n')}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;
      }
      
      // Write ICAL content to file
      fs.writeFileSync(filepath, icalContent, 'utf8');
      console.log(`✅ ICAL calendar saved to: ${filepath}`);
      
      // Also validate the saved ICAL
      if (this.icalParser.isValidICalContent(icalContent)) {
        console.log(`✅ ICAL validation successful`);
      } else {
        console.warn(`⚠️  ICAL validation failed, but file was saved`);
      }
    } catch (error) {
      console.error('Error saving ICAL file:', error);
      throw new Error('Failed to save ICAL calendar file');
    }
  }

  /**
   * Generate ICAL string with verification metadata
   */
  private generateVerifiedICalString(parsedCalendar: ParsedCalendar, verifiedEvents: VerifiedEvent[]): string {
    let icalString = 'BEGIN:VCALENDAR\n';
    icalString += 'VERSION:2.0\n';
    icalString += `PRODID:${parsedCalendar.metadata.prodId || '-//Events API//Verified Events Calendar//EN'}\n`;
    icalString += 'CALSCALE:GREGORIAN\n';
    icalString += `METHOD:${parsedCalendar.metadata.method || 'PUBLISH'}\n`;
    
    if (parsedCalendar.metadata.calendarName) {
      icalString += `X-WR-CALNAME:${parsedCalendar.metadata.calendarName} (Verified)\n`;
    }

    for (const event of verifiedEvents) {
      icalString += 'BEGIN:VEVENT\n';
      icalString += `UID:${event.uid}\n`;
      icalString += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}\n`;
      icalString += `DTSTART:${event.start.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}\n`;
      icalString += `DTEND:${event.end.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}\n`;
      icalString += `SUMMARY:${event.summary}${event.verificationStatus === 'verified' ? ' ✓' : event.verificationStatus === 'partial' ? ' ⚠' : ''}\n`;
      
      // Add verification metadata to description
      let description = event.description || '';
      description += `\n\n[Verification Status: ${event.verificationStatus.toUpperCase()}]`;
      description += `\n[Confidence: ${event.confidence}% - ${EventVerificationService.getConfidenceDescription(event.confidence)}]`;
      
      if (event.matchedSource) {
        description += `\n[Source: ${event.matchedSource.source}]`;
        if (event.matchedSource.url) {
          description += `\n[More Info: ${event.matchedSource.url}]`;
        }
      }
      
      if (event.discrepancies && event.discrepancies.length > 0) {
        description += `\n[Discrepancies Found:]`;
        event.discrepancies.forEach(d => {
          description += `\n- ${d}`;
        });
      }
      
      icalString += `DESCRIPTION:${description.replace(/\n/g, '\\n')}\n`;
      
      if (event.location) {
        icalString += `LOCATION:${event.location}\n`;
      }
      if (event.organizer) {
        icalString += `ORGANIZER:${event.organizer}\n`;
      }
      if (event.url) {
        icalString += `URL:${event.url}\n`;
      }
      if (event.price) {
        icalString += `X-PRICE:${event.price}\n`;
      }
      
      // Add custom properties for verification
      icalString += `X-VERIFICATION-STATUS:${event.verificationStatus}\n`;
      icalString += `X-CONFIDENCE:${event.confidence}\n`;
      
      icalString += 'END:VEVENT\n';
    }

    icalString += 'END:VCALENDAR\n';
    return icalString;
  }
} 