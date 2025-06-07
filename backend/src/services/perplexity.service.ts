import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class PerplexityService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.perplexity.ai/chat/completions';
  
  constructor() {
    // You'll need to set your API key here or pass it as a parameter
    this.apiKey = process.env.PERPLEXITY_API_KEY || 'your-api-key-here';
  }

  async getEventsForLocation(location: string): Promise<string> {
    try {
      const prompt = `give events happening this week in ${location}`;
      
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
      await this.saveToFile(location, eventsContent);
      
      return eventsContent;
    } catch (error) {
      console.error('Error calling Perplexity API:', error);
      
      if (axios.isAxiosError(error)) {
        throw new Error(`API Error: ${error.response?.status} - ${error.response?.statusText}`);
      }
      
      throw new Error('Failed to fetch events from Perplexity API');
    }
  }

  private async saveToFile(location: string, content: string): Promise<void> {
    try {
      // Create responses directory if it doesn't exist
      const responsesDir = path.join(process.cwd(), 'responses');
      if (!fs.existsSync(responsesDir)) {
        fs.mkdirSync(responsesDir, { recursive: true });
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `events-${location.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.txt`;
      const filepath = path.join(responsesDir, filename);

      // Prepare content with metadata
      const fileContent = `Events for ${location}
Generated: ${new Date().toISOString()}
Prompt: "give events happening this week in ${location}"

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