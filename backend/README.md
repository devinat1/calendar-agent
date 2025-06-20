# Perplexity Events Backend

A TypeScript backend server that fetches events happening this week in any location using the Perplexity Sonar API.

## Features

- RESTful API endpoints for fetching events
- Default location: San Francisco
- Automatic saving of responses to text files
- CORS enabled for cross-origin requests
- Error handling and logging

### 🔍 LLM-Powered Event Discovery
- Uses Perplexity AI's Sonar model to find events based on location, genre, and time range
- Generates events in iCal format for easy calendar integration

### ✅ Event Verification & Source Links
- **NEW**: Cross-references LLM results with real event sources (Eventbrite, Ticketmaster, etc.)
- Provides confidence scores and verification status for each event
- **Automatically includes source URLs** so users can click through to event pages
- Identifies discrepancies between LLM and real data

### 📅 Calendar Integration
- Generates proper iCal files with verification metadata
- Supports event filtering by price, gender ratio, online status
- Venue ratings integration

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set your Perplexity API key:**
   You'll need to update the API key in `src/services/perplexity.service.ts`:
   ```typescript
   this.apiKey = 'your-actual-perplexity-api-key';
   ```
   
   Or set it as an environment variable:
   ```bash
   export PERPLEXITY_API_KEY="your-actual-api-key"
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Start the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /events?location=LocationName
Fetch events for a specific location via query parameter.

**Example:**
```bash
curl "http://localhost:3000/events?location=New York"
```

### POST /events
Fetch events for a specific location via request body.

**Request Body:**
```json
{
  "location": "New York"
}
```

**Response:**
```json
{
  "location": "New York",
  "events": "Events content from Perplexity API...",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET/POST `/events`

#### Parameters:
- `location` (required): Event location
- `genre` (required): Event type/genre
- `startDateTime`: Start date in ISO format
- `endDateTime`: End date in ISO format
- `enableVerification`: Enable real event verification (default: false)
- `maleFemaleRatio`: Desired gender ratio (e.g., "60:40")
- `onlineOnly`: Filter for online events only
- `maxPrice`: Maximum price filter

#### Response includes:
```json
{
  "events": [
    {
      "name": "Jazz Night at Blue Note",
      "date": "2024-01-15T20:00:00Z",
      "url": "https://www.eventbrite.com/e/jazz-night-12345",
      "venue": "Blue Note Jazz Club",
      "confidence": 85,
      "verificationStatus": "verified",
      "matchedSource": {
        "name": "Jazz Night - Blue Note SF",
        "source": "eventbrite",
        "url": "https://www.eventbrite.com/e/jazz-night-12345"
      }
    }
  ]
}
```

## File Output

Responses are automatically saved to the `responses/` directory with the following naming pattern:
```
events-{location}-{timestamp}.txt
```

Example: `events-san-francisco-2024-01-15T10-30-00-000Z.txt`

## Project Structure

```
├── src/
│   ├── server.ts                    # Main Express server
│   └── services/
│       └── perplexity.service.ts    # Perplexity API service
├── responses/                       # Generated response files
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `PERPLEXITY_API_KEY`: Your Perplexity API key

## Getting a Perplexity API Key

1. Visit [Perplexity API](https://docs.perplexity.ai/)
2. Sign up for an account
3. Generate an API key
4. Add it to your environment or directly in the service file

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

The server will be available at `http://localhost:3000` by default. 

## How Event Verification Works

1. **LLM Generation**: Perplexity generates events based on your query
2. **Real Data Fetching**: System queries Eventbrite, Ticketmaster, etc. for actual events
3. **Smart Matching**: Events are matched using:
   - Name similarity (40% weight)
   - Time proximity (30% weight)  
   - Location matching (20% weight)
   - Price comparison (10% weight)
4. **URL Extraction**: Real event URLs are automatically included
5. **Confidence Scoring**: Each event gets a 0-100% confidence score

## Verification Status Levels

- **Verified (80%+)**: High confidence match with real event data
- **Partial (50-79%)**: Moderate match, some discrepancies noted
- **Unverified (<50%)**: Low or no match found

## Event URLs

The system provides clickable links to events through multiple methods:

1. **Direct URLs**: From LLM-generated content (when Perplexity finds specific events)
2. **Verified Source URLs**: From real event APIs (Eventbrite, Ticketmaster, etc.)
3. **Fallback URLs**: To venue websites or location pages

Enable `enableVerification=true` in your API requests to get the most comprehensive URL coverage and verification data.

## Testing

```bash
npm test
```

## Production Deployment

This is configured for Vercel deployment. Set environment variables in your Vercel dashboard. 