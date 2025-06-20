import { ParsedEvent } from './ical-parser.service';
export interface VerifiedEvent extends ParsedEvent {
    confidence: number;
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
export declare class EventVerificationService {
    private readonly eventSources;
    private readonly similarityThreshold;
    private readonly timeWindowHours;
    constructor();
    /**
     * Verify a list of LLM-generated events against real event sources
     */
    verifyEvents(parsedEvents: ParsedEvent[], location: string, genre?: string, startDateTime?: string, endDateTime?: string): Promise<VerificationResult>;
    /**
     * Verify a single event against real event data
     */
    private verifyEvent;
    /**
     * Calculate match score between parsed event and real event
     */
    private calculateMatchScore;
    /**
     * Find discrepancies between parsed and real events
     */
    private findDiscrepancies;
    /**
     * Extract numeric price from string
     */
    private extractPrice;
    /**
     * Calculate verification statistics
     */
    private calculateStats;
    /**
     * Get confidence level description
     */
    static getConfidenceDescription(confidence: number): string;
    /**
     * Check if an event should be trusted based on confidence
     */
    static shouldTrustEvent(event: VerifiedEvent, minConfidence?: number): boolean;
}
//# sourceMappingURL=event-verification.service.d.ts.map