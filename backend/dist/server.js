"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const perplexity_service_1 = require("./services/perplexity.service");
const ical_parser_service_1 = require("./services/ical-parser.service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize services
const perplexityService = new perplexity_service_1.PerplexityService();
const icalParser = new ical_parser_service_1.ICalParserService();
// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.get('/events', async (req, res) => {
    try {
        const location = req.query.location || 'San Francisco';
        const genre = req.query.genre;
        const startDateTime = req.query.startDateTime;
        const endDateTime = req.query.endDateTime;
        console.log(`Fetching events for location: ${location}`, {
            genre: genre || 'any',
            startDateTime: startDateTime || 'not specified',
            endDateTime: endDateTime || 'not specified'
        });
        const icalContent = await perplexityService.getEventsForLocation(location, {
            genre,
            startDateTime,
            endDateTime
        });
        // Parse ICAL content to extract events array
        let events = [];
        try {
            if (icalParser.isValidICalContent(icalContent)) {
                const parsedCalendar = await icalParser.parseICalContent(icalContent);
                events = parsedCalendar.events.map(event => ({
                    name: event.summary,
                    date: event.start.toISOString(),
                    time: event.start.toLocaleTimeString(),
                    location: event.location,
                    description: event.description,
                    url: event.url,
                    venue: event.location
                }));
            }
            else {
                // If not valid ICAL, return the content as a single event description
                events = [{
                        name: `Events in ${location}${genre ? ` - ${genre}` : ''}`,
                        date: startDateTime || new Date().toISOString(),
                        time: new Date(startDateTime || Date.now()).toLocaleTimeString(),
                        location,
                        description: icalContent,
                        venue: location
                    }];
            }
        }
        catch (parseError) {
            console.warn('Failed to parse ICAL content:', parseError);
            // Fallback to a single event with the raw content
            events = [{
                    name: `Events in ${location}${genre ? ` - ${genre}` : ''}`,
                    date: startDateTime || new Date().toISOString(),
                    time: new Date(startDateTime || Date.now()).toLocaleTimeString(),
                    location,
                    description: icalContent,
                    venue: location
                }];
        }
        res.json({
            location,
            genre: genre || null,
            startDateTime: startDateTime || null,
            endDateTime: endDateTime || null,
            events,
            icalContent: icalContent,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
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
        const { location = 'San Francisco', genre, startDateTime, endDateTime } = req.body;
        console.log(`Fetching events for location: ${location}`, {
            genre: genre || 'any',
            startDateTime: startDateTime || 'not specified',
            endDateTime: endDateTime || 'not specified'
        });
        const icalContent = await perplexityService.getEventsForLocation(location, {
            genre,
            startDateTime,
            endDateTime
        });
        // Parse ICAL content to extract events array
        let events = [];
        try {
            if (icalParser.isValidICalContent(icalContent)) {
                const parsedCalendar = await icalParser.parseICalContent(icalContent);
                events = parsedCalendar.events.map(event => ({
                    name: event.summary,
                    date: event.start.toISOString(),
                    time: event.start.toLocaleTimeString(),
                    location: event.location,
                    description: event.description,
                    url: event.url,
                    venue: event.location
                }));
            }
            else {
                // If not valid ICAL, return the content as a single event description
                events = [{
                        name: `Events in ${location}${genre ? ` - ${genre}` : ''}`,
                        date: startDateTime || new Date().toISOString(),
                        time: new Date(startDateTime || Date.now()).toLocaleTimeString(),
                        location,
                        description: icalContent,
                        venue: location
                    }];
            }
        }
        catch (parseError) {
            console.warn('Failed to parse ICAL content:', parseError);
            // Fallback to a single event with the raw content
            events = [{
                    name: `Events in ${location}${genre ? ` - ${genre}` : ''}`,
                    date: startDateTime || new Date().toISOString(),
                    time: new Date(startDateTime || Date.now()).toLocaleTimeString(),
                    location,
                    description: icalContent,
                    venue: location
                }];
        }
        res.json({
            location,
            genre: genre || null,
            startDateTime: startDateTime || null,
            endDateTime: endDateTime || null,
            events,
            icalContent: icalContent,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
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
exports.default = app;
//# sourceMappingURL=server.js.map