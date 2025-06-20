export interface PerplexityResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}
export interface GetEventsOptions {
    genre?: string;
    startDateTime?: string;
    endDateTime?: string;
    enableVerification?: boolean;
}
export declare class PerplexityService {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly icalParser;
    private readonly verificationService;
    private readonly urlGenerator;
    constructor();
    /**
     * Get events for a location, with optional genre and time interval.
     * @param location The location to search events for
     * @param options Optional: genre, startDateTime, endDateTime (all ISO strings)
     */
    getEventsForLocation(location: string, options?: GetEventsOptions): Promise<string>;
    private saveToFile;
    /**
     * Generate ICAL string with verification metadata
     */
    private generateVerifiedICalString;
}
//# sourceMappingURL=perplexity.service.d.ts.map