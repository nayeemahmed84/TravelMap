import React, { useState, useRef } from 'react';
import {
    Search, MapPin, Globe, Trash2, TrendingUp,
    Award, BookOpen, Compass, ChevronRight,
    Calendar, CheckCircle2, Save, X, Info,
    Camera, Image as ImageIcon, Download, Upload,
    Settings as SettingsIcon, Share2, Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import ImageService from '../utils/ImageService';

const StampImage = ({ stamp }) => {
    const [src, setSrc] = React.useState(stamp.url);

    React.useEffect(() => {
        let url;
        if (stamp.localId) {
            ImageService.getImage(stamp.localId).then(blob => {
                if (blob) {
                    url = URL.createObjectURL(blob);
                    setSrc(url);
                }
            });
        }
        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [stamp.localId, stamp.url]);

    return <img src={src} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Passport Stamp" />;
};

const Sidebar = ({ data, stats, settings, onAddCity, onAddBucketCity, onUpdateCity, onRemoveCity, onRemoveBucketCity, onToggleCountry, onToggleBucketList, onImport, onUpdateSettings, onSelectCity, onAddPassportStamp, onRemovePassportStamp, onShowWrapped }) => {
    const [activeTab, setActiveTab] = useState('stats');
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editValues, setEditValues] = useState({ notes: '', date: '', photo: '', customEmoji: '', cost: 0 });
    const [filterYear, setFilterYear] = useState('all');
    const [displayMode, setDisplayMode] = useState('list'); // list, trips

    const statsRef = useRef(null);

    const handleSearch = async (val) => {
        setSearch(val);
        if (val.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${val}&limit=5`);
            const results = await res.json();
            setSuggestions(results);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const selectLocation = (loc, type = 'visited') => {
        const cityData = {
            id: loc.place_id,
            name: loc.display_name.split(',')[0],
            country: loc.display_name.split(',').pop().trim(),
            lat: parseFloat(loc.lat),
            lng: parseFloat(loc.lon)
        };

        if (type === 'bucket') {
            onAddBucketCity(cityData);
            setActiveTab('bucket');
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#c084fc', '#ffffff']
            });
        } else {
            onAddCity(cityData);
            setActiveTab('journal');
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#fbbf24', '#3b82f6', '#ffffff']
            });
        }

        setSearch('');
        setSuggestions([]);
    };

    const startEditing = (city) => {
        setEditingId(city.id);
        setEditValues({ notes: city.notes, date: city.date, photo: city.photo || '', customEmoji: city.customEmoji || '', cost: city.cost || 0 });
    };

    const saveEdit = (id) => {
        onUpdateCity(id, editValues);
        setEditingId(null);
    };

    const exportStats = async () => {
        const element = statsRef.current;
        if (!element) return;

        try {
            const btn = document.activeElement;
            const originalBtnText = btn?.innerText;
            if (btn) btn.innerText = "Processing...";

            const canvas = await html2canvas(element, {
                backgroundColor: '#0f172a',
                scale: 2,
                useCORS: true,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.querySelector('[data-capture-area]');
                    if (clonedElement) {
                        clonedElement.style.animation = 'none';
                        clonedElement.style.borderRadius = '24px';
                        clonedElement.style.padding = '40px';
                        clonedElement.style.width = '400px';
                    }
                }
            });

            if (btn) btn.innerText = originalBtnText || "Export Stats Card";

            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `travel-passport-${Date.now()}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Export Error:", err);
        }
    };

    return (
        <div className="w-[450px] h-full glass border-r border-white/10 flex flex-col z-[1001] animate-fade-in relative">
            {/* Header */}
            <div className="p-8 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-black bg-gradient-to-br from-amber-200 via-amber-400 to-blue-500 bg-clip-text text-transparent">
                        TravelMap
                    </h1>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`p-2 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative mt-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Explore new destinations..."
                            className="w-full bg-slate-900/80 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium placeholder:text-slate-600"
                        />
                        {isSearching && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                    </div>

                    {suggestions.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-3 glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl z-50 animate-fade-in divide-y divide-white/5">
                            {suggestions.map((loc) => (
                                <div key={loc.place_id} className="flex hover:bg-white/5 transition-colors group">
                                    <div className="flex-1 px-5 py-4 min-w-0">
                                        <p className="font-bold text-slate-200 truncate">{loc.display_name}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-tighter">Choose action</p>
                                    </div>
                                    <div className="flex shrink-0">
                                        <button onClick={() => selectLocation(loc)} className="px-4 border-l border-white/5 hover:bg-blue-500/20 text-blue-400"><MapPin className="w-4 h-4" /></button>
                                        <button onClick={() => selectLocation(loc, 'bucket')} className="px-4 border-l border-white/5 hover:bg-purple-500/20 text-purple-400"><Compass className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex px-8 gap-4 border-b border-white/5 mb-6 overflow-x-auto no-scrollbar">
                {[
                    { id: 'stats', label: 'Stats', icon: TrendingUp },
                    { id: 'journal', label: 'Journal', icon: BookOpen },
                    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
                    { id: 'vault', label: 'Vault', icon: Save },
                    { id: 'bucket', label: 'Bucket', icon: Compass },
                    { id: 'achievements', label: 'Badges', icon: Award }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 shrink-0 ${activeTab === tab.id
                            ? 'text-blue-400 border-blue-500'
                            : 'text-slate-500 border-transparent hover:text-slate-300'
                            }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                {activeTab === 'stats' && (
                    <div className="space-y-8 animate-fade-in">
                        <div ref={statsRef} data-capture-area className="p-8 rounded-[2.5rem] bg-slate-950 border border-white/5 relative overflow-hidden shadow-2xl">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">Global Passport</p>
                                        <h2 className="text-2xl font-black text-white">Traveled So Far</h2>
                                    </div>
                                    <Globe className="w-8 h-8 text-slate-800" />
                                </div>

                                <section className="mb-8">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <h3 className="text-3xl font-black text-white leading-none">{stats.visitedCount}</h3>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Countries Explored</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-4xl font-black text-amber-500 italic leading-none">{stats.percentage}%</span>
                                            <p className="text-[8px] font-bold text-slate-700 uppercase mt-1">World Coverage</p>
                                        </div>
                                    </div>
                                    <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-[2px]">
                                        <div className="h-full bg-gradient-to-r from-blue-600 to-amber-500 rounded-full transition-all duration-1000" style={{ width: `${stats.percentage}%` }} />
                                    </div>
                                    <div className="mt-6 p-4 glass rounded-2xl border-white/5 flex items-center gap-3">
                                        <TrendingUp className="w-5 h-5 text-blue-400" />
                                        <div>
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Adventure Distance</p>
                                            <p className="text-sm font-black text-slate-200">{stats.totalDistance?.toLocaleString()} KM</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="grid grid-cols-2 gap-4">
                                    {stats.continentStats.map(cont => (
                                        <div key={cont.name} className="p-3 glass rounded-2xl border-white/5">
                                            <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                                                <span className="text-slate-500">{cont.name}</span>
                                                <span className="text-amber-500">{cont.percentage}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${cont.percentage}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </section>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => onShowWrapped(new Date().getFullYear())}
                                className="glass py-4 font-bold text-[10px] uppercase tracking-widest text-amber-500 hover:text-white transition-all flex items-center justify-center gap-2 rounded-2xl group border-amber-500/10 hover:border-amber-500/50"
                            >
                                <Zap className="w-4 h-4 group-hover:scale-110" /> Reveal {new Date().getFullYear()} Wrapped
                            </button>
                            <button onClick={exportStats} className="glass py-4 font-bold text-[10px] uppercase tracking-widest text-blue-400 hover:text-white transition-all flex items-center justify-center gap-2 rounded-2xl group border-blue-500/10 hover:border-blue-500/50">
                                <Share2 className="w-4 h-4 group-hover:scale-110" /> Export Stats Card
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'journal' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Advanced Filters */}
                        <div className="flex items-center gap-2 mb-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                            <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                                className="flex-1 bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 p-2 focus:outline-none"
                            >
                                <option value="all">All Years</option>
                                {[...new Set(data.visitedCities.map(c => new Date(c.date).getFullYear()))].sort((a, b) => b - a).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <div className="w-px h-4 bg-white/10" />
                            <button
                                onClick={() => setDisplayMode(displayMode === 'list' ? 'trips' : 'list')}
                                className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-white transition-all"
                            >
                                {displayMode === 'list' ? 'Trips View' : 'List View'}
                            </button>
                        </div>

                        {data.visitedCities.length === 0 ? (
                            <EmptyState icon={BookOpen} text="Empty Journal" sub="Start by adding cities you've visited." />
                        ) : (
                            displayMode === 'list' ? (
                                <div className="space-y-4">
                                    {data.visitedCities
                                        .filter(c => filterYear === 'all' || new Date(c.date).getFullYear().toString() === filterYear)
                                        .reverse()
                                        .map((city) => (
                                            <div key={city.id} className="group glass p-4 rounded-3xl border-white/5 hover:border-white/10 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                            {city.photo ? <img src={city.photo} className="w-full h-full object-cover" /> : <MapPin className="w-5 h-5 text-blue-400" />}
                                                        </div>
                                                        <div onClick={() => onSelectCity(city)} className="cursor-pointer">
                                                            <h4 className="text-sm font-black text-slate-200 flex items-center gap-2">
                                                                {city.customEmoji} {city.name} <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                                                            </h4>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{city.country}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => onRemoveCity(city.id)} className="p-2 text-slate-700 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                                </div>

                                                {editingId === city.id ? (
                                                    <div className="mt-4 space-y-3 animate-fade-in">
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <input type="date" value={editValues.date} onChange={(e) => setEditValues({ ...editValues, date: e.target.value })} className="bg-slate-800/50 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none col-span-1" />
                                                            <input type="text" placeholder="Photo URL" value={editValues.photo} onChange={(e) => setEditValues({ ...editValues, photo: e.target.value })} className="bg-slate-800/50 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none col-span-1" />
                                                            <input type="number" placeholder="Cost" value={editValues.cost} onChange={(e) => setEditValues({ ...editValues, cost: e.target.value })} className="bg-slate-800/50 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none col-span-1" />
                                                        </div>
                                                        <textarea value={editValues.notes} onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })} className="w-full bg-slate-800/50 rounded-xl p-3 text-xs text-slate-300 focus:outline-none min-h-[80px]" />
                                                        <div className="flex gap-2">
                                                            <button onClick={() => saveEdit(city.id)} className="flex-1 bg-blue-600 font-bold py-2 rounded-xl text-xs">Save</button>
                                                            <button onClick={() => setEditingId(null)} className="px-4 bg-slate-800 rounded-xl text-xs">Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mt-3">
                                                        <div className="flex justify-between text-[10px] text-slate-600 font-bold uppercase mb-1">
                                                            <span>{new Date(city.date).toLocaleDateString()}</span>
                                                            <button onClick={() => startEditing(city)} className="text-blue-500">Edit</button>
                                                        </div>
                                                        <p className="text-xs text-slate-400 line-clamp-2">{city.notes || "No notes yet..."}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {(stats.trips || []).map((trip) => (
                                        <div key={trip.id} className="relative pl-6 border-l-2 border-white/5 space-y-4">
                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500" />
                                            <div className="flex justify-between items-center mb-1">
                                                <h3 className="text-sm font-black text-slate-200">{trip.name}</h3>
                                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">${trip.totalCost?.toLocaleString()}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}</p>
                                            <div className="grid grid-cols-1 gap-2">
                                                {trip.cities.map(city => (
                                                    <div key={city.id} className="glass p-3 rounded-xl border-white/5 flex items-center gap-3">
                                                        <span className="text-lg">{city.customEmoji || '📍'}</span>
                                                        <p className="text-xs font-bold text-slate-300">{city.name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10 mt-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Info className="w-3.5 h-3.5 text-blue-400" />
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Trip Insight</p>
                                                </div>
                                                <p className="text-[10px] text-slate-400 italic leading-relaxed">
                                                    This {trip.cities.length > 2 ? 'multi-city' : 'quick'} adventure through {trip.countries.length} {trip.countries.length === 1 ? 'country' : 'countries'} covers a diverse range of local cultures. Tip: Check the local weather patterns before your next leg!
                                                </p>
                                            </div>

                                            {trip.packingAdvice && trip.packingAdvice.length > 0 && (
                                                <div className="bg-purple-500/5 rounded-2xl p-4 border border-purple-500/10 mt-2">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Compass className="w-3.5 h-3.5 text-purple-400" />
                                                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Smart Packing List</p>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(trip.packingAdvice.join(', '));
                                                                alert("Packing list copied to clipboard!");
                                                            }}
                                                            className="text-[8px] font-black text-slate-500 hover:text-white uppercase transition-colors"
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {trip.packingAdvice.map(item => (
                                                            <span key={item} className="px-2 py-1 bg-white/5 rounded-lg text-[9px] text-slate-400 font-bold border border-white/5 shadow-sm">{item}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                )}

                {activeTab === 'vault' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="glass p-6 rounded-[2rem] border-white/5 text-center">
                            <Save className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-10" />
                            <h3 className="text-sm font-black text-slate-200 mb-2">Passport Stamps</h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">Personal vault for your <br /> passport memories.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="aspect-square glass rounded-3xl border-dashed border-white/10 flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 transition-all group cursor-pointer">
                                <Upload className="w-6 h-6 text-slate-500 group-hover:text-blue-400" />
                                <span className="text-[10px] font-black text-slate-600 uppercase">Upload</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) onAddPassportStamp(file);
                                    }}
                                />
                            </label>
                            {(data.passportStamps || []).map(stamp => (
                                <div key={stamp.id} className="relative aspect-square rounded-3xl overflow-hidden group shadow-2xl">
                                    <StampImage stamp={stamp} />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => onRemovePassportStamp(stamp.id)} className="p-3 bg-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'gallery' && (
                    <div className="grid grid-cols-2 gap-3 animate-fade-in">
                        {data.visitedCities.filter(c => c.photo).map(city => (
                            <div key={city.id} className="relative aspect-square rounded-3xl overflow-hidden group border border-white/5">
                                <img src={city.photo} alt={city.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 p-3 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-[10px] font-black text-white truncate">{city.name}</p>
                                    <p className="text-[8px] text-slate-300 uppercase">{city.country}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'bucket' && (
                    <div className="space-y-4 animate-fade-in">
                        {data.bucketListCountries.map(country => (
                            <div key={country} className="flex items-center justify-between p-4 glass rounded-2xl border-purple-500/10 hover:border-purple-500/30">
                                <p className="text-sm font-bold text-slate-200">{country}</p>
                                <div className="flex gap-1">
                                    <button onClick={() => onToggleCountry(country)} className="p-2 text-slate-600 hover:text-amber-400"><CheckCircle2 className="w-5 h-5" /></button>
                                    <button onClick={() => onToggleBucketList(country)} className="p-2 text-slate-600 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            </div>
                        ))}
                        {data.bucketListCities.map(city => (
                            <div key={city.id} className="flex items-center justify-between p-4 glass rounded-2xl border-purple-500/10 hover:border-purple-500/30">
                                <div>
                                    <p className="text-sm font-bold text-slate-200">{city.name}</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-black">{city.country}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => onAddCity(city)} className="p-2 text-slate-600 hover:text-amber-400"><MapPin className="w-5 h-5" /></button>
                                    <button onClick={() => onRemoveBucketCity(city.id)} className="p-2 text-slate-600 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'achievements' && (
                    <div className="grid grid-cols-1 gap-4 animate-fade-in">
                        {stats.achievements.map(ach => (
                            <div key={ach.id} className="flex gap-4 p-5 glass rounded-[2rem] border-amber-500/10">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center text-3xl shrink-0">{ach.icon}</div>
                                <div className="flex-1 pt-1">
                                    <h4 className="text-amber-400 font-black text-sm uppercase mb-1">{ach.title}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">{ach.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-8 animate-fade-in">
                        <section>
                            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Map Appearance</h3>
                            <div className="glass p-5 rounded-3xl border-white/5 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-300 font-black uppercase">Heatmap Mode</p>
                                            <p className="text-[8px] text-slate-600 font-bold uppercase">Glow markers by density</p>
                                        </div>
                                        <button onClick={() => onUpdateSettings({ showHeatmap: !settings?.showHeatmap })} className={`w-12 h-6 rounded-full transition-all relative ${settings?.showHeatmap ? 'bg-blue-500' : 'bg-slate-800'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings?.showHeatmap ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-300 font-black uppercase">Auto Day/Night</p>
                                            <p className="text-[8px] text-slate-600 font-bold uppercase">Theme follows local time</p>
                                        </div>
                                        <button onClick={() => onUpdateSettings({ autoDayNight: !settings?.autoDayNight })} className={`w-12 h-6 rounded-full transition-all relative ${settings?.autoDayNight ? 'bg-amber-500' : 'bg-slate-800'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings?.autoDayNight ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-3 text-center">Manual Style</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['dark', 'light', 'satellite', 'terrain'].map(style => (
                                            <button key={style} onClick={() => onUpdateSettings({ mapStyle: style, autoDayNight: false })} className={`p-3 rounded-2xl border text-[10px] font-bold uppercase ${settings?.mapStyle === style ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-white/5 text-slate-500'}`}>{style}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Data Management</h3>
                            <button onClick={() => { const blob = new Blob([JSON.stringify(data)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'travelmap-backup.json'; a.click(); }} className="w-full glass p-4 rounded-2xl border-white/5 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <Download className="w-5 h-5 text-blue-400" />
                                    <span className="text-[10px] font-black text-slate-200 uppercase">Export JSON Backup</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <label className="w-full glass p-4 rounded-2xl border-white/5 flex items-center justify-between group cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <Upload className="w-5 h-5 text-amber-400" />
                                    <span className="text-[10px] font-black text-slate-200 uppercase">Import Data</span>
                                </div>
                                <input type="file" className="hidden" accept=".json" onChange={(e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => onImport(ev.target.result); reader.readAsText(file); } }} />
                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
                            </label>
                        </section>
                    </div>
                )}
            </div>

            {/* Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 blur-[120px] pointer-events-none" />
        </div>
    );
};

const EmptyState = ({ icon: Icon, text, sub }) => (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in opacity-80">
        <div className="w-16 h-16 rounded-[2rem] bg-slate-900 flex items-center justify-center text-slate-500 mb-6 border border-white/5">
            <Icon className="w-8 h-8 opacity-20" />
        </div>
        <h4 className="text-slate-400 font-bold mb-2">{text}</h4>
        <p className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">{sub}</p>
    </div>
);

export default Sidebar;
