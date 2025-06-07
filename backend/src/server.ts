import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { PerplexityService } from './services/perplexity.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Perplexity service
const perplexityService = new PerplexityService();

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
    
    console.log(`Fetching events for location: ${location}`, {
      genre: genre || 'any',
      startDateTime: startDateTime || 'not specified',
      endDateTime: endDateTime || 'not specified'
    });
    
    const events = await perplexityService.getEventsForLocation(location, {
      genre,
      startDateTime,
      endDateTime
    });
    
    res.json({
      location,
      genre: genre || null,
      startDateTime: startDateTime || null,
      endDateTime: endDateTime || null,
      events,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/events', async (req, res) => {
  try {
    const { location = 'San Francisco', genre, startDateTime, endDateTime } = req.body;
    
    console.log(`Fetching events for location: ${location}`, {
      genre: genre || 'any',
      startDateTime: startDateTime || 'not specified',
      endDateTime: endDateTime || 'not specified'
    });
    
    const events = await perplexityService.getEventsForLocation(location, {
      genre,
      startDateTime,
      endDateTime
    });
    
    res.json({
      location,
      genre: genre || null,
      startDateTime: startDateTime || null,
      endDateTime: endDateTime || null,
      events,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      message: error instanceof Error ? error.message : 'Unknown error'
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