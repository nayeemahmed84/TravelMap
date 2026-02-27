/**
 * VisaService provides simplified visa requirement information.
 * In a real app, this would fetch from a database or API like Sherpa.
 */

const VISA_DATA = {
    'US': {
        'visaFree': ['UK', 'France', 'Germany', 'Italy', 'Japan', 'Canada', 'Mexico', 'Australia', 'Singapore'],
        'visaOnArrival': ['Egypt', 'Jordan', 'Cambodia', 'Vietnam']
    },
    'UK': {
        'visaFree': ['USA', 'France', 'Germany', 'Italy', 'Japan', 'Canada', 'Mexico', 'Australia', 'Singapore'],
        'visaOnArrival': ['Egypt', 'Jordan', 'Cambodia', 'Vietnam']
    }
    // Defaulting to a wide list if unknown for demo purposes
};

export const VisaService = {
    getRequirements: (passportNationality, targetCountry) => {
        // Simplified logic for demo
        const nationalityData = VISA_DATA[passportNationality] || VISA_DATA['US'];

        if (nationalityData.visaFree.includes(targetCountry)) {
            return { type: 'Visa Free', color: 'green', icon: '✅' };
        }
        if (nationalityData.visaOnArrival.includes(targetCountry)) {
            return { type: 'Visa on Arrival', color: 'amber', icon: '🛂' };
        }
        return { type: 'Visa Required', color: 'red', icon: '📋' };
    }
};
