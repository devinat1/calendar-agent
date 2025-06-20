import React from 'react';
import { Event } from '../types/events';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const getVerificationBadge = () => {
    if (!event.verificationStatus) return null;

    const badges = {
      verified: {
        text: 'Verified',
        className: 'bg-green-100 text-green-800',
        icon: '✓'
      },
      partial: {
        text: 'Partially Verified',
        className: 'bg-yellow-100 text-yellow-800',
        icon: '⚠'
      },
      unverified: {
        text: 'Unverified',
        className: 'bg-red-100 text-red-800',
        icon: '✗'
      }
    };

    const badge = badges[event.verificationStatus];
    
    return (
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
          <span className="mr-1">{badge.icon}</span>
          {badge.text}
        </span>
        {event.confidence !== undefined && (
          <span className="text-xs text-gray-500">
            {event.confidence}% confidence
          </span>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | undefined) => {
    return timeString || 'Time TBD';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {getVerificationBadge()}
      
      <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(event.date)}
        </div>
        
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatTime(event.time)}
        </div>
        
        {event.venue && (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.venue}
          </div>
        )}
        
        {event.price && (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {event.price}
          </div>
        )}
        
        {event.online && (
          <div className="flex items-center text-blue-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Online Event
          </div>
        )}
        
        {event.rating && (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {event.rating.toFixed(1)} / 5.0
          </div>
        )}
      </div>
      
      {event.description && (
        <p className="mt-4 text-sm text-gray-700 line-clamp-3">{event.description}</p>
      )}
      
      {event.matchedSource && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Source: {event.matchedSource.source}
            {event.verificationStatus === 'verified' && (
              <span className="ml-2 text-green-600">• Verified match</span>
            )}
            {event.verificationStatus === 'partial' && (
              <span className="ml-2 text-yellow-600">• Partial match</span>
            )}
          </p>
        </div>
      )}
      
      {event.discrepancies && event.discrepancies.length > 0 && (
        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
          <p className="font-medium text-yellow-800 mb-1">Verification Notes:</p>
          <ul className="list-disc list-inside text-yellow-700">
            {event.discrepancies.map((discrepancy, index) => (
              <li key={index}>{discrepancy}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-4 flex flex-wrap gap-2">
        {event.url && (
          <a 
            href={event.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            View Event Details
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
        
        {event.matchedSource?.url && event.matchedSource.url !== event.url && (
          <a 
            href={event.matchedSource.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
          >
            {event.matchedSource.source === 'eventbrite' && 'View on Eventbrite'}
            {event.matchedSource.source === 'ticketmaster' && 'View on Ticketmaster'}
            {event.matchedSource.source === 'meetup' && 'View on Meetup'}
            {event.matchedSource.source === 'google' && 'View Location'}
            {!['eventbrite', 'ticketmaster', 'meetup', 'google'].includes(event.matchedSource.source) && `View on ${event.matchedSource.source}`}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
};

export default EventCard; 