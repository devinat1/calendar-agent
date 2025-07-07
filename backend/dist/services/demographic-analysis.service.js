"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemographicAnalysisService = void 0;
const axios_1 = __importDefault(require("axios"));
class DemographicAnalysisService {
    constructor() {
        this.genderizeApiKey = process.env.GENDERIZE_API_KEY;
        this.agifyApiKey = process.env.AGIFY_API_KEY;
        this.nationalizeApiKey = process.env.NATIONALIZE_API_KEY;
    }
    /**
     * Extract names from event description or attendee list
     */
    extractNamesFromText(text) {
        const names = [];
        // Common patterns for names in event descriptions
        const patterns = [
            // "With speakers: John Smith, Jane Doe"
            /(?:speakers?|hosts?|presenters?|featuring|with):?\s*([A-Z][a-z]+ [A-Z][a-z]+(?:,\s*[A-Z][a-z]+ [A-Z][a-z]+)*)/gi,
            // "John Smith will be speaking"
            /([A-Z][a-z]+ [A-Z][a-z]+)\s+(?:will be|is|are)\s+(?:speaking|presenting|hosting)/gi,
            // "Hosted by John Smith"
            /(?:hosted by|speaker|presenter|featuring)\s+([A-Z][a-z]+ [A-Z][a-z]+)/gi,
            // General name patterns in text
            /\b([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\b/g
        ];
        for (const pattern of patterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    // Split multiple names separated by commas
                    const extractedNames = match[1].split(',').map(name => name.trim());
                    names.push(...extractedNames);
                }
            }
        }
        // Remove duplicates and filter out common false positives
        const uniqueNames = [...new Set(names)];
        const filteredNames = uniqueNames.filter(name => {
            const words = name.split(' ');
            return words.length === 2 &&
                words.every(word => word.length > 2) &&
                !this.isCommonFalsePositive(name);
        });
        return filteredNames;
    }
    /**
     * Filter out common false positives that aren't actual names
     */
    isCommonFalsePositive(name) {
        const falsePositives = [
            'New York', 'San Francisco', 'Los Angeles', 'Las Vegas', 'San Diego',
            'United States', 'North America', 'South America', 'East Coast', 'West Coast',
            'Machine Learning', 'Artificial Intelligence', 'Deep Learning', 'Data Science',
            'Software Engineering', 'Computer Science', 'Web Development', 'Mobile Development',
            'Product Management', 'Project Management', 'Business Development', 'Sales Team',
            'Marketing Team', 'Engineering Team', 'Design Team', 'Support Team',
            'Happy Hour', 'Open Bar', 'Free Food', 'Live Music', 'Guest Speaker',
            'Networking Event', 'Panel Discussion', 'Keynote Speaker', 'Workshop Session'
        ];
        return falsePositives.some(fp => name.toLowerCase().includes(fp.toLowerCase()) ||
            fp.toLowerCase().includes(name.toLowerCase()));
    }
    /**
     * Analyze a single name for gender, age, and ethnicity
     */
    async analyzeName(name) {
        const firstName = name.split(' ')[0];
        const result = {
            name,
            gender: 'unknown',
            confidence: 0
        };
        try {
            // Use local gender database first (more reliable and faster)
            const localGender = this.getGenderFromLocalDatabase(firstName);
            if (localGender) {
                result.gender = localGender.gender;
                result.confidence = localGender.confidence;
            }
            // If we have API keys, enhance with external data
            if (this.genderizeApiKey || this.agifyApiKey || this.nationalizeApiKey) {
                const enhancedData = await this.enhanceWithExternalApis(firstName);
                if (enhancedData.gender !== 'unknown' && enhancedData.gender !== undefined &&
                    enhancedData.confidence !== undefined && enhancedData.confidence > result.confidence) {
                    result.gender = enhancedData.gender;
                    result.confidence = enhancedData.confidence;
                }
                if (enhancedData.estimatedAge !== undefined) {
                    result.estimatedAge = enhancedData.estimatedAge;
                }
                if (enhancedData.estimatedEthnicity !== undefined) {
                    result.estimatedEthnicity = enhancedData.estimatedEthnicity;
                }
            }
            return result;
        }
        catch (error) {
            console.warn(`Failed to analyze name ${name}:`, error);
            return result;
        }
    }
    /**
     * Local gender database for common names
     */
    getGenderFromLocalDatabase(firstName) {
        const maleNames = new Set([
            'james', 'robert', 'john', 'michael', 'william', 'david', 'richard', 'joseph',
            'thomas', 'christopher', 'charles', 'daniel', 'matthew', 'anthony', 'mark',
            'donald', 'steven', 'paul', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian',
            'george', 'edward', 'ronald', 'timothy', 'jason', 'jeffrey', 'ryan', 'jacob',
            'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott',
            'brandon', 'benjamin', 'samuel', 'gregory', 'alexander', 'patrick', 'frank',
            'raymond', 'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'henry', 'douglas',
            'jose', 'peter', 'antonio', 'noah', 'eli', 'wayne', 'arthur', 'jordan',
            'mason', 'liam', 'ethan', 'lucas', 'logan', 'owen', 'wyatt', 'cooper',
            'connor', 'caleb', 'sebastian', 'julian', 'landon', 'cameron', 'hunter',
            'adrian', 'xavier', 'carlos', 'alex', 'marco', 'luis', 'angel', 'diego'
        ]);
        const femaleNames = new Set([
            'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan',
            'jessica', 'sarah', 'karen', 'nancy', 'lisa', 'betty', 'helen', 'sandra',
            'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly',
            'deborah', 'dorothy', 'lisa', 'nancy', 'karen', 'betty', 'helen', 'sandra',
            'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly',
            'deborah', 'dorothy', 'amy', 'angela', 'ashley', 'brenda', 'emma', 'olivia',
            'cynthia', 'marie', 'janet', 'catherine', 'frances', 'christine', 'samantha',
            'debra', 'rachel', 'carolyn', 'janet', 'maria', 'catherine', 'heather',
            'diane', 'julie', 'joyce', 'victoria', 'kelly', 'christina', 'joan',
            'evelyn', 'lauren', 'judith', 'megan', 'cheryl', 'andrea', 'hannah',
            'jacqueline', 'martha', 'gloria', 'sara', 'janice', 'julia', 'marie',
            'madison', 'mackenzie', 'emily', 'chloe', 'abigail', 'sophia', 'isabella',
            'ava', 'mia', 'charlotte', 'harper', 'aria', 'ella', 'scarlett', 'grace'
        ]);
        const lowerName = firstName.toLowerCase();
        if (maleNames.has(lowerName)) {
            return { gender: 'male', confidence: 0.95 };
        }
        else if (femaleNames.has(lowerName)) {
            return { gender: 'female', confidence: 0.95 };
        }
        return null;
    }
    /**
     * Enhance analysis with external APIs
     */
    async enhanceWithExternalApis(firstName) {
        const result = {};
        try {
            // Try Genderize API if available
            if (this.genderizeApiKey) {
                const genderResponse = await axios_1.default.get(`https://api.genderize.io?name=${firstName}&apikey=${this.genderizeApiKey}`);
                if (genderResponse.data.gender && genderResponse.data.probability > 0.6) {
                    result.gender = genderResponse.data.gender;
                    result.confidence = genderResponse.data.probability;
                }
            }
            // Try Agify API for age estimation
            if (this.agifyApiKey) {
                const ageResponse = await axios_1.default.get(`https://api.agify.io?name=${firstName}&apikey=${this.agifyApiKey}`);
                if (ageResponse.data.age) {
                    result.estimatedAge = ageResponse.data.age;
                }
            }
            // Try Nationalize API for ethnicity estimation
            if (this.nationalizeApiKey) {
                const nationalityResponse = await axios_1.default.get(`https://api.nationalize.io?name=${firstName}&apikey=${this.nationalizeApiKey}`);
                if (nationalityResponse.data.country && nationalityResponse.data.country.length > 0) {
                    result.estimatedEthnicity = nationalityResponse.data.country[0].country_id;
                }
            }
            return result;
        }
        catch (error) {
            console.warn(`Failed to enhance name analysis for ${firstName}:`, error);
            return result;
        }
    }
    /**
     * Analyze demographics for a list of names
     */
    async analyzeNamesForDemographics(names) {
        // Filter out malformed names
        const validNames = names.filter(name => {
            const words = name.split(' ');
            return words.length === 2 &&
                words.every(word => word.length > 2) &&
                !this.isCommonFalsePositive(name);
        });
        if (validNames.length === 0) {
            return {
                malePercentage: 0,
                femalePercentage: 0,
                totalCount: 0,
                confidence: 0,
                analysisMethod: 'name-based'
            };
        }
        const analyses = await Promise.all(validNames.map(name => this.analyzeName(name)));
        const maleCount = analyses.filter(a => a.gender === 'male').length;
        const femaleCount = analyses.filter(a => a.gender === 'female').length;
        const unknownCount = analyses.filter(a => a.gender === 'unknown').length;
        const totalKnown = maleCount + femaleCount;
        if (totalKnown === 0) {
            return {
                malePercentage: 50,
                femalePercentage: 50,
                totalCount: validNames.length,
                confidence: 0,
                analysisMethod: 'name-based'
            };
        }
        const malePercentage = (maleCount / totalKnown) * 100;
        const femalePercentage = (femaleCount / totalKnown) * 100;
        // Calculate confidence based on how many names we could analyze
        const analysisConfidence = totalKnown / validNames.length;
        const averageNameConfidence = analyses
            .filter(a => a.gender !== 'unknown')
            .reduce((sum, a) => sum + a.confidence, 0) / totalKnown;
        const overallConfidence = analysisConfidence * averageNameConfidence;
        // Age distribution analysis
        const ageDistribution = this.calculateAgeDistribution(analyses);
        // Ethnicity distribution analysis
        const ethnicityDistribution = this.calculateEthnicityDistribution(analyses);
        return {
            malePercentage: Math.round(malePercentage),
            femalePercentage: Math.round(femalePercentage),
            totalCount: validNames.length,
            ageDistribution,
            ethnicityDistribution,
            confidence: Math.round(overallConfidence * 100),
            analysisMethod: 'name-based'
        };
    }
    /**
     * Calculate age distribution from name analyses
     */
    calculateAgeDistribution(analyses) {
        const agesWithData = analyses.filter(a => a.estimatedAge !== undefined);
        if (agesWithData.length === 0)
            return undefined;
        const distribution = {
            '18-24': 0,
            '25-34': 0,
            '35-44': 0,
            '45-54': 0,
            '55+': 0
        };
        for (const analysis of agesWithData) {
            const age = analysis.estimatedAge;
            if (age >= 18 && age <= 24)
                distribution['18-24']++;
            else if (age >= 25 && age <= 34)
                distribution['25-34']++;
            else if (age >= 35 && age <= 44)
                distribution['35-44']++;
            else if (age >= 45 && age <= 54)
                distribution['45-54']++;
            else if (age >= 55)
                distribution['55+']++;
        }
        const total = agesWithData.length;
        return {
            '18-24': Math.round((distribution['18-24'] / total) * 100),
            '25-34': Math.round((distribution['25-34'] / total) * 100),
            '35-44': Math.round((distribution['35-44'] / total) * 100),
            '45-54': Math.round((distribution['45-54'] / total) * 100),
            '55+': Math.round((distribution['55+'] / total) * 100)
        };
    }
    /**
     * Calculate ethnicity distribution from name analyses
     */
    calculateEthnicityDistribution(analyses) {
        const ethnicityWithData = analyses.filter(a => a.estimatedEthnicity !== undefined);
        if (ethnicityWithData.length === 0)
            return undefined;
        const distribution = {
            white: 0,
            black: 0,
            hispanic: 0,
            asian: 0,
            other: 0
        };
        // Map country codes to ethnicity categories (simplified)
        const ethnicityMapping = {
            'US': 'white', 'GB': 'white', 'CA': 'white', 'AU': 'white', 'DE': 'white',
            'FR': 'white', 'IT': 'white', 'ES': 'white', 'NL': 'white', 'SE': 'white',
            'CN': 'asian', 'IN': 'asian', 'JP': 'asian', 'KR': 'asian', 'TH': 'asian',
            'VN': 'asian', 'PH': 'asian', 'ID': 'asian', 'MY': 'asian', 'SG': 'asian',
            'MX': 'hispanic', 'AR': 'hispanic', 'BR': 'hispanic', 'CO': 'hispanic',
            'PE': 'hispanic', 'CL': 'hispanic', 'VE': 'hispanic', 'EC': 'hispanic',
            'NG': 'black', 'GH': 'black', 'KE': 'black', 'ZA': 'black', 'ET': 'black'
        };
        for (const analysis of ethnicityWithData) {
            const ethnicity = ethnicityMapping[analysis.estimatedEthnicity] || 'other';
            distribution[ethnicity]++;
        }
        const total = ethnicityWithData.length;
        return {
            white: Math.round((distribution.white / total) * 100),
            black: Math.round((distribution.black / total) * 100),
            hispanic: Math.round((distribution.hispanic / total) * 100),
            asian: Math.round((distribution.asian / total) * 100),
            other: Math.round((distribution.other / total) * 100)
        };
    }
    /**
     * Analyze event for demographics based on description and attendee information
     */
    async analyzeEventDemographics(eventDescription, attendeeList) {
        let names = [];
        // Extract names from event description
        if (eventDescription) {
            names = this.extractNamesFromText(eventDescription);
        }
        // Add names from attendee list if provided
        if (attendeeList) {
            names.push(...attendeeList);
        }
        // Remove duplicates
        names = [...new Set(names)];
        console.log(`Analyzing demographics for ${names.length} names:`, names);
        return await this.analyzeNamesForDemographics(names);
    }
}
exports.DemographicAnalysisService = DemographicAnalysisService;
//# sourceMappingURL=demographic-analysis.service.js.map