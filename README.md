# Perplexity Events Backend

A TypeScript backend server that fetches events happening this week in any location using the Perplexity Sonar API.

## Features

- RESTful API endpoints for fetching events
- Default location: San Francisco
- Automatic saving of responses to text files
- CORS enabled for cross-origin requests
- Error handling and logging

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set your Perplexity API key:**
   You'll need to update the API key in `src/services/perplexity.service.ts`:
   ```typescript
   this.apiKey = 'your-actual-perplexity-api-key-here';
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