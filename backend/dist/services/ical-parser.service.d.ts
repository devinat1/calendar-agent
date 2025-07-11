export interface ParsedEvent {
    uid: string;
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    location?: string;
    url?: string;
    organizer?: string;
    price?: string;
    malePercentage?: number;
    femalePercentage?: number;
}
export interface ParsedCalendar {
    events: ParsedEvent[];
    metadata: {
        calendarName?: string;
        prodId?: string;
        version?: string;
        method?: string;
    };
}
export declare class ICalParserService {
    /**
     * Parse ICAL content from a string
     * @param icalContent The raw ICAL content as a string
     * @returns Parsed calendar data
     */
    parseICalContent(icalContent: string): Promise<ParsedCalendar>;
    /**
     * Parse ICAL content from a file
     * @param filePath Path to the ICAL file
     * @returns Parsed calendar data
     */
    parseICalFile(filePath: string): Promise<ParsedCalendar>;
    /**
     * Validate if a string contains valid ICAL content
     * @param icalContent The ICAL content to validate
     * @returns True if valid, false otherwise
     */
    isValidICalContent(icalContent: string): boolean;
    /**
     * Extract events from parsed calendar data that fall within a date range
     * @param parsedCalendar Parsed calendar data
     * @param startDate Start date filter (optional)
     * @param endDate End date filter (optional)
     * @returns Filtered events
     */
    getEventsInDateRange(parsedCalendar: ParsedCalendar, startDate?: Date, endDate?: Date): ParsedEvent[];
    /**
     * Get events by genre/category (searches in summary and description)
     * @param parsedCalendar Parsed calendar data
     * @param genre Genre to search for
     * @returns Events matching the genre
     */
    getEventsByGenre(parsedCalendar: ParsedCalendar, genre: string): ParsedEvent[];
    /**
     * Extract male/female ratio from event description if present.
     * Expects patterns like "60% male, 40% female".
     */
    extractGenderRatio(description?: string): {
        malePercentage: number;
        femalePercentage: number;
    } | null;
    /**
     * Attempt to extract a price from the event description.
     * Looks for patterns like "$20" or "Price: 15".
     */
    extractPrice(description?: string): string | null;
    /**
     * Filter events by desired male/female ratio with optional tolerance.
     */
    getEventsByGenderRatio(parsedCalendar: ParsedCalendar, malePercentage: number, femalePercentage: number, tolerance?: number): ParsedEvent[];
    /**
     * Determine if an event is online/virtual based on description or location.
     */
    isOnlineEvent(event: ParsedEvent): boolean;
    filterOnlineEvents(parsedCalendar: ParsedCalendar): ParsedEvent[];
    /**
     * Convert parsed calendar back to ICAL string format
     * @param parsedCalendar Parsed calendar data
     * @returns ICAL content as string
     */
    convertToICalString(parsedCalendar: ParsedCalendar): string;
}
//# sourceMappingURL=ical-parser.service.d.ts.map