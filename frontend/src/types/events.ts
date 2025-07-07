export interface EventSearchRequest {
  location: string;
  genre: string;
  startDateTime: string;
  endDateTime: string;
  maleFemaleRatio?: string;
  onlineOnly?: boolean;
  maxPrice?: number;
  enableVerification?: boolean;
}

export interface DemographicAnalysis {
  totalCount: number;
  ageDistribution?: {
    '18-24': number;
    '25-34': number;
    '35-44': number;
    '45-54': number;
    '55+': number;
  };
  ethnicityDistribution?: {
    white: number;
    black: number;
    hispanic: number;
    asian: number;
    other: number;
  };
  confidence: number;
  analysisMethod: 'name-based' | 'ml-enhanced' | 'hybrid';
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
  // Enhanced demographic analysis
  demographicAnalysis?: DemographicAnalysis;
  // Verification fields
  confidence?: number;
  verificationStatus?: 'verified' | 'partial' | 'unverified';
  matchedSource?: {
    name: string;
    url?: string;
    source: string;
  };
  discrepancies?: string[];
}

export interface EventSearchResponse {
  location: string;
  genre: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  maleFemaleRatio: string | null;
  onlineOnly: boolean;
  maxPrice: number | null;
  events: Event[];
  icalContent: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
} 