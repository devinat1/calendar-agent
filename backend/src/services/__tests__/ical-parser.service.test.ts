import { ICalParserService, ParsedEvent, ParsedCalendar } from '../ical-parser.service';
import * as fs from 'fs';
import * as path from 'path';

describe('ICalParserService', () => {
  let service: ICalParserService;
  const testICalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Test Events
BEGIN:VEVENT
UID:test-event-1@example.com
DTSTAMP:20250615T120000Z
DTSTART:20250615T180000Z
DTEND:20250615T200000Z
SUMMARY:Music Concert
DESCRIPTION:A great music concert in the park
LOCATION:Central Park, New York
ORGANIZER:mailto:organizer@example.com
END:VEVENT
BEGIN:VEVENT
UID:test-event-2@example.com
DTSTAMP:20250616T120000Z
DTSTART:20250616T190000Z
DTEND:20250616T210000Z
SUMMARY:Comedy Show
DESCRIPTION:Stand-up comedy night
LOCATION:Comedy Club, Los Angeles
END:VEVENT
END:VCALENDAR`;

  const testICalContentInvalid = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test Calendar//EN
BEGIN:VEVENT
UID:test-event-1@example.com
SUMMARY:Test Event
END:VEVENT`;

  beforeEach(() => {
    service = new ICalParserService();
  });

  describe('parseICalContent', () => {
    it('should parse valid ICAL content correctly', async () => {
      const result = await service.parseICalContent(testICalContent);

      expect(result).toBeDefined();
      expect(result.events).toHaveLength(2);
      expect(result.metadata.calendarName).toBe('Test Events');
      expect(result.metadata.prodId).toBe('-//Test//Test Calendar//EN');
      expect(result.metadata.version).toBe('2.0');
      expect(result.metadata.method).toBe('PUBLISH');

      // Check first event
      const firstEvent = result.events[0];
      expect(firstEvent.uid).toBe('test-event-1@example.com');
      expect(firstEvent.summary).toBe('Music Concert');
      expect(firstEvent.description).toBe('A great music concert in the park');
      expect(firstEvent.location).toBe('Central Park, New York');
      expect(firstEvent.start).toEqual(new Date('2025-06-15T18:00:00.000Z'));
      expect(firstEvent.end).toEqual(new Date('2025-06-15T20:00:00.000Z'));

      // Check second event
      const secondEvent = result.events[1];
      expect(secondEvent.uid).toBe('test-event-2@example.com');
      expect(secondEvent.summary).toBe('Comedy Show');
      expect(secondEvent.description).toBe('Stand-up comedy night');
      expect(secondEvent.location).toBe('Comedy Club, Los Angeles');
    });

    it('should handle empty ICAL content gracefully', async () => {
      const emptyIcal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Empty Calendar//EN
END:VCALENDAR`;

      const result = await service.parseICalContent(emptyIcal);
      expect(result.events).toHaveLength(0);
      expect(result.metadata.prodId).toBe('-//Test//Empty Calendar//EN');
    });

    it('should return empty result for completely invalid ICAL content', async () => {
      const result = await service.parseICalContent('invalid ical content');
      expect(result.events).toHaveLength(0);
      expect(result.metadata.calendarName).toBeUndefined();
    });
  });

  describe('parseICalFile', () => {
    const testFilePath = path.join(__dirname, 'test-calendar.ics');

    beforeEach(() => {
      // Create test file
      fs.writeFileSync(testFilePath, testICalContent);
    });

    afterEach(() => {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should parse ICAL file correctly', async () => {
      const result = await service.parseICalFile(testFilePath);
      expect(result.events).toHaveLength(2);
      expect(result.metadata.calendarName).toBe('Test Events');
    });

    it('should throw error for non-existent file', async () => {
      await expect(service.parseICalFile('non-existent-file.ics')).rejects.toThrow('File not found');
    });
  });

  describe('isValidICalContent', () => {
    it('should return true for valid ICAL content', () => {
      expect(service.isValidICalContent(testICalContent)).toBe(true);
    });

    it('should return false for invalid ICAL content', () => {
      expect(service.isValidICalContent('invalid content')).toBe(false);
      expect(service.isValidICalContent('')).toBe(false);
      expect(service.isValidICalContent(testICalContentInvalid)).toBe(false);
    });

    it('should return false for content missing required components', () => {
      const incompleteIcal = 'BEGIN:VCALENDAR\nVERSION:2.0\n';
      expect(service.isValidICalContent(incompleteIcal)).toBe(false);
    });
  });

  describe('getEventsInDateRange', () => {
    let parsedCalendar: ParsedCalendar;

    beforeEach(async () => {
      parsedCalendar = await service.parseICalContent(testICalContent);
    });

    it('should return all events when no date range is provided', () => {
      const events = service.getEventsInDateRange(parsedCalendar);
      expect(events).toHaveLength(2);
    });

    it('should filter events by start date', () => {
      const startDate = new Date('2025-06-16T00:00:00.000Z');
      const events = service.getEventsInDateRange(parsedCalendar, startDate);
      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe('Comedy Show');
    });

    it('should filter events by end date', () => {
      const endDate = new Date('2025-06-15T23:59:59.000Z');
      const events = service.getEventsInDateRange(parsedCalendar, undefined, endDate);
      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe('Music Concert');
    });

    it('should filter events by date range', () => {
      const startDate = new Date('2025-06-15T00:00:00.000Z');
      const endDate = new Date('2025-06-15T23:59:59.000Z');
      const events = service.getEventsInDateRange(parsedCalendar, startDate, endDate);
      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe('Music Concert');
    });
  });

  describe('getEventsByGenre', () => {
    let parsedCalendar: ParsedCalendar;

    beforeEach(async () => {
      parsedCalendar = await service.parseICalContent(testICalContent);
    });

    it('should find events by genre in summary', () => {
      const musicEvents = service.getEventsByGenre(parsedCalendar, 'music');
      expect(musicEvents).toHaveLength(1);
      expect(musicEvents[0].summary).toBe('Music Concert');
    });

    it('should find events by genre in description', () => {
      const comedyEvents = service.getEventsByGenre(parsedCalendar, 'comedy');
      expect(comedyEvents).toHaveLength(1);
      expect(comedyEvents[0].summary).toBe('Comedy Show');
    });

    it('should be case insensitive', () => {
      const musicEvents = service.getEventsByGenre(parsedCalendar, 'MUSIC');
      expect(musicEvents).toHaveLength(1);
      expect(musicEvents[0].summary).toBe('Music Concert');
    });

    it('should return empty array for non-matching genre', () => {
      const sportEvents = service.getEventsByGenre(parsedCalendar, 'sports');
      expect(sportEvents).toHaveLength(0);
    });
  });

  describe('gender ratio and online filters', () => {
    const ratioIcal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Ratio Calendar//EN
BEGIN:VEVENT
UID:ratio-event@example.com
DTSTAMP:20250615T120000Z
DTSTART:20250615T180000Z
DTEND:20250615T200000Z
SUMMARY:Online Party
DESCRIPTION:Expected attendance 60% male, 40% female
LOCATION:Online Zoom
END:VEVENT
END:VCALENDAR`;

    it('should extract gender ratio from description', async () => {
      const parsed = await service.parseICalContent(ratioIcal);
      const ratio = service.extractGenderRatio(parsed.events[0].description);
      expect(ratio).toEqual({ malePercentage: 60, femalePercentage: 40 });
    });

    it('should filter events by gender ratio', async () => {
      const parsed = await service.parseICalContent(ratioIcal);
      const events = service.getEventsByGenderRatio(parsed, 60, 40);
      expect(events).toHaveLength(1);
    });

    it('should detect online events', async () => {
      const parsed = await service.parseICalContent(ratioIcal);
      const onlineEvents = service.filterOnlineEvents(parsed);
      expect(onlineEvents).toHaveLength(1);
    });
  });

  describe('convertToICalString', () => {
    let parsedCalendar: ParsedCalendar;

    beforeEach(async () => {
      parsedCalendar = await service.parseICalContent(testICalContent);
    });

    it('should convert parsed calendar back to ICAL string', () => {
      const icalString = service.convertToICalString(parsedCalendar);

      expect(icalString).toContain('BEGIN:VCALENDAR');
      expect(icalString).toContain('END:VCALENDAR');
      expect(icalString).toContain('VERSION:2.0');
      expect(icalString).toContain('Music Concert');
      expect(icalString).toContain('Comedy Show');
      expect(icalString).toContain('BEGIN:VEVENT');
      expect(icalString).toContain('END:VEVENT');
    });

    it('should include calendar metadata', () => {
      const icalString = service.convertToICalString(parsedCalendar);
      expect(icalString).toContain('X-WR-CALNAME:Test Events');
      expect(icalString).toContain('PRODID:-//Test//Test Calendar//EN');
      expect(icalString).toContain('METHOD:PUBLISH');
    });

    it('should handle events with all properties', () => {
      const icalString = service.convertToICalString(parsedCalendar);
      expect(icalString).toContain('SUMMARY:Music Concert');
      expect(icalString).toContain('DESCRIPTION:A great music concert in the park');
      expect(icalString).toContain('LOCATION:Central Park, New York');
      expect(icalString).toContain('UID:test-event-1@example.com');
    });

    it('should produce valid ICAL that can be parsed again', async () => {
      const icalString = service.convertToICalString(parsedCalendar);
      const reparsedCalendar = await service.parseICalContent(icalString);

      expect(reparsedCalendar.events).toHaveLength(2);
      expect(reparsedCalendar.events[0].summary).toBe('Music Concert');
      expect(reparsedCalendar.events[1].summary).toBe('Comedy Show');
    });
  });

  describe('integration tests', () => {
    it('should handle round-trip parsing and conversion', async () => {
      // Parse -> Convert -> Parse again
      const parsed1 = await service.parseICalContent(testICalContent);
      const converted = service.convertToICalString(parsed1);
      const parsed2 = await service.parseICalContent(converted);

      expect(parsed2.events).toHaveLength(parsed1.events.length);
      expect(parsed2.events[0].summary).toBe(parsed1.events[0].summary);
      expect(parsed2.events[1].summary).toBe(parsed1.events[1].summary);
    });

    it('should validate converted ICAL content', async () => {
      const parsed = await service.parseICalContent(testICalContent);
      const converted = service.convertToICalString(parsed);
      
      expect(service.isValidICalContent(converted)).toBe(true);
    });
  });
}); 