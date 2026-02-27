/**
 * CurrencyService handles currency conversion using Frankfurter API.
 */

const BASE_URL = 'https://api.frankfurter.app';
const CACHE_KEY = 'travel_currency_rates';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const CurrencyService = {
    getRates: async (base = 'USD') => {
        const cached = localStorage.getItem(`${CACHE_KEY}_${base}`);
        if (cached) {
            const { rates, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_EXPIRY) {
                return rates;
            }
        }

        try {
            const res = await fetch(`${BASE_URL}/latest?from=${base}`);
            const data = await res.json();
            if (data.rates) {
                localStorage.setItem(`${CACHE_KEY}_${base}`, JSON.stringify({
                    rates: data.rates,
                    timestamp: Date.now()
                }));
                return data.rates;
            }
        } catch (e) {
            console.error('Currency fetch error:', e);
        }
        return null;
    },

    convert: (amount, from, to, rates) => {
        if (from === to) return amount;
        if (!rates) return amount;

        // If rates are based on 'from'
        if (rates[to]) {
            return amount * rates[to];
        }

        // If we need to go through USD or similar, but Frankfurter handles base
        // Simplified for one-way conversion from basic rates object
        return amount;
    }
};
