import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { isAfter, parseISO } from 'date-fns';

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
  
  constructor() {
    // You'll need to set your API key here or pass it as a parameter
    this.apiKey = process.env.PERPLEXITY_API_KEY || 'your-api-key-here';
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
      const prompt = `Give events${genreString} happening in ${location}${intervalString ? intervalString : ' this week'}. Only include events that are scheduled in the future.`;
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
      // Save to file
      await this.saveToFile(location, eventsContent, genre, startDateTime, endDateTime);
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
  private async saveToFile(location: string, content: string, genre?: string, startDateTime?: string, endDateTime?: string): Promise<void> {
    try {
      // Create responses directory if it doesn't exist
      const responsesDir = path.join(process.cwd(), 'responses');
      if (!fs.existsSync(responsesDir)) {
        fs.mkdirSync(responsesDir, { recursive: true });
      }
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const genrePart = genre ? `-${genre.toLowerCase().replace(/\s+/g, '-')}` : '';
      const filename = `events-${location.toLowerCase().replace(/\s+/g, '-')}${genrePart}-${timestamp}.txt`;
      const filepath = path.join(responsesDir, filename);
      // Prepare content with metadata
      const fileContent = `Events for ${location}${genre ? ` (Genre: ${genre})` : ''}
Generated: ${new Date().toISOString()}
Prompt: "Give events${genre ? ` of genre \"${genre}\"` : ''} happening in ${location}${startDateTime && endDateTime ? ` between ${startDateTime} and ${endDateTime}` : ' this week'}. Only include events that are scheduled in the future."
${content}`;
      // Write to file
      fs.writeFileSync(filepath, fileContent, 'utf8');
      console.log(`Response saved to: ${filepath}`);
    } catch (error) {
      console.error('Error saving to file:', error);
      throw new Error('Failed to save response to file');
    }
  }
} 