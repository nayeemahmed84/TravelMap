/**
 * LocationService handles persistence and statistics for traveled locations.
 */

const STORAGE_KEY = 'travel_map_data';
const TOTAL_COUNTRIES = 195;

export const CONTINENTS = {
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
                mapStyle: 'dark',
                globalEmoji: '📍',
                showHeatmap: false,
                theme: 'dark',
                weatherOverlay: false,
                autoDayNight: false
            },
            passportStamps: [],
            tripPlans: []
        };
        if (!data) return defaultData;

        const parsed = JSON.parse(data);
        // Ensure all cities have IDs and dates for timeline sorting
        const visitedCities = (parsed.visitedCities || []).map(city => ({
            ...city,
            id: city.id || Math.random().toString(36).substr(2, 9),
            date: city.date || new Date().toISOString().split('T')[0],
            departureDate: city.departureDate || null,
            notes: city.notes || '',
            journal: city.journal || '',
            photo: city.photo || null,
            photos: city.photos || (city.photo ? [city.photo] : []),
            tags: city.tags || [],
            budget: city.budget || { amount: 0, currency: 'USD', items: [] }
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
        const worldPercentage = (visitedCount / TOTAL_COUNTRIES) * 100;

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

        // Enhanced Achievements
        const achievements = LocationService.calculateEnhancedBadges(data, {
            visitedCount, worldPercentage, continentStats, totalDistance, trips
        });

        // Budget totals
        const totalBudget = LocationService.calculateTotalBudget(data.visitedCities);

        return {
            visitedCount,
            totalCount: TOTAL_COUNTRIES,
            percentage: worldPercentage.toFixed(1),
            totalDistance: Math.round(totalDistance),
            achievements,
            continentStats,
            trips,
            totalBudget
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

            // Aggregate expenses
            const totalCost = group.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);
            const packingAdvice = LocationService.getPackingAdvice(group);

            return {
                id: Math.random().toString(36).substr(2, 9),
                name,
                startDate: group[0].date,
                endDate: group[group.length - 1].date,
                cities: group,
                countries,
                totalCost,
                packingAdvice
            };
        }).reverse(); // Latest trips first
    },

    getPackingAdvice: (tripCities) => {
        const advice = new Set(['Passport', 'Universal Adapter', 'Comfortable Shoes']);

        tripCities.forEach(city => {
            if (city.weather) {
                if (city.weather.temp > 25) {
                    advice.add('Sunscreen');
                    advice.add('Light clothing');
                    advice.add('Sunglasses');
                }
                if (city.weather.temp < 10) {
                    advice.add('Heavy Jacket');
                    advice.add('Gloves');
                    advice.add('Scarf');
                }
                // Rain codes (WMO Weather interpretation codes)
                if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(city.weather.code)) {
                    advice.add('Umbrella');
                    advice.add('Raincoat');
                }
            }

            // Country/Region specific
            if (['Saudi Arabia', 'Iran', 'UAE', 'Oman', 'Qatar'].includes(city.country)) advice.add('Modest clothing');
            if (['Japan', 'Singapore', 'Switzerland', 'Norway', 'Iceland'].includes(city.country)) advice.add('Higher Budget');
        });

        return Array.from(advice);
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
            journal: city.journal || '',
            date: city.date || new Date().toISOString().split('T')[0],
            departureDate: city.departureDate || null,
            photo: city.photo || null,
            photos: city.photos || (city.photo ? [city.photo] : []),
            tags: city.tags || [],
            cost: city.cost || 0,
            budget: city.budget || { amount: 0, currency: 'USD', items: [] },
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
        const bucketListCities = [...currentData.bucketListCities, { ...city, id: city.id || Math.random().toString(36).substr(2, 9), targetDate: city.targetDate || null }];
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
        // Ensure cost is a number
        if (updates.cost !== undefined) updates.cost = parseFloat(updates.cost) || 0;

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

    toggleCountry: (countryName, currentData, coords = null) => {
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

            // Auto-create a journal entry if coordinates provided and no city exists
            if (coords) {
                const hasCity = currentData.visitedCities.some(c => c.country === countryName);
                if (!hasCity) {
                    const defaultCity = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: `${countryName} (General Visit)`,
                        country: countryName,
                        lat: coords.lat,
                        lng: coords.lng,
                        date: new Date().toISOString().split('T')[0],
                        notes: `Explored ${countryName}`,
                        photo: null,
                        cost: 0
                    };
                    newData.visitedCities = [...currentData.visitedCities, defaultCity].sort((a, b) => new Date(a.date) - new Date(b.date));
                }
            }
        }

        LocationService.saveData(newData);
        return newData;
    },

    toggleBucketList: (countryName, currentData, coords = null) => {
        if (currentData.visitedCountries.includes(countryName)) return currentData;

        const isBucket = currentData.bucketListCountries.includes(countryName);
        const newData = { ...currentData };

        if (isBucket) {
            newData.bucketListCountries = currentData.bucketListCountries.filter(c => c !== countryName);
            // Also remove all bucket cities in this country
            newData.bucketListCities = currentData.bucketListCities.filter(c => c.country !== countryName);
        } else {
            newData.bucketListCountries = [...currentData.bucketListCountries, countryName];

            // Auto-create a bucket city if coordinates provided and no bucket city exists
            if (coords) {
                const hasBucketCity = currentData.bucketListCities.some(c => c.country === countryName);
                if (!hasBucketCity) {
                    const defaultBucketCity = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: `${countryName} (Planned)`,
                        country: countryName,
                        lat: coords.lat,
                        lng: coords.lng,
                    };
                    newData.bucketListCities = [...currentData.bucketListCities, defaultBucketCity];
                }
            }
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
    },

    calculateWrappedStats: (data, year) => {
        const yearCities = data.visitedCities.filter(c => new Date(c.date).getFullYear() === year);
        if (yearCities.length === 0) return null;

        const countries = [...new Set(yearCities.map(c => c.country))];
        const continents = [...new Set(yearCities.map(c => {
            for (const cont in CONTINENTS) {
                if (CONTINENTS[cont].includes(c.country)) return cont;
            }
            return 'Other';
        }))];

        // Calc distance for this year
        let yearDistance = 0;
        for (let i = 0; i < yearCities.length - 1; i++) {
            yearDistance += LocationService.haversineDistance(
                yearCities[i].lat, yearCities[i].lng,
                yearCities[i + 1].lat, yearCities[i + 1].lng
            );
        }

        // Persona Logic
        const noteText = yearCities.map(c => c.notes).join(' ').toLowerCase();
        let persona = "The Sightseer";
        if (noteText.includes('food') || noteText.includes('dinner') || noteText.includes('eat')) persona = "The Global Foodie";
        else if (noteText.includes('hike') || noteText.includes('mountain') || noteText.includes('beach')) persona = "The Nature Seeker";
        else if (noteText.includes('museum') || noteText.includes('history') || noteText.includes('art')) persona = "The Culture Seeker";
        else if (yearDistance > 5000) persona = "The Grand Voyager";

        // Peak Month
        const months = yearCities.map(c => new Date(c.date).getMonth());
        const monthCounts = months.reduce((acc, m) => { acc[m] = (acc[m] || 0) + 1; return acc; }, {});
        const peakMonthIdx = Object.keys(monthCounts).reduce((a, b) => monthCounts[a] > monthCounts[b] ? a : b);
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        return {
            year,
            cityCount: yearCities.length,
            countryCount: countries.length,
            continentCount: continents.length,
            distance: Math.round(yearDistance),
            persona,
            peakMonth: monthNames[peakMonthIdx],
            topCity: yearCities[yearCities.length - 1].name
        };
    },

    // ═══════════════════════════════════════════
    // ENHANCED BADGES (15+ achievements)
    // ═══════════════════════════════════════════
    calculateEnhancedBadges: (data, computed) => {
        const { visitedCount, worldPercentage, continentStats, totalDistance, trips } = computed;
        const achievements = [];
        const cities = data.visitedCities || [];
        const countries = data.visitedCountries || [];
        const continentsVisited = continentStats.filter(s => s.visited >= 1).length;
        const allTags = cities.flatMap(c => c.tags || []);
        const photoCities = cities.filter(c => (c.photos?.length || 0) > 0 || c.photo);
        const islandNations = ['Maldives', 'Fiji', 'Bahamas', 'Jamaica', 'Cuba', 'Sri Lanka', 'Madagascar', 'Iceland', 'Singapore', 'Japan', 'Philippines', 'Indonesia', 'New Zealand', 'Australia'];
        const islandCount = countries.filter(c => islandNations.includes(c)).length;

        // Progression badges
        if (visitedCount >= 1) achievements.push({ id: 'first_step', title: 'First Step', description: 'Visited your first country!', icon: '👣', earned: true });
        if (visitedCount >= 5) achievements.push({ id: 'wanderer', title: 'Wanderer', description: 'Visited 5 countries', icon: '🚶', earned: true });
        if (worldPercentage >= 5) achievements.push({ id: 'explorer', title: 'Explorer', description: 'Reached 5% world coverage', icon: '🗺️', earned: true });
        if (worldPercentage >= 10) achievements.push({ id: 'nomad', title: 'Total Nomad', description: '10% world coverage', icon: '🌎', earned: true });
        if (worldPercentage >= 25) achievements.push({ id: 'globetrotter', title: 'Globetrotter', description: '25% world coverage!', icon: '🌐', earned: true });
        if (worldPercentage >= 50) achievements.push({ id: 'half_world', title: 'Half the World', description: '50% world coverage!', icon: '🏆', earned: true });

        // Continent badges
        if (continentsVisited >= 3) achievements.push({ id: 'continent_hopper', title: 'Continent Hopper', description: '3 continents visited', icon: '✈️', earned: true });
        if (continentsVisited >= 5) achievements.push({ id: 'world_citizen', title: 'World Citizen', description: '5 continents visited', icon: '🌍', earned: true });
        if (continentsVisited >= 6) achievements.push({ id: 'all_continents', title: 'All Continents', description: 'Visited every continent!', icon: '👑', earned: true });

        // Distance badges
        if (totalDistance >= 10000) achievements.push({ id: 'road_warrior', title: 'Road Warrior', description: '10,000+ km traveled', icon: '🛣️', earned: true });
        if (totalDistance >= 40075) achievements.push({ id: 'around_world', title: 'Around the World', description: 'Traveled Earth\'s circumference!', icon: '🚀', earned: true });

        // Special badges
        if (islandCount >= 3) achievements.push({ id: 'island_hopper', title: 'Island Hopper', description: '3+ island nations visited', icon: '🏝️', earned: true });
        if (cities.length >= 10) achievements.push({ id: 'city_collector', title: 'City Collector', description: '10+ cities logged', icon: '🏙️', earned: true });
        if (cities.length >= 50) achievements.push({ id: 'urban_legend', title: 'Urban Legend', description: '50+ cities logged', icon: '🌆', earned: true });
        if (photoCities.length >= 5) achievements.push({ id: 'photo_pro', title: 'Photo Pro', description: '5+ cities with photos', icon: '📸', earned: true });
        if (allTags.includes('Solo')) achievements.push({ id: 'solo_warrior', title: 'Solo Warrior', description: 'Completed a solo trip', icon: '🦅', earned: true });
        if (allTags.includes('Family')) achievements.push({ id: 'family_voyager', title: 'Family Voyager', description: 'Traveled with family', icon: '👨‍👩‍👧‍👦', earned: true });
        if (trips.length >= 5) achievements.push({ id: 'serial_traveler', title: 'Serial Traveler', description: '5+ trips completed', icon: '🔄', earned: true });
        if ((data.bucketListCountries?.length || 0) >= 10) achievements.push({ id: 'big_dreamer', title: 'Big Dreamer', description: '10+ bucket list countries', icon: '💫', earned: true });

        // Locked badges (show as targets)
        const locked = [];
        if (visitedCount < 5) locked.push({ id: 'wanderer_locked', title: 'Wanderer', description: 'Visit 5 countries', icon: '🚶', earned: false });
        if (worldPercentage < 25) locked.push({ id: 'globetrotter_locked', title: 'Globetrotter', description: 'Reach 25% world coverage', icon: '🌐', earned: false });
        if (continentsVisited < 5) locked.push({ id: 'world_citizen_locked', title: 'World Citizen', description: 'Visit 5 continents', icon: '🌍', earned: false });
        if (totalDistance < 40075) locked.push({ id: 'around_world_locked', title: 'Around the World', description: `Travel ${Math.round(40075 - totalDistance).toLocaleString()} more km`, icon: '🚀', earned: false });
        if (islandCount < 3) locked.push({ id: 'island_hopper_locked', title: 'Island Hopper', description: 'Visit 3+ island nations', icon: '🏝️', earned: false });

        return [...achievements, ...locked];
    },

    // ═══════════════════════════════════════════
    // BUDGET CALCULATOR
    // ═══════════════════════════════════════════
    calculateTotalBudget: (cities) => {
        const byCurrency = {};
        let totalUSD = 0;
        cities.forEach(city => {
            const amount = parseFloat(city.budget?.amount) || parseFloat(city.cost) || 0;
            const currency = city.budget?.currency || 'USD';
            byCurrency[currency] = (byCurrency[currency] || 0) + amount;
            totalUSD += amount; // Simplified, no conversion
        });
        return { totalUSD: Math.round(totalUSD), byCurrency };
    },

    // ═══════════════════════════════════════════
    // GPX PARSER
    // ═══════════════════════════════════════════
    parseGPX: (xmlText) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        const waypoints = doc.querySelectorAll('wpt');
        const trackpoints = doc.querySelectorAll('trkpt');
        const cities = [];

        const processPoint = (pt) => {
            const lat = parseFloat(pt.getAttribute('lat'));
            const lon = parseFloat(pt.getAttribute('lon'));
            const nameEl = pt.querySelector('name');
            const timeEl = pt.querySelector('time');
            return {
                id: Math.random().toString(36).substr(2, 9),
                name: nameEl?.textContent || `Point (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
                country: 'Unknown',
                lat,
                lng: lon,
                date: timeEl?.textContent ? new Date(timeEl.textContent).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                notes: 'Imported from GPX',
                photos: [],
                tags: ['Imported'],
                budget: { amount: 0, currency: 'USD', items: [] }
            };
        };

        waypoints.forEach(pt => cities.push(processPoint(pt)));
        // For tracks, sample every Nth point to avoid thousands
        const sampleRate = Math.max(1, Math.floor(trackpoints.length / 50));
        trackpoints.forEach((pt, i) => {
            if (i % sampleRate === 0) cities.push(processPoint(pt));
        });

        return cities;
    },

    // ═══════════════════════════════════════════
    // KML PARSER
    // ═══════════════════════════════════════════
    parseKML: (xmlText) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        const placemarks = doc.querySelectorAll('Placemark');
        const cities = [];

        placemarks.forEach(pm => {
            const nameEl = pm.querySelector('name');
            const coordEl = pm.querySelector('coordinates');
            if (!coordEl) return;

            const coords = coordEl.textContent.trim().split(',');
            if (coords.length < 2) return;

            cities.push({
                id: Math.random().toString(36).substr(2, 9),
                name: nameEl?.textContent || 'Unknown',
                country: 'Unknown',
                lat: parseFloat(coords[1]),
                lng: parseFloat(coords[0]),
                date: new Date().toISOString().split('T')[0],
                notes: 'Imported from KML',
                photos: [],
                tags: ['Imported'],
                budget: { amount: 0, currency: 'USD', items: [] }
            });
        });

        return cities;
    },

    // ═══════════════════════════════════════════
    // SHAREABLE HTML PROFILE
    // ═══════════════════════════════════════════
    generateShareableHTML: (data, stats) => {
        const countries = data.visitedCountries || [];
        const cities = data.visitedCities || [];
        const topCities = cities.slice(-10).reverse();

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Travel Map Profile</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; padding: 40px 20px; }
  .card { max-width: 600px; margin: 0 auto; background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.1); border-radius: 2rem; padding: 48px; backdrop-filter: blur(20px); }
  h1 { font-size: 2rem; font-weight: 900; background: linear-gradient(to right, #60a5fa, #fbbf24); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
  .subtitle { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.3em; }
  .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin: 32px 0; }
  .stat { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); border-radius: 1.5rem; padding: 24px; text-align: center; }
  .stat-num { font-size: 2rem; font-weight: 900; color: #60a5fa; }
  .stat-label { font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 4px; }
  .bar { height: 8px; background: #1e293b; border-radius: 999px; margin: 24px 0; overflow: hidden; }
  .bar-fill { height: 100%; background: linear-gradient(to right, #3b82f6, #f59e0b); border-radius: 999px; }
  .cities { margin-top: 24px; }
  .city { display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .city-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; }
  .city-name { font-weight: 700; font-size: 14px; }
  .city-country { font-size: 10px; color: #64748b; text-transform: uppercase; }
  .footer { text-align: center; margin-top: 32px; font-size: 10px; color: #334155; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; }
</style>
</head>
<body>
  <div class="card">
    <h1>TravelMap</h1>
    <p class="subtitle">World Explorer Profile</p>
    <div class="stats">
      <div class="stat"><div class="stat-num">${stats.visitedCount}</div><div class="stat-label">Countries</div></div>
      <div class="stat"><div class="stat-num">${cities.length}</div><div class="stat-label">Cities</div></div>
      <div class="stat"><div class="stat-num">${stats.totalDistance?.toLocaleString()}</div><div class="stat-label">KM Traveled</div></div>
    </div>
    <div class="bar"><div class="bar-fill" style="width:${stats.percentage}%"></div></div>
    <p class="subtitle" style="text-align:center">${stats.percentage}% of the world explored</p>
    <div class="cities">
      ${topCities.map(c => `<div class="city"><div class="city-dot"></div><div><div class="city-name">${c.name}</div><div class="city-country">${c.country}</div></div></div>`).join('')}
    </div>
    <div class="footer">Generated by TravelMap • ${new Date().toLocaleDateString()}</div>
  </div>
</body>
</html>`;
    },

    // ═══════════════════════════════════════════
    // BUCKET LIST REMINDERS
    // ═══════════════════════════════════════════
    getUpcomingReminders: (data) => {
        const now = new Date();
        const upcoming = (data.bucketListCities || [])
            .filter(c => c.targetDate && new Date(c.targetDate) > now)
            .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
        const overdue = (data.bucketListCities || [])
            .filter(c => c.targetDate && new Date(c.targetDate) <= now)
            .sort((a, b) => new Date(b.targetDate) - new Date(a.targetDate));
        return { upcoming, overdue };
    },

    // ═══════════════════════════════════════════
    // TRIP PLANS (Route Builder)
    // ═══════════════════════════════════════════
    saveTripPlan: (plan, currentData) => {
        const plans = [...(currentData.tripPlans || []), { ...plan, id: plan.id || Date.now() }];
        const newData = { ...currentData, tripPlans: plans };
        LocationService.saveData(newData);
        return newData;
    },

    removeTripPlan: (planId, currentData) => {
        const newData = { ...currentData, tripPlans: (currentData.tripPlans || []).filter(p => p.id !== planId) };
        LocationService.saveData(newData);
        return newData;
    },

    updateBucketCity: (cityId, updates, currentData) => {
        const bucketListCities = currentData.bucketListCities.map(c => c.id === cityId ? { ...c, ...updates } : c);
        const newData = { ...currentData, bucketListCities };
        LocationService.saveData(newData);
        return newData;
    }
};
