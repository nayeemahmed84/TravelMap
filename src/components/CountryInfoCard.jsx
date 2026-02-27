import React, { useEffect, useState } from 'react';
import { X, Globe, Users, MapPin, Coins, Languages, Clock } from 'lucide-react';
import { CountryInfoService } from '../utils/CountryInfoService';

const CountryInfoCard = ({ countryName, onClose }) => {
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!countryName) return;
        setLoading(true);
        CountryInfoService.getCountryInfo(countryName).then(data => {
            setInfo(data);
            setLoading(false);
        });
    }, [countryName]);

    if (!countryName) return null;

    return (
        <div className="absolute top-6 left-6 z-[2000] w-80 glass rounded-3xl border-white/10 overflow-hidden shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="relative p-6 pb-4">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>

                {loading ? (
                    <div className="flex items-center gap-3 py-8">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-slate-400 font-bold">Loading...</span>
                    </div>
                ) : info ? (
                    <>
                        <div className="flex items-center gap-4 mb-4">
                            {info.flag && (
                                <img src={info.flag} alt={info.name} className="w-12 h-8 object-cover rounded-lg border border-white/10 shadow-lg" />
                            )}
                            <div>
                                <h3 className="text-lg font-black text-white">{info.name}</h3>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{info.officialName}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <InfoRow icon={MapPin} label="Capital" value={info.capital} />
                            <InfoRow icon={Users} label="Population" value={info.population?.toLocaleString()} />
                            <InfoRow icon={Globe} label="Region" value={`${info.region}${info.subregion ? ` — ${info.subregion}` : ''}`} />
                            <InfoRow icon={Languages} label="Languages" value={info.languages} />
                            <InfoRow icon={Coins} label="Currency" value={info.currencies} />
                            <InfoRow icon={Clock} label="Timezones" value={info.timezones} />
                            {info.area && (
                                <InfoRow icon={Globe} label="Area" value={`${info.area.toLocaleString()} km²`} />
                            )}
                        </div>
                    </>
                ) : (
                    <p className="text-xs text-slate-400 py-8 text-center">No data available for {countryName}</p>
                )}
            </div>
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
        <Icon className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <div className="min-w-0">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-xs font-bold text-slate-200 break-words">{value || 'N/A'}</p>
        </div>
    </div>
);

export default CountryInfoCard;
