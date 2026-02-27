const COUNTRY_MAP = {
    'Afghanistan': 'af', 'Albania': 'al', 'Algeria': 'dz', 'Andorra': 'ad', 'Angola': 'ao', 'Antigua and Barbuda': 'ag',
    'Argentina': 'ar', 'Armenia': 'am', 'Australia': 'au', 'Austria': 'at', 'Azerbaijan': 'az', 'Bahamas': 'bs',
    'Bahrain': 'bh', 'Bangladesh': 'bd', 'Barbados': 'bb', 'Belarus': 'by', 'Belgium': 'be', 'Belize': 'bz',
    'Benin': 'bj', 'Bhutan': 'bt', 'Bolivia': 'bo', 'Bosnia and Herzegovina': 'ba', 'Botswana': 'bw', 'Brazil': 'br',
    'Brunei': 'bn', 'Bulgaria': 'bg', 'Burkina Faso': 'bf', 'Burundi': 'bi', 'Cabo Verde': 'cv', 'Cambodia': 'kh',
    'Cameroon': 'cm', 'Canada': 'ca', 'Central African Republic': 'cf', 'Chad': 'td', 'Chile': 'cl', 'China': 'cn',
    'Colombia': 'co', 'Comoros': 'km', 'Congo': 'cg', 'Costa Rica': 'cr', 'Croatia': 'hr', 'Cuba': 'cu',
    'Cyprus': 'cy', 'Czech Republic': 'cz', 'Denmark': 'dk', 'Djibouti': 'dj', 'Dominica': 'dm', 'Dominican Republic': 'do',
    'Ecuador': 'ec', 'Egypt': 'eg', 'El Salvador': 'sv', 'Equatorial Guinea': 'gq', 'Eritrea': 'er', 'Estonia': 'ee',
    'Eswatini': 'sz', 'Ethiopia': 'et', 'Fiji': 'fj', 'Finland': 'fi', 'France': 'fr', 'Gabon': 'ga',
    'Gambia': 'gm', 'Georgia': 'ge', 'Germany': 'de', 'Ghana': 'gh', 'Greece': 'gr', 'Grenada': 'gd',
    'Guatemala': 'gt', 'Guinea': 'gn', 'Guinea-Bissau': 'gw', 'Guyana': 'gy', 'Haiti': 'ht', 'Honduras': 'hn',
    'Hungary': 'hu', 'Iceland': 'is', 'India': 'in', 'Indonesia': 'id', 'Iran': 'ir', 'Iraq': 'iq',
    'Ireland': 'ie', 'Israel': 'il', 'Italy': 'it', 'Ivory Coast': 'ci', 'Jamaica': 'jm', 'Japan': 'jp',
    'Jordan': 'jo', 'Kazakhstan': 'kz', 'Kenya': 'ke', 'Kiribati': 'ki', 'Kuwait': 'kw', 'Kyrgyzstan': 'kg',
    'Laos': 'la', 'Latvia': 'lv', 'Lebanon': 'lb', 'Lesotho': 'ls', 'Liberia': 'lr', 'Libya': 'ly',
    'Liechtenstein': 'li', 'Lithuania': 'lt', 'Luxembourg': 'lu', 'Madagascar': 'mg', 'Malawi': 'mw', 'Malaysia': 'my',
    'Maldives': 'mv', 'Mali': 'ml', 'Malta': 'mt', 'Marshall Islands': 'mh', 'Mauritania': 'mr', 'Mauritius': 'mu',
    'Mexico': 'mx', 'Micronesia': 'fm', 'Moldova': 'md', 'Monaco': 'mc', 'Mongolia': 'mn', 'Montenegro': 'me',
    'Morocco': 'ma', 'Mozambique': 'mz', 'Myanmar': 'mm', 'Namibia': 'na', 'Nauru': 'nr', 'Nepal': 'np',
    'Netherlands': 'nl', 'New Zealand': 'nz', 'Nicaragua': 'ni', 'Niger': 'ne', 'Nigeria': 'ng', 'North Korea': 'kp',
    'North Macedonia': 'mk', 'Norway': 'no', 'Oman': 'om', 'Pakistan': 'pk', 'Palau': 'pw', 'Palestine': 'ps',
    'Panama': 'pa', 'Papua New Guinea': 'pg', 'Paraguay': 'py', 'Peru': 'pe', 'Philippines': 'ph', 'Poland': 'pl',
    'Portugal': 'pt', 'Qatar': 'qa', 'Romania': 'ro', 'Russia': 'ru', 'Rwanda': 'rw', 'Saint Kitts and Nevis': 'kn',
    'Saint Lucia': 'lc', 'Saint Vincent and the Grenadines': 'vc', 'Samoa': 'ws', 'San Marino': 'sm', 'Sao Tome and Principe': 'st',
    'Saudi Arabia': 'sa', 'Senegal': 'sn', 'Serbia': 'rs', 'Seychelles': 'sc', 'Sierra Leone': 'sl', 'Singapore': 'sg',
    'Slovakia': 'sk', 'Slovenia': 'si', 'Solomon Islands': 'sb', 'Somalia': 'so', 'South Africa': 'za', 'South Korea': 'kr',
    'South Sudan': 'ss', 'Sudan': 'sd', 'Suriname': 'sr', 'Sweden': 'se', 'Switzerland': 'ch', 'Syria': 'sy',
    'Taiwan': 'tw', 'Tajikistan': 'tj', 'Tanzania': 'tz', 'Thailand': 'th', 'Timor-Leste': 'tl', 'Togo': 'tg',
    'Tonga': 'to', 'Trinidad and Tobago': 'tt', 'Tunisia': 'tn', 'Turkey': 'tr', 'Turkmenistan': 'tm', 'Tuvalu': 'tv',
    'Uganda': 'ug', 'Ukraine': 'ua', 'United Arab Emirates': 'ae', 'United Kingdom': 'gb', 'United States': 'us',
    'Uruguay': 'uy', 'Uzbekistan': 'uz', 'Vanuatu': 'vu', 'Vatican City': 'va', 'Venezuela': 've', 'Vietnam': 'vn',
    'Yemen': 'ye', 'Zambia': 'zm', 'Zimbabwe': 'zw'
};

const COUNTRY_CURRENCY_MAP = {
    'United States': 'USD', 'United Kingdom': 'GBP', 'Germany': 'EUR', 'France': 'EUR', 'Italy': 'EUR', 'Spain': 'EUR',
    'Netherlands': 'EUR', 'Belgium': 'EUR', 'Portugal': 'EUR', 'Greece': 'EUR', 'Austria': 'EUR', 'Ireland': 'EUR',
    'India': 'INR', 'Japan': 'JPY', 'Canada': 'CAD', 'Australia': 'AUD', 'Bangladesh': 'BDT', 'Pakistan': 'PKR',
    'Turkey': 'TRY', 'China': 'CNY', 'Brazil': 'BRL', 'Russia': 'RUB', 'Mexico': 'MXN', 'South Korea': 'KRW',
    'Singapore': 'SGD', 'Switzerland': 'CHF', 'Norway': 'NOK', 'Sweden': 'SEK', 'Denmark': 'DKK', 'Poland': 'PLN',
    'New Zealand': 'NZD', 'South Africa': 'ZAR', 'United Arab Emirates': 'AED', 'Saudi Arabia': 'SAR', 'Malaysia': 'MYR',
    'Thailand': 'THB', 'Indonesia': 'IDR', 'Vietnam': 'VND', 'Philippines': 'PHP', 'Israel': 'ILS', 'Egypt': 'EGP'
};

const CODE_CURRENCY_MAP = {
    'us': 'USD', 'gb': 'GBP', 'ca': 'CAD', 'au': 'AUD', 'nz': 'NZD', 'in': 'INR', 'jp': 'JPY', 'cn': 'CNY',
    'de': 'EUR', 'fr': 'EUR', 'it': 'EUR', 'es': 'EUR', 'nl': 'EUR', 'be': 'EUR', 'at': 'EUR', 'ie': 'EUR',
    'no': 'NOK', 'se': 'SEK', 'dk': 'DKK', 'ch': 'CHF', 'pl': 'PLN', 'tr': 'TRY', 'br': 'BRL', 'ru': 'RUB',
    'mx': 'MXN', 'kr': 'KRW', 'sg': 'SGD', 'za': 'ZAR', 'ae': 'AED', 'sa': 'SAR', 'my': 'MYR', 'th': 'THB',
    'id': 'IDR', 'vn': 'VND', 'ph': 'PHP', 'il': 'ILS', 'eg': 'EGP', 'bd': 'BDT', 'pk': 'PKR'
};

export const CountryService = {
    getFlagUrl: (countryName) => {
        const code = COUNTRY_MAP[countryName];
        if (!code) return null;
        return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
    },
    getCountryCode: (countryName) => {
        return COUNTRY_MAP[countryName] || null;
    },
    getCurrency: (countryName, countryCode) => {
        if (countryCode && CODE_CURRENCY_MAP[countryCode.toLowerCase()]) {
            return CODE_CURRENCY_MAP[countryCode.toLowerCase()];
        }
        return COUNTRY_CURRENCY_MAP[countryName] || 'USD';
    },
    getAllCountries: () => {
        return Object.keys(COUNTRY_MAP).sort().map(name => ({
            name,
            code: COUNTRY_MAP[name]
        }));
    }
};
