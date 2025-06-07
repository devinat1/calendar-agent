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
    console.log(`Fetching events for location: ${location}`);
    
    const events = await perplexityService.getEventsForLocation(location);
    
    res.json({
      location,
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
    const { location = 'San Francisco' } = req.body;
    console.log(`Fetching events for location: ${location}`);
    
    const events = await perplexityService.getEventsForLocation(location);
    
    res.json({
      location,
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