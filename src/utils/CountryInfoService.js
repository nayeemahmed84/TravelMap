/**
 * CountryInfoService — fetches country facts from RestCountries API with caching.
 */
const cache = {};

export const CountryInfoService = {
    getCountryInfo: async (countryName) => {
        if (cache[countryName]) return cache[countryName];

        try {
            const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`);
            if (!res.ok) return null;

            const data = await res.json();
            const country = data[0];
            if (!country) return null;

            const info = {
                name: country.name.common,
                officialName: country.name.official,
                capital: country.capital?.[0] || 'N/A',
                population: country.population,
                region: country.region,
                subregion: country.subregion || '',
                languages: Object.values(country.languages || {}).join(', '),
                currencies: Object.values(country.currencies || {}).map(c => `${c.name} (${c.symbol || ''})`).join(', '),
                flag: country.flags?.svg || country.flags?.png || '',
                area: country.area,
                timezones: country.timezones?.join(', ') || '',
                borders: country.borders || [],
                latlng: country.latlng || [0, 0]
            };

            cache[countryName] = info;
            return info;
        } catch (err) {
            console.error('Country info fetch error:', err);
            return null;
        }
    }
};
