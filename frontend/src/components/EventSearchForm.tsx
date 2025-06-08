'use client';

import { useState } from 'react';
import { EventSearchRequest, EventSearchResponse, Event } from '@/types/events';
import { searchEvents } from '@/utils/api';

const EVENT_GENRES = [
  'music',
  'sports',
  'theater',
  'comedy',
  'art',
  'food',
  'nightlife',
  'outdoor',
  'fitness',
  'technology',
  'business',
  'family',
];

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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

    if (!formData.genre) {
      setError('Please select an event type');
      setIsLoading(false);
      return;
    }

    if (!formData.startDateTime || !formData.endDateTime) {
      setError('Please select both start and end dates');
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

          {/* Event Type/Genre Select */}
          <div>
            <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
              What sort of event would you like to partake in?
            </label>
            <select
              id="genre"
              name="genre"
              value={formData.genre}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
            >
              <option value="">Select an event type</option>
              {EVENT_GENRES.map(genre => (
                <option key={genre} value={genre}>
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </option>
              ))}
            </select>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>
          </div>

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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Events in {searchResults.location}
            </h2>
            
            {searchResults.events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">No events found for your search criteria.</p>
                <p className="text-sm mt-2">Try adjusting your location, event type, or date range.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {searchResults.events.map((event: Event, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {event.name}
                    </h3>
                    
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