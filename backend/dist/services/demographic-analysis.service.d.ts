export interface DemographicResult {
    malePercentage: number;
    femalePercentage: number;
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
export interface NameAnalysis {
    name: string;
    gender: 'male' | 'female' | 'unknown';
    confidence: number;
    estimatedAge?: number;
    estimatedEthnicity?: string;
}
export declare class DemographicAnalysisService {
    private genderizeApiKey;
    private agifyApiKey;
    private nationalizeApiKey;
    constructor();
    /**
     * Extract names from event description or attendee list
     */
    extractNamesFromText(text: string): string[];
    /**
     * Filter out common false positives that aren't actual names
     */
    private isCommonFalsePositive;
    /**
     * Analyze a single name for gender, age, and ethnicity
     */
    analyzeName(name: string): Promise<NameAnalysis>;
    /**
     * Local gender database for common names
     */
    private getGenderFromLocalDatabase;
    /**
     * Enhance analysis with external APIs
     */
    private enhanceWithExternalApis;
    /**
     * Analyze demographics for a list of names
     */
    analyzeNamesForDemographics(names: string[]): Promise<DemographicResult>;
    /**
     * Calculate age distribution from name analyses
     */
    private calculateAgeDistribution;
    /**
     * Calculate ethnicity distribution from name analyses
     */
    private calculateEthnicityDistribution;
    /**
     * Analyze event for demographics based on description and attendee information
     */
    analyzeEventDemographics(eventDescription: string, attendeeList?: string[]): Promise<DemographicResult>;
}
//# sourceMappingURL=demographic-analysis.service.d.ts.map