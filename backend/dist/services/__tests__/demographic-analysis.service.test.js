"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const demographic_analysis_service_1 = require("../demographic-analysis.service");
describe('DemographicAnalysisService', () => {
    let service;
    beforeEach(() => {
        service = new demographic_analysis_service_1.DemographicAnalysisService();
    });
    describe('extractNamesFromText', () => {
        it('should extract names from speaker descriptions', () => {
            const text = 'Join us for a talk with speakers: John Smith and Jane Doe discussing AI trends.';
            const names = service.extractNamesFromText(text);
            expect(names).toContain('John Smith');
            expect(names).toContain('Jane Doe');
        });
        it('should extract names from host descriptions', () => {
            const text = 'This event is hosted by Sarah Johnson, featuring guest Alice Brown.';
            const names = service.extractNamesFromText(text);
            expect(names).toContain('Sarah Johnson');
            expect(names).toContain('Alice Brown');
        });
        it('should filter out false positives', () => {
            const text = 'Event in New York with Machine Learning topics and Deep Learning workshops.';
            const names = service.extractNamesFromText(text);
            expect(names).not.toContain('New York');
            expect(names).not.toContain('Machine Learning');
            expect(names).not.toContain('Deep Learning');
        });
        it('should handle empty text', () => {
            const names = service.extractNamesFromText('');
            expect(names).toEqual([]);
        });
        it('should remove duplicates', () => {
            const text = 'John Smith will speak. John Smith is our keynote speaker.';
            const names = service.extractNamesFromText(text);
            expect(names.filter(name => name === 'John Smith')).toHaveLength(1);
        });
    });
    describe('analyzeName', () => {
        it('should analyze male names correctly', async () => {
            const result = await service.analyzeName('John Smith');
            expect(result.name).toBe('John Smith');
            expect(result.gender).toBe('male');
            expect(result.confidence).toBeGreaterThan(0.8);
        });
        it('should analyze female names correctly', async () => {
            const result = await service.analyzeName('Mary Johnson');
            expect(result.name).toBe('Mary Johnson');
            expect(result.gender).toBe('female');
            expect(result.confidence).toBeGreaterThan(0.8);
        });
        it('should handle unknown names gracefully', async () => {
            const result = await service.analyzeName('Xzyqwerty Abcdefgh');
            expect(result.name).toBe('Xzyqwerty Abcdefgh');
            expect(result.gender).toBe('unknown');
            expect(result.confidence).toBeLessThan(0.5);
        });
    });
    describe('analyzeNamesForDemographics', () => {
        it('should calculate gender ratios correctly', async () => {
            const names = ['John Smith', 'Mary Johnson', 'Robert Davis'];
            const result = await service.analyzeNamesForDemographics(names);
            expect(result.totalCount).toBe(3);
            expect(result.malePercentage).toBeGreaterThan(50);
            expect(result.femalePercentage).toBeLessThan(50);
            expect(result.malePercentage + result.femalePercentage).toBe(100);
        });
        it('should handle empty name list', async () => {
            const result = await service.analyzeNamesForDemographics([]);
            expect(result.totalCount).toBe(0);
            expect(result.malePercentage).toBe(0);
            expect(result.femalePercentage).toBe(0);
            expect(result.confidence).toBe(0);
        });
        it('should provide confidence scores', async () => {
            const names = ['John Smith', 'Mary Johnson'];
            const result = await service.analyzeNamesForDemographics(names);
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.confidence).toBeLessThanOrEqual(100);
        });
        it('should set analysis method', async () => {
            const names = ['John Smith', 'Mary Johnson'];
            const result = await service.analyzeNamesForDemographics(names);
            expect(result.analysisMethod).toBe('name-based');
        });
    });
    describe('analyzeEventDemographics', () => {
        it('should analyze event descriptions with names', async () => {
            const description = 'Join speakers John Smith and Mary Johnson for a discussion on AI.';
            const result = await service.analyzeEventDemographics(description);
            expect(result.totalCount).toBeGreaterThan(0);
            expect(result.malePercentage).toBeGreaterThan(0);
            expect(result.femalePercentage).toBeGreaterThan(0);
        });
        it('should handle events with no identifiable names', async () => {
            const description = 'A general discussion about technology trends and future innovations.';
            const result = await service.analyzeEventDemographics(description);
            expect(result.totalCount).toBe(0);
            expect(result.confidence).toBe(0);
        });
        it('should include attendee list when provided', async () => {
            const description = 'Panel discussion';
            const attendees = ['Alice Brown', 'Bob Wilson'];
            const result = await service.analyzeEventDemographics(description, attendees);
            expect(result.totalCount).toBe(2);
        });
        it('should combine description and attendee names', async () => {
            const description = 'Hosted by John Smith';
            const attendees = ['Mary Johnson'];
            const result = await service.analyzeEventDemographics(description, attendees);
            expect(result.totalCount).toBe(2);
        });
    });
    describe('edge cases', () => {
        it('should handle malformed names', async () => {
            const names = ['John', 'Smith Johnson Williams Brown', 'A B'];
            const result = await service.analyzeNamesForDemographics(names);
            // Should filter out malformed names
            expect(result.totalCount).toBeLessThan(names.length);
        });
        it('should handle mixed case names', async () => {
            const text = 'speaker: john smith and MARY JOHNSON';
            const names = service.extractNamesFromText(text);
            // Should still extract names despite case differences
            expect(names.length).toBeGreaterThan(0);
        });
        it('should handle special characters in descriptions', async () => {
            const description = 'Meet Dr. John Smith, Ph.D. and Ms. Mary Johnson-Davis';
            const result = await service.analyzeEventDemographics(description);
            expect(result.totalCount).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=demographic-analysis.service.test.js.map