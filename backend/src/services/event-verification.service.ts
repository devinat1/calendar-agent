import { ParsedEvent } from './ical-parser.service';
import { EventSourcesService, RealEvent } from './event-sources.service';
import * as stringSimilarity from 'string-similarity';
import { differenceInHours, isWithinInterval, parseISO } from 'date-fns';

export interface VerifiedEvent extends ParsedEvent {
  confidence: number; // 0-100
  verificationStatus: 'verified' | 'partial' | 'unverified';
  matchedSource?: {
    name: string;
    url?: string;
    source: string;
  };
  discrepancies?: string[];
}

export interface VerificationResult {
  verifiedEvents: VerifiedEvent[];
  stats: {
    totalEvents: number;
    verifiedCount: number;
    partialCount: number;
    unverifiedCount: number;
    averageConfidence: number;
  };
}

export class EventVerificationService {
  private readonly eventSources: EventSourcesService;
  private readonly similarityThreshold = 0.7; // 70% similarity for name matching
  private readonly timeWindowHours = 48; // Events within 48 hours considered same

  constructor() {
    this.eventSources = new EventSourcesService();
  }

  /**
   * Verify a list of LLM-generated events against real event sources
   */
  async verifyEvents(
    parsedEvents: ParsedEvent[],
    location: string,
    genre?: string,
    startDateTime?: string,
    endDateTime?: string
  ): Promise<VerificationResult> {
    // Fetch real events from all sources
    const realEvents = await this.eventSources.getAllEvents({
      location,
      genre,
      startDateTime,
      endDateTime,
    });

    console.log(`Found ${realEvents.length} real events to cross-reference with ${parsedEvents.length} LLM events`);

    // Verify each parsed event
    const verifiedEvents = await Promise.all(
      parsedEvents.map(event => this.verifyEvent(event, realEvents, location))
    );

    // Calculate statistics
    const stats = this.calculateStats(verifiedEvents);

    return {
      verifiedEvents,
      stats,
    };
  }

  /**
   * Verify a single event against real event data
   */
  private async verifyEvent(
    parsedEvent: ParsedEvent,
    realEvents: RealEvent[],
    location: string
  ): Promise<VerifiedEvent> {
    let bestMatch: RealEvent | null = null;
    let bestScore = 0;
    let discrepancies: string[] = [];

    // Find the best matching real event
    for (const realEvent of realEvents) {
      const score = this.calculateMatchScore(parsedEvent, realEvent);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = realEvent;
      }
    }

    // Determine verification status and confidence
    let verificationStatus: 'verified' | 'partial' | 'unverified';
    let confidence: number;

    if (bestScore >= 0.8) {
      verificationStatus = 'verified';
      confidence = Math.round(bestScore * 100);
    } else if (bestScore >= 0.5) {
      verificationStatus = 'partial';
      confidence = Math.round(bestScore * 100);
      // Find discrepancies
      if (bestMatch) {
        discrepancies = this.findDiscrepancies(parsedEvent, bestMatch);
      }
    } else {
      verificationStatus = 'unverified';
      confidence = Math.round(bestScore * 100);
      
      // Try to find event by direct search if initial matching failed
      const directMatch = await this.eventSources.findEvent(
        parsedEvent.summary,
        location,
        parsedEvent.start.toISOString()
      );
      
      if (directMatch) {
        bestMatch = directMatch;
        bestScore = this.calculateMatchScore(parsedEvent, directMatch);
        confidence = Math.round(bestScore * 100);
        if (bestScore >= 0.5) {
          verificationStatus = 'partial';
          discrepancies = this.findDiscrepancies(parsedEvent, directMatch);
        }
      }
    }

    const verifiedEvent: VerifiedEvent = {
      ...parsedEvent,
      confidence,
      verificationStatus,
      discrepancies: discrepancies.length > 0 ? discrepancies : undefined,
    };

    if (bestMatch) {
      verifiedEvent.matchedSource = {
        name: bestMatch.name,
        url: bestMatch.url,
        source: bestMatch.source,
      };
      
      // If the original event doesn't have a URL but the matched source does, use it
      if (!verifiedEvent.url && bestMatch.url) {
        verifiedEvent.url = bestMatch.url;
      }
    }

    return verifiedEvent;
  }

  /**
   * Calculate match score between parsed event and real event
   */
  private calculateMatchScore(parsedEvent: ParsedEvent, realEvent: RealEvent): number {
    const scores: number[] = [];
    const weights = {
      name: 0.4,
      time: 0.3,
      location: 0.2,
      price: 0.1,
    };

    // Name similarity
    const nameSimilarity = stringSimilarity.compareTwoStrings(
      parsedEvent.summary.toLowerCase(),
      realEvent.name.toLowerCase()
    );
    scores.push(nameSimilarity * weights.name);

    // Time similarity
    const timeDiff = Math.abs(differenceInHours(parsedEvent.start, realEvent.startDateTime));
    const timeScore = timeDiff <= this.timeWindowHours ? 
      (1 - timeDiff / this.timeWindowHours) : 0;
    scores.push(timeScore * weights.time);

    // Location similarity
    if (parsedEvent.location && realEvent.venue) {
      const locationSimilarity = stringSimilarity.compareTwoStrings(
        parsedEvent.location.toLowerCase(),
        realEvent.venue.toLowerCase()
      );
      scores.push(locationSimilarity * weights.location);
    } else {
      scores.push(0.5 * weights.location); // Partial credit if location missing
    }

    // Price similarity (if available)
    if (parsedEvent.price && realEvent.price) {
      const parsedPrice = this.extractPrice(parsedEvent.price);
      const realPrice = this.extractPrice(realEvent.price);
      
      if (parsedPrice !== null && realPrice !== null) {
        const priceDiff = Math.abs(parsedPrice - realPrice);
        const priceScore = priceDiff <= 10 ? (1 - priceDiff / 100) : 0;
        scores.push(priceScore * weights.price);
      } else {
        scores.push(0.5 * weights.price);
      }
    } else {
      scores.push(0.5 * weights.price);
    }

    return scores.reduce((sum, score) => sum + score, 0);
  }

  /**
   * Find discrepancies between parsed and real events
   */
  private findDiscrepancies(parsedEvent: ParsedEvent, realEvent: RealEvent): string[] {
    const discrepancies: string[] = [];

    // Check name
    const nameSimilarity = stringSimilarity.compareTwoStrings(
      parsedEvent.summary.toLowerCase(),
      realEvent.name.toLowerCase()
    );
    if (nameSimilarity < 0.9) {
      discrepancies.push(`Event name differs: "${parsedEvent.summary}" vs "${realEvent.name}"`);
    }

    // Check time
    const timeDiff = Math.abs(differenceInHours(parsedEvent.start, realEvent.startDateTime));
    if (timeDiff > 2) {
      discrepancies.push(
        `Time differs by ${timeDiff} hours: ${parsedEvent.start.toISOString()} vs ${realEvent.startDateTime.toISOString()}`
      );
    }

    // Check venue
    if (parsedEvent.location && realEvent.venue) {
      const venueSimilarity = stringSimilarity.compareTwoStrings(
        parsedEvent.location.toLowerCase(),
        realEvent.venue.toLowerCase()
      );
      if (venueSimilarity < 0.8) {
        discrepancies.push(`Venue differs: "${parsedEvent.location}" vs "${realEvent.venue}"`);
      }
    }

    // Check price
    if (parsedEvent.price && realEvent.price) {
      const parsedPrice = this.extractPrice(parsedEvent.price);
      const realPrice = this.extractPrice(realEvent.price);
      
      if (parsedPrice !== null && realPrice !== null && Math.abs(parsedPrice - realPrice) > 10) {
        discrepancies.push(`Price differs: ${parsedEvent.price} vs ${realEvent.price}`);
      }
    }

    return discrepancies;
  }

  /**
   * Extract numeric price from string
   */
  private extractPrice(priceStr: string): number | null {
    const match = priceStr.match(/\d+(?:\.\d{1,2})?/);
    return match ? parseFloat(match[0]) : null;
  }

  /**
   * Calculate verification statistics
   */
  private calculateStats(verifiedEvents: VerifiedEvent[]): VerificationResult['stats'] {
    const totalEvents = verifiedEvents.length;
    const verifiedCount = verifiedEvents.filter(e => e.verificationStatus === 'verified').length;
    const partialCount = verifiedEvents.filter(e => e.verificationStatus === 'partial').length;
    const unverifiedCount = verifiedEvents.filter(e => e.verificationStatus === 'unverified').length;
    const averageConfidence = totalEvents > 0 
      ? verifiedEvents.reduce((sum, e) => sum + e.confidence, 0) / totalEvents 
      : 0;

    return {
      totalEvents,
      verifiedCount,
      partialCount,
      unverifiedCount,
      averageConfidence: Math.round(averageConfidence),
    };
  }

  /**
   * Get confidence level description
   */
  static getConfidenceDescription(confidence: number): string {
    if (confidence >= 90) return 'Very High';
    if (confidence >= 75) return 'High';
    if (confidence >= 60) return 'Moderate';
    if (confidence >= 40) return 'Low';
    return 'Very Low';
  }

  /**
   * Check if an event should be trusted based on confidence
   */
  static shouldTrustEvent(event: VerifiedEvent, minConfidence = 60): boolean {
    return event.confidence >= minConfidence && event.verificationStatus !== 'unverified';
  }
} 