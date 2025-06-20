"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ICalParserService = void 0;
const ical = __importStar(require("node-ical"));
const fs = __importStar(require("fs"));
class ICalParserService {
    /**
     * Parse ICAL content from a string
     * @param icalContent The raw ICAL content as a string
     * @returns Parsed calendar data
     */
    async parseICalContent(icalContent) {
        try {
            const parsed = ical.parseICS(icalContent);
            const events = [];
            const metadata = {
                calendarName: undefined,
                prodId: undefined,
                version: undefined,
                method: undefined,
            };
            // Extract metadata from the raw content since node-ical doesn't always expose all properties
            const lines = icalContent.split('\n');
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('X-WR-CALNAME:')) {
                    metadata.calendarName = trimmedLine.substring('X-WR-CALNAME:'.length);
                }
                else if (trimmedLine.startsWith('PRODID:')) {
                    metadata.prodId = trimmedLine.substring('PRODID:'.length);
                }
                else if (trimmedLine.startsWith('VERSION:')) {
                    metadata.version = trimmedLine.substring('VERSION:'.length);
                }
                else if (trimmedLine.startsWith('METHOD:')) {
                    metadata.method = trimmedLine.substring('METHOD:'.length);
                }
            }
            for (const key in parsed) {
                const component = parsed[key];
                if (component.type === 'VEVENT') {
                    // Extract event data
                    const event = {
                        uid: component.uid || `event-${Date.now()}-${Math.random()}`,
                        summary: component.summary || 'Untitled Event',
                        description: component.description,
                        start: component.start ? new Date(component.start) : new Date(),
                        end: component.end ? new Date(component.end) : new Date(),
                        location: component.location,
                        url: component.url,
                        organizer: typeof component.organizer === 'object' ? component.organizer?.val : component.organizer,
                        price: component.price || component.cost || this.extractPrice(component.description),
                    };
                    events.push(event);
                }
            }
            return { events, metadata };
        }
        catch (error) {
            // If parsing fails completely, try to extract basic info manually
            if (icalContent.includes('BEGIN:VCALENDAR') && icalContent.includes('END:VCALENDAR')) {
                // Return empty result rather than throwing error
                return {
                    events: [],
                    metadata: {
                        calendarName: undefined,
                        prodId: undefined,
                        version: undefined,
                        method: undefined,
                    }
                };
            }
            throw new Error(`Failed to parse ICAL content: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Parse ICAL content from a file
     * @param filePath Path to the ICAL file
     * @returns Parsed calendar data
     */
    async parseICalFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            const content = fs.readFileSync(filePath, 'utf8');
            return await this.parseICalContent(content);
        }
        catch (error) {
            throw new Error(`Failed to parse ICAL file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Validate if a string contains valid ICAL content
     * @param icalContent The ICAL content to validate
     * @returns True if valid, false otherwise
     */
    isValidICalContent(icalContent) {
        try {
            // Basic validation - must contain required ICAL components
            if (!icalContent.includes('BEGIN:VCALENDAR') || !icalContent.includes('END:VCALENDAR')) {
                return false;
            }
            // Check for balanced BEGIN/END pairs
            const beginCount = (icalContent.match(/BEGIN:VCALENDAR/g) || []).length;
            const endCount = (icalContent.match(/END:VCALENDAR/g) || []).length;
            if (beginCount !== endCount || beginCount === 0) {
                return false;
            }
            // Try parsing to validate structure
            const parsed = ical.parseICS(icalContent);
            return true; // If no exception is thrown, it's valid enough
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Extract events from parsed calendar data that fall within a date range
     * @param parsedCalendar Parsed calendar data
     * @param startDate Start date filter (optional)
     * @param endDate End date filter (optional)
     * @returns Filtered events
     */
    getEventsInDateRange(parsedCalendar, startDate, endDate) {
        return parsedCalendar.events.filter(event => {
            if (startDate && event.start < startDate) {
                return false;
            }
            if (endDate && event.start > endDate) {
                return false;
            }
            return true;
        });
    }
    /**
     * Get events by genre/category (searches in summary and description)
     * @param parsedCalendar Parsed calendar data
     * @param genre Genre to search for
     * @returns Events matching the genre
     */
    getEventsByGenre(parsedCalendar, genre) {
        const lowerGenre = genre.toLowerCase();
        return parsedCalendar.events.filter(event => {
            const summary = event.summary.toLowerCase();
            const description = event.description?.toLowerCase() || '';
            return summary.includes(lowerGenre) || description.includes(lowerGenre);
        });
    }
    /**
     * Extract male/female ratio from event description if present.
     * Expects patterns like "60% male, 40% female".
     */
    extractGenderRatio(description) {
        if (!description)
            return null;
        const maleMatch = description.match(/(\d+)%\s*(?:male|men)/i);
        const femaleMatch = description.match(/(\d+)%\s*(?:female|women)/i);
        if (maleMatch && femaleMatch) {
            const male = parseInt(maleMatch[1], 10);
            const female = parseInt(femaleMatch[1], 10);
            if (!isNaN(male) && !isNaN(female)) {
                return { malePercentage: male, femalePercentage: female };
            }
        }
        return null;
    }
    /**
     * Attempt to extract a price from the event description.
     * Looks for patterns like "$20" or "Price: 15".
     */
    extractPrice(description) {
        if (!description)
            return null;
        // Match $20, 20 USD, Price: 20, Cost: $15 etc
        const priceRegex = /(\$\s?\d+(?:\.\d{1,2})?)|(?:price|cost)[:\s]*\$?(\d+(?:\.\d{1,2})?)/i;
        const match = description.match(priceRegex);
        if (match) {
            return match[1] || (match[2] ? `$${match[2]}` : null);
        }
        return null;
    }
    /**
     * Filter events by desired male/female ratio with optional tolerance.
     */
    getEventsByGenderRatio(parsedCalendar, malePercentage, femalePercentage, tolerance = 10) {
        return parsedCalendar.events.filter(event => {
            const ratio = this.extractGenderRatio(event.description);
            if (!ratio)
                return false;
            return (Math.abs(ratio.malePercentage - malePercentage) <= tolerance &&
                Math.abs(ratio.femalePercentage - femalePercentage) <= tolerance);
        });
    }
    /**
     * Determine if an event is online/virtual based on description or location.
     */
    isOnlineEvent(event) {
        const text = `${event.location || ''} ${event.description || ''}`.toLowerCase();
        return /online|virtual|zoom|webinar/.test(text);
    }
    filterOnlineEvents(parsedCalendar) {
        return parsedCalendar.events.filter(event => this.isOnlineEvent(event));
    }
    /**
     * Convert parsed calendar back to ICAL string format
     * @param parsedCalendar Parsed calendar data
     * @returns ICAL content as string
     */
    convertToICalString(parsedCalendar) {
        let icalString = 'BEGIN:VCALENDAR\n';
        icalString += 'VERSION:2.0\n';
        icalString += `PRODID:${parsedCalendar.metadata.prodId || '-//Events API//Events Calendar//EN'}\n`;
        icalString += 'CALSCALE:GREGORIAN\n';
        icalString += `METHOD:${parsedCalendar.metadata.method || 'PUBLISH'}\n`;
        if (parsedCalendar.metadata.calendarName) {
            icalString += `X-WR-CALNAME:${parsedCalendar.metadata.calendarName}\n`;
        }
        for (const event of parsedCalendar.events) {
            icalString += 'BEGIN:VEVENT\n';
            icalString += `UID:${event.uid}\n`;
            icalString += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}\n`;
            icalString += `DTSTART:${event.start.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}\n`;
            icalString += `DTEND:${event.end.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}\n`;
            icalString += `SUMMARY:${event.summary}\n`;
            if (event.description) {
                icalString += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\n`;
            }
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
                icalString += `PRICE:${event.price}\n`;
            }
            icalString += 'END:VEVENT\n';
        }
        icalString += 'END:VCALENDAR\n';
        return icalString;
    }
}
exports.ICalParserService = ICalParserService;
//# sourceMappingURL=ical-parser.service.js.map