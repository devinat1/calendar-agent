export interface EventSearchRequest {
  location: string;
  genre: string;
  startDateTime: string;
  endDateTime: string;
  maleFemaleRatio?: string;
  onlineOnly?: boolean;
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
  malePercentage?: number;
  femalePercentage?: number;
  online?: boolean;
  rating?: number;
}

export interface EventSearchResponse {
  location: string;
  genre: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  maleFemaleRatio: string | null;
  onlineOnly: boolean;
  events: Event[];
  icalContent: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
} 