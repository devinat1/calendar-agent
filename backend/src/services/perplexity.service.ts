import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { isAfter, parseISO } from 'date-fns';
import { ICalParserService, ParsedCalendar } from './ical-parser.service';

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
}

export class PerplexityService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.perplexity.ai/chat/completions';
  private readonly icalParser: ICalParserService;
  
  constructor() {
    // You'll need to set your API key here or pass it as a parameter
    this.apiKey = process.env.PERPLEXITY_API_KEY || 'your-api-key-here';
    this.icalParser = new ICalParserService();
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
        if (!isAfter(start, now) || !isAfter(end, now) || !isAfter(end, start)) {
          throw new Error('Start and end date/time must be in the future, and end must be after start.');
        }
        intervalString = ` between ${start.toISOString()} and ${end.toISOString()}`;
      } else if (startDateTime || endDateTime) {
        throw new Error('Both startDateTime and endDateTime must be provided together.');
      }
      const genreString = genre ? ` of genre "${genre}"` : '';
      const prompt = `Give events${genreString} happening in ${location}${intervalString ? intervalString : ' this week'}. Only include events that are scheduled in the future. Format the response as a valid ICAL (.ics) calendar file with proper VEVENT entries. Include event titles, descriptions, start/end times, and locations. Use proper ICAL formatting with BEGIN:VCALENDAR, VERSION:2.0, PRODID, and END:VCALENDAR structure.`;
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
      
      // Save to file
      await this.saveToFile(location, eventsContent, genre, startDateTime, endDateTime, parsedCalendar);
      return eventsContent;
    } catch (error) {
      console.error('Error calling Perplexity API:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`API Error: ${error.response?.status} - ${error.response?.statusText}`);
      }
      throw new Error('Failed to fetch events from Perplexity API');
    }
  }

  // TODO Eventually remove this (replace with a database + ICAL integration)
  private async saveToFile(location: string, content: string, genre?: string, startDateTime?: string, endDateTime?: string, parsedCalendar?: ParsedCalendar | null): Promise<void> {
    try {
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
} 