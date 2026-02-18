/**
 * LocationService handles persistence and statistics for traveled locations.
 */

const STORAGE_KEY = 'travel_map_data';
const TOTAL_COUNTRIES = 195;

const CONTINENTS = {
    'Africa': ['Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cameroon', 'Central African Republic', 'Chad', 'Comoros', 'Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'],
    'Asia': ['Afghanistan', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Bhutan', 'Brunei', 'Cambodia', 'China', 'Cyprus', 'Georgia', 'India', 'Indonesia', 'Iran', 'Iraq', 'Israel', 'Japan', 'Jordan', 'Kazakhstan', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Lebanon', 'Malaysia', 'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'North Korea', 'Oman', 'Pakistan', 'Palestine', 'Philippines', 'Qatar', 'Saudi Arabia', 'Singapore', 'South Korea', 'Sri Lanka', 'Syria', 'Taiwan', 'Tajikistan', 'Thailand', 'Timor-Leste', 'Turkey', 'Turkmenistan', 'United Arab Emirates', 'Uzbekistan', 'Vietnam', 'Yemen'],
    'Europe': ['Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Ukraine', 'United Kingdom', 'Vatican City'],
    'North America': ['Antigua and Barbuda', 'Bahamas', 'Barbados', 'Belize', 'Canada', 'Costa Rica', 'Cuba', 'Dominica', 'Dominican Republic', 'El Salvador', 'Grenada', 'Guatemala', 'Haiti', 'Honduras', 'Jamaica', 'Mexico', 'Nicaragua', 'Panama', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Trinidad and Tobago', 'United States'],
    'South America': ['Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Guyana', 'Paraguay', 'Peru', 'Suriname', 'Uruguay', 'Venezuela'],
    'Oceania': ['Australia', 'Fiji', 'Kiribati', 'Marshall Islands', 'Micronesia', 'Nauru', 'New Zealand', 'Palau', 'Papua New Guinea', 'Samoa', 'Solomon Islands', 'Tonga', 'Tuvalu', 'Vanuatu']
};

export const LocationService = {
    saveData: (data) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    loadData: () => {
        const data = localStorage.getItem(STORAGE_KEY);
        const defaultData = {
            visitedCities: [],
            visitedCountries: [],
            bucketListCountries: [],
            bucketListCities: [],
            settings: {
                mapStyle: 'dark', // dark, satellite, light, vintage
                globalEmoji: '📍',
                showHeatmap: false
            },
            passportStamps: []
        };
        if (!data) return defaultData;

        const parsed = JSON.parse(data);
        // Ensure all cities have IDs and dates for timeline sorting
        const visitedCities = (parsed.visitedCities || []).map(city => ({
            ...city,
            id: city.id || Math.random().toString(36).substr(2, 9),
            date: city.date || new Date().toISOString().split('T')[0],
            notes: city.notes || '',
            photo: city.photo || null
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        return {
            ...defaultData,
            ...parsed,
            visitedCities,
            settings: { ...defaultData.settings, ...(parsed.settings || {}) }
        };
    },

    calculateStats: (data) => {
        const visitedCount = data.visitedCountries.length;

        // Achievement Logic
        const achievements = [];
        const worldPercentage = (visitedCount / TOTAL_COUNTRIES) * 100;

        if (visitedCount >= 1) achievements.push({ id: 'first_step', title: 'First Step', description: 'Visited your first country!', icon: '👣' });
        if (worldPercentage >= 5) achievements.push({ id: 'explorer', title: 'Explorer', description: 'Reached 5% world coverage', icon: '🗺️' });
        if (worldPercentage >= 10) achievements.push({ id: 'nomad', title: 'Total Nomad', description: 'Reached 10% world coverage', icon: '🌎' });

        // Continent Logic
        const continentStats = Object.keys(CONTINENTS).map(cont => {
            const totalInCont = CONTINENTS[cont].length;
            const visitedInCont = data.visitedCountries.filter(c => CONTINENTS[cont].includes(c)).length;
            return {
                name: cont,
                visited: visitedInCont,
                total: totalInCont,
                percentage: ((visitedInCont / totalInCont) * 100).toFixed(1)
            };
        });

        const hasThreeContinents = continentStats.filter(s => s.visited >= 1).length >= 3;
        if (hasThreeContinents) achievements.push({ id: 'continent_hopper', title: 'Continent Hopper', description: 'Visited 3 different continents', icon: '✈️' });

        // Distance Calculation
        let totalDistance = 0;
        const sorted = [...data.visitedCities].sort((a, b) => new Date(a.date) - new Date(b.date));
        for (let i = 0; i < sorted.length - 1; i++) {
            totalDistance += LocationService.haversineDistance(
                sorted[i].lat, sorted[i].lng,
                sorted[i + 1].lat, sorted[i + 1].lng
            );
        }

        // Trip Grouping
        const trips = LocationService.groupTrips(sorted);

        return {
            visitedCount,
            totalCount: TOTAL_COUNTRIES,
            percentage: worldPercentage.toFixed(1),
            totalDistance: Math.round(totalDistance),
            achievements,
            continentStats,
            trips
        };
    },

    groupTrips: (cities) => {
        if (cities.length === 0) return [];
        const groups = [];
        let currentGroup = [cities[0]];

        for (let i = 1; i < cities.length; i++) {
            const lastCity = cities[i - 1];
            const currentCity = cities[i];
            const diffDays = (new Date(currentCity.date) - new Date(lastCity.date)) / (1000 * 60 * 60 * 24);

            if (diffDays <= 14) {
                currentGroup.push(currentCity);
            } else {
                groups.push(currentGroup);
                currentGroup = [currentCity];
            }
        }
        groups.push(currentGroup);

        return groups.map(group => {
            const countries = [...new Set(group.map(c => c.country))];
            const name = countries.length === 1
                ? `${countries[0]} Trip`
                : `${countries[0]} & More`;
            return {
                id: Math.random().toString(36).substr(2, 9),
                name,
                startDate: group[0].date,
                endDate: group[group.length - 1].date,
                cities: group,
                countries
            };
        }).reverse(); // Latest trips first
    },

    getCurvePoints: (coords1, coords2) => {
        const points = [];
        const steps = 30;

        const lat1 = coords1[0];
        const lng1 = coords1[1];
        const lat2 = coords2[0];
        const lng2 = coords2[1];

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const lat = lat1 + (lat2 - lat1) * t;
            const lng = lng1 + (lng2 - lng1) * t;

            // Add an offset for the curve
            const offset = Math.sin(t * Math.PI) * (LocationService.haversineDistance(lat1, lng1, lat2, lng2) / 2000);

            // Simple logic for curve direction: push away from center
            points.push([lat + offset, lng + offset * 0.5]);
        }
        return points;
    },

    haversineDistance: (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    fetchWeather: async (lat, lng) => {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
            const data = await res.json();
            return {
                temp: data.current_weather.temperature,
                code: data.current_weather.weathercode,
                time: new Date().toISOString()
            };
        } catch (err) {
            console.error('Weather fetch error:', err);
            return null;
        }
    },

    addCity: (city, currentData) => {
        const newCity = {
            ...city,
            notes: city.notes || '',
            date: city.date || new Date().toISOString().split('T')[0],
            photo: city.photo || null,
            customEmoji: city.customEmoji || null,
            weather: city.weather || null
        };
        const visitedCities = [...currentData.visitedCities, newCity].sort((a, b) => new Date(a.date) - new Date(b.date));

        const newData = {
            ...currentData,
            visitedCities
        };
        if (city.country && !currentData.visitedCountries.includes(city.country)) {
            newData.visitedCountries = [...currentData.visitedCountries, city.country];
            newData.bucketListCountries = currentData.bucketListCountries.filter(c => c !== city.country);
            // Also remove this city from bucket list cities if it was there
            newData.bucketListCities = currentData.bucketListCities.filter(c => c.name !== city.name);
        }
        LocationService.saveData(newData);
        return newData;
    },

    addBucketCity: (city, currentData) => {
        const bucketListCities = [...currentData.bucketListCities, { ...city, id: city.id || Math.random().toString(36).substr(2, 9) }];
        const newData = {
            ...currentData,
            bucketListCities
        };
        // Also ensure the country is in bucket list if not visited
        if (city.country && !currentData.visitedCountries.includes(city.country) && !currentData.bucketListCountries.includes(city.country)) {
            newData.bucketListCountries = [...currentData.bucketListCountries, city.country];
        }
        LocationService.saveData(newData);
        return newData;
    },

    removeBucketCity: (cityId, currentData) => {
        const newData = {
            ...currentData,
            bucketListCities: currentData.bucketListCities.filter(c => c.id !== cityId)
        };
        LocationService.saveData(newData);
        return newData;
    },

    updateCity: (cityId, updates, currentData) => {
        let visitedCities = currentData.visitedCities.map(c => c.id === cityId ? { ...c, ...updates } : c);
        if (updates.date) {
            visitedCities = visitedCities.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        const newData = {
            ...currentData,
            visitedCities
        };
        LocationService.saveData(newData);
        return newData;
    },

    toggleCountry: (countryName, currentData) => {
        const isVisited = currentData.visitedCountries.includes(countryName);
        const newData = { ...currentData };

        if (isVisited) {
            newData.visitedCountries = currentData.visitedCountries.filter(c => c !== countryName);
            // Also remove all cities in this country (both visited and bucket) to maintain sync
            newData.visitedCities = currentData.visitedCities.filter(c => c.country !== countryName);
            newData.bucketListCities = currentData.bucketListCities.filter(c => c.country !== countryName);
        } else {
            newData.visitedCountries = [...currentData.visitedCountries, countryName];
            newData.bucketListCountries = currentData.bucketListCountries.filter(c => c !== countryName);
        }

        LocationService.saveData(newData);
        return newData;
    },

    toggleBucketList: (countryName, currentData) => {
        if (currentData.visitedCountries.includes(countryName)) return currentData;

        const isBucket = currentData.bucketListCountries.includes(countryName);
        const newData = { ...currentData };

        if (isBucket) {
            newData.bucketListCountries = currentData.bucketListCountries.filter(c => c !== countryName);
            // Also remove all bucket cities in this country
            newData.bucketListCities = currentData.bucketListCities.filter(c => c.country !== countryName);
        } else {
            newData.bucketListCountries = [...currentData.bucketListCountries, countryName];
        }

        LocationService.saveData(newData);
        return newData;
    },

    updateSettings: (newSettings, currentData) => {
        const newData = {
            ...currentData,
            settings: { ...currentData.settings, ...newSettings }
        };
        LocationService.saveData(newData);
        return newData;
    },

    removeCity: (cityId, currentData) => {
        const removedCity = currentData.visitedCities.find(c => c.id === cityId);
        const visitedCities = currentData.visitedCities.filter(c => c.id !== cityId);

        const newData = {
            ...currentData,
            visitedCities
        };

        // If this was the last city in that country, remove the country from visited list
        if (removedCity) {
            const otherCitiesInCountry = visitedCities.some(c => c.country === removedCity.country);
            if (!otherCitiesInCountry) {
                newData.visitedCountries = currentData.visitedCountries.filter(c => c !== removedCity.country);
            }
        }

        LocationService.saveData(newData);
        return newData;
    },

    importData: (jsonText, currentData) => {
        try {
            const parsed = JSON.parse(jsonText);

            // 1. Check if it's a native TravelMap backup
            if (parsed.visitedCities || parsed.visitedCountries) {
                const newData = {
                    ...currentData,
                    visitedCities: [...new Map([...currentData.visitedCities, ...(parsed.visitedCities || [])].map(c => [c.id || Math.random(), c])).values()],
                    visitedCountries: [...new Set([...currentData.visitedCountries, ...(parsed.visitedCountries || [])])],
                    bucketListCountries: [...new Set([...currentData.bucketListCountries, ...(parsed.bucketListCountries || [])])],
                    settings: { ...currentData.settings, ...(parsed.settings || {}) }
                };

                // Ensure bucket list doesn't contain visited countries
                newData.bucketListCountries = newData.bucketListCountries.filter(c => !newData.visitedCountries.includes(c));

                LocationService.saveData(newData);
                return newData;
            }

            // 2. Check if it's Google History (Simplified detection)
            const locations = parsed.locations || (Array.isArray(parsed) ? parsed : null);
            if (!locations) throw new Error("Unrecognized JSON format. File must be a TravelMap backup or Google History.");

            const imported = (Array.isArray(locations) ? locations : []).map(item => ({
                id: Math.random().toString(36).substr(2, 9),
                name: item.name || item.address || 'Unknown Location',
                country: item.country || 'Unknown',
                lat: item.lat || (item.latitudeE7 ? item.latitudeE7 / 1e7 : 0),
                lng: item.lng || (item.longitudeE7 ? item.longitudeE7 / 1e7 : 0),
                date: item.date || (item.timestampMs ? new Date(parseInt(item.timestampMs)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
                notes: "Imported Data",
                photo: null
            }));

            const visitedCities = [...currentData.visitedCities, ...imported].sort((a, b) => new Date(a.date) - new Date(b.date));
            const visitedCountries = [...new Set([...currentData.visitedCountries, ...imported.map(c => c.country)])];

            const newData = {
                ...currentData,
                visitedCities,
                visitedCountries,
                bucketListCountries: currentData.bucketListCountries.filter(c => !visitedCountries.includes(c))
            };
            LocationService.saveData(newData);
            return newData;
        } catch (e) {
            console.error("Import error:", e);
            throw e;
        }
    },

    addPassportStamp: (urlOrMetadata, currentData) => {
        const stamp = typeof urlOrMetadata === 'string'
            ? { id: Date.now(), url: urlOrMetadata, date: new Date().toISOString() }
            : { id: Date.now(), ...urlOrMetadata, date: new Date().toISOString() };

        const newData = {
            ...currentData,
            passportStamps: [...(currentData.passportStamps || []), stamp]
        };
        LocationService.saveData(newData);
        return newData;
    },

    removePassportStamp: (id, currentData) => {
        const newData = {
            ...currentData,
            passportStamps: (currentData.passportStamps || []).filter(s => s.id !== id)
        };
        LocationService.saveData(newData);
        return newData;
    }
};
