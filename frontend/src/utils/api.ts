import { EventSearchRequest, EventSearchResponse, ApiError } from '@/types/events';

// Use localhost for development, deployed backend for production
const API_BASE_URL = 
  process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000'
    : process.env.NEXT_PUBLIC_API_URL || 'https://perplexity-events-backend.vercel.app';

export async function searchEvents(params: EventSearchRequest): Promise<EventSearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.message || 'Failed to fetch events');
    }

    const data: EventSearchResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
} 