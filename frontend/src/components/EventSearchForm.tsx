'use client';

import { useState } from 'react';
import { EventSearchRequest, EventSearchResponse, Event } from '@/types/events';
import { searchEvents } from '@/utils/api';

export default function EventSearchForm() {
  const [formData, setFormData] = useState<EventSearchRequest>({
    location: '',
    genre: '',
    startDateTime: '',
    endDateTime: '',
  });
  
  const [searchResults, setSearchResults] = useState<EventSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateValidationState, setDateValidationState] = useState<{
    startValid: boolean | null;
    endValid: boolean | null;
  }>({ startValid: null, endValid: null });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
    
    // Real-time date validation
    if (name === 'startDateTime' || name === 'endDateTime') {
      validateDates(name === 'startDateTime' ? value : formData.startDateTime, 
                   name === 'endDateTime' ? value : formData.endDateTime);
    }
  };

  const validateDates = (startDateTime: string, endDateTime: string) => {
    // Reset validation state
    setDateValidationState({ startValid: null, endValid: null });
    
    // Only validate if both dates are provided
    if (!startDateTime || !endDateTime) {
      return;
    }

    const now = new Date();
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    let isValid = true;

    // Check if start date is in the past
    if (start <= now) {
      setError('The start date and time must be in the future. Please select a date and time that hasn\'t passed yet.');
      setDateValidationState({ startValid: false, endValid: null });
      isValid = false;
      return;
    }

    // Check if end date is in the past
    if (end <= now) {
      setError('The end date and time must be in the future. Please select a date and time that hasn\'t passed yet.');
      setDateValidationState({ startValid: true, endValid: false });
      isValid = false;
      return;
    }

    // Check if end is before start
    if (end <= start) {
      setError('The end date and time must be after the start date and time. Please check your date selection.');
      setDateValidationState({ startValid: true, endValid: false });
      isValid = false;
      return;
    }

    // If we get here, dates are valid
    if (isValid) {
      setDateValidationState({ startValid: true, endValid: true });
      setError(null);
    }
  };

  const getInputClassName = (baseClassName: string, isValid: boolean | null) => {
    if (isValid === null) return baseClassName;
    if (isValid) {
      return `${baseClassName} border-green-300 focus:border-green-500 focus:ring-green-500`;
    } else {
      return `${baseClassName} border-red-300 focus:border-red-500 focus:ring-red-500`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.location.trim()) {
      setError('Please enter a location');
      setIsLoading(false);
      return;
    }

    if (!formData.genre.trim()) {
      setError('Please enter an event type');
      setIsLoading(false);
      return;
    }

    if (!formData.startDateTime || !formData.endDateTime) {
      setError('Please select both start and end dates');
      setIsLoading(false);
      return;
    }

    // Validate dates
    const now = new Date();
    const start = new Date(formData.startDateTime);
    const end = new Date(formData.endDateTime);

    if (start <= now) {
      setError('The start date and time must be in the future. Please select a date and time that hasn\'t passed yet.');
      setIsLoading(false);
      return;
    }

    if (end <= now) {
      setError('The end date and time must be in the future. Please select a date and time that hasn\'t passed yet.');
      setIsLoading(false);
      return;
    }

    if (end <= start) {
      setError('The end date and time must be after the start date and time. Please check your date selection.');
      setIsLoading(false);
      return;
    }

    // Check if the date range is reasonable (not more than 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (start > oneYearFromNow || end > oneYearFromNow) {
      setError('Please select dates within the next year for better event availability.');
      setIsLoading(false);
      return;
    }

    // Check if the date range is too long (more than 6 months)
    const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000; // Approximate
    if (end.getTime() - start.getTime() > sixMonthsInMs) {
      setError('Please select a date range of 6 months or less for better results.');
      setIsLoading(false);
      return;
    }

    try {
      const results = await searchEvents(formData);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search events');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const downloadICAL = () => {
    if (!searchResults?.icalContent) {
      setError('No calendar data available for download');
      return;
    }

    try {
      // Create blob with ICAL content
      const blob = new Blob([searchResults.icalContent], { 
        type: 'text/calendar;charset=utf-8' 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const location = searchResults.location.toLowerCase().replace(/\s+/g, '-');
      const genre = searchResults.genre ? `-${searchResults.genre.toLowerCase()}` : '';
      const date = new Date().toISOString().split('T')[0];
      link.download = `events-${location}${genre}-${date}.ics`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading ICAL file:', error);
      setError('Failed to download calendar file');
    }
  };

  const downloadIndividualEvent = (event: Event, index: number) => {
    try {
      // Generate ICAL content for individual event
      const eventDate = new Date(event.date);
      const dtStart = eventDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
      
      // Calculate end time (default to 1 hour later if no specific end time)
      const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1 hour later
      const dtEnd = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
      
      const uid = `event-${Date.now()}-${index}@events-app`;
      const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
      
      // Escape ICAL text (replace newlines and special characters)
      const escapeICalText = (text: string) => {
        return text
          .replace(/\\/g, '\\\\')
          .replace(/;/g, '\\;')
          .replace(/,/g, '\\,')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '');
      };

      const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Events App//Individual Event//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${escapeICalText(event.name)}
DESCRIPTION:${escapeICalText(event.description || 'Event details')}
LOCATION:${escapeICalText(event.location || event.venue || '')}${event.url ? `
URL:${event.url}` : ''}
END:VEVENT
END:VCALENDAR`;

      // Create blob and download
      const blob = new Blob([icalContent], { 
        type: 'text/calendar;charset=utf-8' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename for individual event
      const eventName = event.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .substring(0, 50); // Limit length
      const eventDateStr = eventDate.toISOString().split('T')[0];
      link.download = `${eventName}-${eventDateStr}.ics`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading individual event:', error);
      setError('Failed to download event file');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Find Amazing Events Near You
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Input */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Where are you located?
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., New York, San Francisco, London"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
            />
          </div>

          {/* Event Type/Genre Input */}
          <div>
            <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
              What sort of event would you like to partake in?
            </label>
            <input
              type="text"
              id="genre"
              name="genre"
              value={formData.genre}
              onChange={handleInputChange}
              placeholder="e.g., music, sports, theater, comedy, art, food, outdoor, tech conferences"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDateTime" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                id="startDateTime"
                name="startDateTime"
                value={formData.startDateTime}
                onChange={handleInputChange}
                className={getInputClassName("w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors", dateValidationState.startValid)}
                required
              />
              {dateValidationState.startValid === true && (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="endDateTime" className="block text-sm font-medium text-gray-700 mb-2">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                id="endDateTime"
                name="endDateTime"
                value={formData.endDateTime}
                onChange={handleInputChange}
                className={getInputClassName("w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors", dateValidationState.endValid)}
                required
              />
              {dateValidationState.endValid === true && (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </p>
              )}
            </div>
          </div>

          {/* Helpful Tips */}
          {!formData.startDateTime || !formData.endDateTime ? (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Date Selection Tips</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Select dates in the future for upcoming events</li>
                      <li>Keep the date range under 6 months for best results</li>
                      <li>End date must be after the start date</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-md transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Searching...
              </div>
            ) : (
              'Find Events'
            )}
          </button>
        </form>

        {/* Search Results */}
        {searchResults && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Events in {searchResults.location}
              </h2>
              
              {/* Download All Button */}
              {Array.isArray(searchResults.events) && searchResults.events.length > 0 && (
                <button
                  onClick={downloadICAL}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2 outline-none"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download All (.ics)
                </button>
              )}
            </div>
            
            {!Array.isArray(searchResults.events) || searchResults.events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">No events found for your search criteria.</p>
                <p className="text-sm mt-2">Try adjusting your location, event type, or date range.</p>
                {!Array.isArray(searchResults.events) && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                    <p className="text-sm">
                      <strong>Debug info:</strong> Events data is not in expected format. 
                      {typeof searchResults.events === 'string' ? 'Received string instead of array.' : `Received ${typeof searchResults.events}.`}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-6">
                {searchResults.events.map((event: Event, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-800 flex-1">
                        {event.name}
                      </h3>
                      
                      {/* Individual Event Download Button */}
                      <button
                        onClick={() => downloadIndividualEvent(event, index)}
                        className="ml-4 inline-flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-md transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none"
                        title="Download this event"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      {event.date && (
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(event.date)}
                        </div>
                      )}
                      {event.time && (
                        <div>
                          <span className="font-medium">Time:</span> {event.time}
                        </div>
                      )}
                      {event.venue && (
                        <div>
                          <span className="font-medium">Venue:</span> {event.venue}
                        </div>
                      )}
                      {event.location && (
                        <div>
                          <span className="font-medium">Location:</span> {event.location}
                        </div>
                      )}
                      {event.price && (
                        <div>
                          <span className="font-medium">Price:</span> {event.price}
                        </div>
                      )}
                    </div>
                    
                    {event.description && (
                      <div className="mt-4">
                        <span className="font-medium text-gray-700">Description:</span>
                        <p className="text-gray-600 mt-1">{event.description}</p>
                      </div>
                    )}
                    
                    {event.url && (
                      <div className="mt-4">
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View Event Details
                          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 