import React, { useState } from 'react';
import { Search, MapPin, Trash2, GripVertical, Route, Plus, Save, X } from 'lucide-react';
import { LocationService } from '../utils/LocationService';

const TripPlanner = ({ onSavePlan, existingPlans = [], onRemovePlan }) => {
    const [stops, setStops] = useState([]);
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [planName, setPlanName] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (val) => {
        setSearch(val);
        if (val.length < 3) { setSuggestions([]); return; }
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${val}&limit=5`);
            setSuggestions(await res.json());
        } catch (err) { console.error(err); }
        setIsSearching(false);
    };

    const addStop = (loc) => {
        setStops([...stops, {
            id: loc.place_id,
            name: loc.display_name.split(',')[0],
            country: loc.display_name.split(',').pop().trim(),
            lat: parseFloat(loc.lat),
            lng: parseFloat(loc.lon)
        }]);
        setSearch('');
        setSuggestions([]);
    };

    const removeStop = (idx) => setStops(stops.filter((_, i) => i !== idx));

    const moveStop = (from, to) => {
        if (to < 0 || to >= stops.length) return;
        const arr = [...stops];
        const [item] = arr.splice(from, 1);
        arr.splice(to, 0, item);
        setStops(arr);
    };

    // Calculate route stats
    let totalDistance = 0;
    for (let i = 0; i < stops.length - 1; i++) {
        totalDistance += LocationService.haversineDistance(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng);
    }
    const estimatedHours = Math.round(totalDistance / 800); // ~800km/h flight

    const savePlan = () => {
        if (!planName.trim() || stops.length < 2) return;
        onSavePlan({
            name: planName,
            stops,
            totalDistance: Math.round(totalDistance),
            estimatedHours
        });
        setPlanName('');
        setStops([]);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Builder */}
            <div className="glass p-6 rounded-3xl border-white/5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <Route className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white">Plan a Trip</h3>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Add stops in order</p>
                    </div>
                </div>

                <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="Trip Name (e.g. Europe 2026)"
                    className="w-full bg-slate-800/50 rounded-xl px-4 py-3 text-sm text-slate-200 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-bold placeholder:text-slate-600"
                />

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search destinations to add..."
                        className="w-full bg-slate-800/50 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-medium placeholder:text-slate-600"
                    />
                    {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />}

                    {suggestions.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 glass rounded-xl border border-white/10 overflow-hidden shadow-2xl z-50 divide-y divide-white/5">
                            {suggestions.map(loc => (
                                <button key={loc.place_id} onClick={() => addStop(loc)} className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3">
                                    <Plus className="w-4 h-4 text-purple-400 shrink-0" />
                                    <span className="text-xs font-bold text-slate-200 truncate">{loc.display_name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stops list */}
                {stops.length > 0 && (
                    <div className="space-y-2 mb-6">
                        {stops.map((stop, idx) => (
                            <div key={`${stop.id}-${idx}`} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl group">
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => moveStop(idx, idx - 1)} className="text-slate-600 hover:text-white text-[8px]">▲</button>
                                    <button onClick={() => moveStop(idx, idx + 1)} className="text-slate-600 hover:text-white text-[8px]">▼</button>
                                </div>
                                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-[10px] font-black text-purple-400 shrink-0">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-200 truncate">{stop.name}</p>
                                    <p className="text-[9px] text-slate-500 uppercase font-bold">{stop.country}</p>
                                </div>
                                <button onClick={() => removeStop(idx)} className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats */}
                {stops.length >= 2 && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 bg-white/5 rounded-xl text-center">
                            <p className="text-lg font-black text-blue-400">{Math.round(totalDistance).toLocaleString()}</p>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">KM Total</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl text-center">
                            <p className="text-lg font-black text-amber-400">~{estimatedHours}h</p>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Flight Time</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={savePlan}
                    disabled={!planName.trim() || stops.length < 2}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                    Save Plan
                </button>
            </div>

            {/* Saved Plans */}
            {existingPlans.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Saved Plans</h3>
                    {existingPlans.map(plan => (
                        <div key={plan.id} className="glass p-4 rounded-2xl border-purple-500/10 group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="text-sm font-black text-slate-200">{plan.name}</h4>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase">{plan.stops?.length} stops • {plan.totalDistance?.toLocaleString()} km</p>
                                </div>
                                <button onClick={() => onRemovePlan(plan.id)} className="p-2 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(plan.stops || []).map((stop, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-white/5 rounded-lg text-[9px] text-slate-400 font-bold border border-white/5">
                                        {idx + 1}. {stop.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TripPlanner;
