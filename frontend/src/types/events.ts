export interface EventSearchRequest {
  location: string;
  genre: string;
  startDateTime: string;
  endDateTime: string;
}

export interface Event {
  name: string;
  date: string;
  location: string;
  description?: string;
  venue?: string;
  time?: string;
  price?: string;
  url?: string;
}

export interface EventSearchResponse {
  location: string;
  genre: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  events: Event[];
  icalContent: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
} 