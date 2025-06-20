import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { PerplexityService } from './services/perplexity.service';
import { ICalParserService } from './services/ical-parser.service';
import { RatingService } from './services/rating.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:3000', // Frontend development server
    'http://127.0.0.1:3000', // Alternative localhost format
    process.env.FRONTEND_URL || 'https://calendar-agent-1lar.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
// Handle CORS preflight requests
app.options('*', cors(corsOptions));
app.use(express.json());

// Initialize services
const perplexityService = new PerplexityService();
const icalParser = new ICalParserService();
const ratingService = new RatingService();

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/events', async (req, res) => {
  try {
    const location = (req.query.location as string) || 'San Francisco';
    const genre = req.query.genre as string;
    const startDateTime = req.query.startDateTime as string;
    const endDateTime = req.query.endDateTime as string;
    const maleFemaleRatio = req.query.maleFemaleRatio as string | undefined;
    const onlineOnly = req.query.onlineOnly === 'true';
    const maxPrice = req.query.maxPrice as string | undefined;
    
    console.log(`Fetching events for location: ${location}`, {
      genre: genre || 'any',
      startDateTime: startDateTime || 'not specified',
      endDateTime: endDateTime || 'not specified',
      maleFemaleRatio: maleFemaleRatio || 'none',
      onlineOnly,
      maxPrice: maxPrice || 'none'
    });
    
    const icalContent = await perplexityService.getEventsForLocation(location, {
      genre,
      startDateTime,
      endDateTime
    });
    
    // Parse ICAL content to extract events array
    let events = [] as any[];
    try {
        if (icalParser.isValidICalContent(icalContent)) {
          const parsedCalendar = await icalParser.parseICalContent(icalContent);
          events = await Promise.all(
            parsedCalendar.events.map(async event => {
              const ratio = icalParser.extractGenderRatio(event.description);
              const rating = await ratingService.getRatingForPlace(event.location || '');
              return {
                name: event.summary,
                date: event.start.toISOString(),
                time: event.start.toLocaleTimeString(),
                location: event.location,
                description: event.description,
                price: event.price,
                url: event.url,
                venue: event.location,
                malePercentage: ratio?.malePercentage,
                femalePercentage: ratio?.femalePercentage,
                online: icalParser.isOnlineEvent(event),
                rating
              };
            })
          );
      } else {
        // If not valid ICAL, return the content as a single event description
        events = [{
          name: `Events in ${location}${genre ? ` - ${genre}` : ''}`,
          date: startDateTime || new Date().toISOString(),
          time: new Date(startDateTime || Date.now()).toLocaleTimeString(),
          location,
          description: icalContent,
          venue: location,
          online: false
        }];
      }
    } catch (parseError) {
      console.warn('Failed to parse ICAL content:', parseError);
      // Fallback to a single event with the raw content
      events = [{
        name: `Events in ${location}${genre ? ` - ${genre}` : ''}`,
        date: startDateTime || new Date().toISOString(),
        time: new Date(startDateTime || Date.now()).toLocaleTimeString(),
        location,
        description: icalContent,
        venue: location,
        online: false
      }];
    }

    if (maleFemaleRatio) {
      const parts = maleFemaleRatio.split(':');
      if (parts.length === 2) {
        const male = parseFloat(parts[0]);
        const female = parseFloat(parts[1]);
        if (!isNaN(male) && !isNaN(female)) {
          events = events.filter(e =>
            typeof e.malePercentage === 'number' &&
            typeof e.femalePercentage === 'number' &&
            Math.abs(e.malePercentage - male) <= 10 &&
            Math.abs(e.femalePercentage - female) <= 10
          );
        }
      }
    }

    if (maxPrice) {
      const priceLimit = parseFloat(maxPrice);
      if (!isNaN(priceLimit)) {
        events = events.filter(e => {
          if (!e.price) return false;
          const num = parseFloat(e.price.replace(/[^0-9.]/g, ''));
          return !isNaN(num) && num <= priceLimit;
        });
      }
    }

    if (onlineOnly) {
      events = events.filter(e => e.online === true);
    }
    
    res.json({
      location,
      genre: genre || null,
      startDateTime: startDateTime || null,
      endDateTime: endDateTime || null,
      maleFemaleRatio: maleFemaleRatio || null,
      onlineOnly,
      maxPrice: maxPrice || null,
      events,
      icalContent: icalContent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    
    // Determine error type and provide appropriate response
    let statusCode = 500;
    let errorType = 'INTERNAL_ERROR';
    let userMessage = 'An unexpected error occurred while fetching events.';
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // Date validation errors
      if (errorMessage.includes('date') && errorMessage.includes('future')) {
        statusCode = 400;
        errorType = 'VALIDATION_ERROR';
        userMessage = error.message;
      }
      // Date comparison errors
      else if (errorMessage.includes('end') && errorMessage.includes('after')) {
        statusCode = 400;
        errorType = 'VALIDATION_ERROR';
        userMessage = error.message;
      }
      // Missing date field errors
      else if (errorMessage.includes('both') && errorMessage.includes('date')) {
        statusCode = 400;
        errorType = 'VALIDATION_ERROR';
        userMessage = error.message;
      }
      // API key errors
      else if (errorMessage.includes('api key')) {
        statusCode = 503;
        errorType = 'CONFIGURATION_ERROR';
        userMessage = 'The service is temporarily unavailable due to configuration issues. Please try again later.';
      }
      // Rate limiting errors
      else if (errorMessage.includes('rate limit')) {
        statusCode = 429;
        errorType = 'RATE_LIMIT_ERROR';
        userMessage = error.message;
      }
      // Network/connection errors
      else if (errorMessage.includes('connect') || errorMessage.includes('network')) {
        statusCode = 503;
        errorType = 'NETWORK_ERROR';
        userMessage = 'Unable to connect to the events service. Please check your internet connection and try again.';
      }
      // API service errors
      else if (errorMessage.includes('api') && (errorMessage.includes('experiencing issues') || errorMessage.includes('status 5'))) {
        statusCode = 503;
        errorType = 'SERVICE_ERROR';
        userMessage = 'The events service is temporarily unavailable. Please try again in a few minutes.';
      }
      // Permission errors
      else if (errorMessage.includes('forbidden') || errorMessage.includes('unauthorized')) {
        statusCode = 503;
        errorType = 'AUTHORIZATION_ERROR';
        userMessage = 'The service is temporarily unavailable due to access issues. Please try again later.';
      }
      // For any other known error messages, use them directly
      else if (error.message && error.message.length > 0) {
        userMessage = error.message;
      }
    }
    
    res.status(statusCode).json({
      error: errorType,
      message: userMessage,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/events', async (req, res) => {
  try {
    const { location = 'San Francisco', genre, startDateTime, endDateTime, maleFemaleRatio, onlineOnly, maxPrice } = req.body;
    
    console.log(`Fetching events for location: ${location}`, {
      genre: genre || 'any',
      startDateTime: startDateTime || 'not specified',
      endDateTime: endDateTime || 'not specified',
      maleFemaleRatio: maleFemaleRatio || 'none',
      onlineOnly,
      maxPrice: maxPrice || 'none'
    });
    
    const icalContent = await perplexityService.getEventsForLocation(location, {
      genre,
      startDateTime,
      endDateTime
    });
    
    // Parse ICAL content to extract events array
    let events: any[] = [];
    try {
      if (icalParser.isValidICalContent(icalContent)) {
        const parsedCalendar = await icalParser.parseICalContent(icalContent);
        events = await Promise.all(
          parsedCalendar.events.map(async event => {
            const ratio = icalParser.extractGenderRatio(event.description);
            const rating = await ratingService.getRatingForPlace(event.location || '');
            return {
              name: event.summary,
              date: event.start.toISOString(),
              time: event.start.toLocaleTimeString(),
              location: event.location,
              description: event.description,
              price: event.price,
              url: event.url,
              venue: event.location,
              malePercentage: ratio?.malePercentage,
              femalePercentage: ratio?.femalePercentage,
              online: icalParser.isOnlineEvent(event),
              rating
            };
          })
        );
      } else {
        // If not valid ICAL, return the content as a single event description
        events = [{
          name: `Events in ${location}${genre ? ` - ${genre}` : ''}`,
          date: startDateTime || new Date().toISOString(),
          time: new Date(startDateTime || Date.now()).toLocaleTimeString(),
          location,
          description: icalContent,
          venue: location,
          online: false
        }];
      }
    } catch (parseError) {
      console.warn('Failed to parse ICAL content:', parseError);
      // Fallback to a single event with the raw content
      events = [{
        name: `Events in ${location}${genre ? ` - ${genre}` : ''}`,
        date: startDateTime || new Date().toISOString(),
        time: new Date(startDateTime || Date.now()).toLocaleTimeString(),
        location,
        description: icalContent,
        venue: location,
        online: false
      }];
    }
    
    if (maleFemaleRatio) {
      const parts = maleFemaleRatio.split(':');
      if (parts.length === 2) {
        const male = parseFloat(parts[0]);
        const female = parseFloat(parts[1]);
        if (!isNaN(male) && !isNaN(female)) {
          events = events.filter(e =>
            typeof e.malePercentage === 'number' &&
            typeof e.femalePercentage === 'number' &&
            Math.abs(e.malePercentage - male) <= 10 &&
            Math.abs(e.femalePercentage - female) <= 10
          );
        }
      }
    }

    if (maxPrice) {
      const priceLimit = parseFloat(maxPrice);
      if (!isNaN(priceLimit)) {
        events = events.filter(e => {
          if (!e.price) return false;
          const num = parseFloat(e.price.replace(/[^0-9.]/g, ''));
          return !isNaN(num) && num <= priceLimit;
        });
      }
    }

    if (onlineOnly) {
      events = events.filter(e => e.online === true);
    }

    res.json({
      location,
      genre: genre || null,
      startDateTime: startDateTime || null,
      endDateTime: endDateTime || null,
      maleFemaleRatio: maleFemaleRatio || null,
      onlineOnly,
      maxPrice: maxPrice || null,
      events,
      icalContent: icalContent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    
    // Determine error type and provide appropriate response
    let statusCode = 500;
    let errorType = 'INTERNAL_ERROR';
    let userMessage = 'An unexpected error occurred while fetching events.';
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // Date validation errors
      if (errorMessage.includes('date') && errorMessage.includes('future')) {
        statusCode = 400;
        errorType = 'VALIDATION_ERROR';
        userMessage = error.message;
      }
      // Date comparison errors
      else if (errorMessage.includes('end') && errorMessage.includes('after')) {
        statusCode = 400;
        errorType = 'VALIDATION_ERROR';
        userMessage = error.message;
      }
      // Missing date field errors
      else if (errorMessage.includes('both') && errorMessage.includes('date')) {
        statusCode = 400;
        errorType = 'VALIDATION_ERROR';
        userMessage = error.message;
      }
      // API key errors
      else if (errorMessage.includes('api key')) {
        statusCode = 503;
        errorType = 'CONFIGURATION_ERROR';
        userMessage = 'The service is temporarily unavailable due to configuration issues. Please try again later.';
      }
      // Rate limiting errors
      else if (errorMessage.includes('rate limit')) {
        statusCode = 429;
        errorType = 'RATE_LIMIT_ERROR';
        userMessage = error.message;
      }
      // Network/connection errors
      else if (errorMessage.includes('connect') || errorMessage.includes('network')) {
        statusCode = 503;
        errorType = 'NETWORK_ERROR';
        userMessage = 'Unable to connect to the events service. Please check your internet connection and try again.';
      }
      // API service errors
      else if (errorMessage.includes('api') && (errorMessage.includes('experiencing issues') || errorMessage.includes('status 5'))) {
        statusCode = 503;
        errorType = 'SERVICE_ERROR';
        userMessage = 'The events service is temporarily unavailable. Please try again in a few minutes.';
      }
      // Permission errors
      else if (errorMessage.includes('forbidden') || errorMessage.includes('unauthorized')) {
        statusCode = 503;
        errorType = 'AUTHORIZATION_ERROR';
        userMessage = 'The service is temporarily unavailable due to access issues. Please try again later.';
      }
      // For any other known error messages, use them directly
      else if (error.message && error.message.length > 0) {
        userMessage = error.message;
      }
    }
    
    res.status(statusCode).json({
      error: errorType,
      message: userMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Events endpoint: http://localhost:${PORT}/events`);
});

export default app; 