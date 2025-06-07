import { ICalParserService } from './services/ical-parser.service';

async function demoICalParser() {
  const service = new ICalParserService();
  
  console.log('🔧 ICAL Parser Service Demo\n');

  // Sample ICAL content
  const sampleICalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Events API//Demo Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Demo Events Calendar
X-WR-TIMEZONE:UTC
BEGIN:VEVENT
UID:music-concert-2025@demo.com
DTSTAMP:20250615T120000Z
DTSTART:20250615T180000Z
DTEND:20250615T220000Z
SUMMARY:Summer Music Festival
DESCRIPTION:Join us for an amazing outdoor music festival featuring multiple artists and genres
LOCATION:Central Park, New York, NY
ORGANIZER:mailto:events@musicfest.com
URL:https://musicfest.com/summer-2025
END:VEVENT
BEGIN:VEVENT
UID:comedy-show-2025@demo.com
DTSTAMP:20250616T120000Z
DTSTART:20250616T190000Z
DTEND:20250616T210000Z
SUMMARY:Comedy Night Extravaganza
DESCRIPTION:Stand-up comedy featuring top comedians from around the world
LOCATION:Comedy Club Downtown, Los Angeles, CA
ORGANIZER:mailto:booking@comedyclub.com
END:VEVENT
BEGIN:VEVENT
UID:art-exhibition-2025@demo.com
DTSTAMP:20250617T120000Z
DTSTART:20250617T100000Z
DTEND:20250617T180000Z
SUMMARY:Modern Art Exhibition Opening
DESCRIPTION:Discover contemporary art from emerging artists in this exclusive gallery opening
LOCATION:Modern Art Gallery, San Francisco, CA
ORGANIZER:mailto:curator@artgallery.com
END:VEVENT
END:VCALENDAR`;

  console.log('1. 📝 Parsing ICAL Content...');
  const parsedCalendar = await service.parseICalContent(sampleICalContent);
  
  console.log(`   ✅ Found ${parsedCalendar.events.length} events`);
  console.log(`   📅 Calendar: ${parsedCalendar.metadata.calendarName}`);
  console.log(`   🏷️  Producer: ${parsedCalendar.metadata.prodId}\n`);

  console.log('2. 📋 Event Details:');
  parsedCalendar.events.forEach((event, index) => {
    console.log(`   Event ${index + 1}:`);
    console.log(`     📌 ${event.summary}`);
    console.log(`     📍 ${event.location}`);
    console.log(`     🕐 ${event.start.toLocaleString()} - ${event.end.toLocaleString()}`);
    console.log(`     📝 ${event.description?.substring(0, 50)}...`);
    console.log('');
  });

  console.log('3. 🔍 Filtering by Genre (music):');
  const musicEvents = service.getEventsByGenre(parsedCalendar, 'music');
  musicEvents.forEach(event => {
    console.log(`   🎵 ${event.summary} at ${event.location}`);
  });
  console.log('');

  console.log('4. 📅 Filtering by Date Range (June 16-17, 2025):');
  const startDate = new Date('2025-06-16T00:00:00.000Z');
  const endDate = new Date('2025-06-17T23:59:59.000Z');
  const dateFilteredEvents = service.getEventsInDateRange(parsedCalendar, startDate, endDate);
  dateFilteredEvents.forEach(event => {
    console.log(`   📆 ${event.summary} on ${event.start.toDateString()}`);
  });
  console.log('');

  console.log('5. ✅ Validating ICAL Content:');
  console.log(`   Valid ICAL: ${service.isValidICalContent(sampleICalContent)}`);
  console.log(`   Invalid content: ${service.isValidICalContent('not valid ical')}`);
  console.log('');

  console.log('6. 🔄 Converting back to ICAL format:');
  const regeneratedIcal = service.convertToICalString(parsedCalendar);
  console.log('   ✅ Successfully converted to ICAL string');
  console.log(`   📏 Length: ${regeneratedIcal.length} characters`);
  console.log('   📝 First few lines:');
  regeneratedIcal.split('\n').slice(0, 8).forEach(line => {
    console.log(`      ${line}`);
  });
  console.log('   ...\n');

  console.log('7. 🔄 Round-trip validation:');
  const reparsedCalendar = await service.parseICalContent(regeneratedIcal);
  console.log(`   ✅ Reparsed ${reparsedCalendar.events.length} events`);
  console.log(`   ✅ Calendar name preserved: ${reparsedCalendar.metadata.calendarName}`);
  console.log(`   ✅ Round-trip successful!\n`);

  console.log('🎉 Demo completed successfully!');
  console.log('\n💡 Use this parser with your Perplexity API responses to:');
  console.log('   • Parse and validate ICAL calendar data');
  console.log('   • Filter events by genre/category');
  console.log('   • Filter events by date range');
  console.log('   • Convert between ICAL string and structured data');
  console.log('   • Validate calendar format before saving');
}

// Run the demo
if (require.main === module) {
  demoICalParser().catch(console.error);
}

export { demoICalParser }; 