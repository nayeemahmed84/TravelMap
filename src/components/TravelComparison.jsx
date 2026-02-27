import React, { useState } from 'react';
import { Upload, Download, Globe, CheckCircle2, X } from 'lucide-react';
import { LocationService } from '../utils/LocationService';

const TravelComparison = ({ myData, onImportFriend }) => {
    const [friendData, setFriendData] = useState(null);
    const [comparison, setComparison] = useState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                setFriendData(parsed);
                const diff = LocationService.compareTravelData(myData, parsed);
                setComparison(diff);
                onImportFriend && onImportFriend(parsed);
            } catch (err) {
                alert('Invalid travel data file.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="glass p-6 rounded-3xl border-white/5 h-full">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Travel Comparison</h3>

            {!comparison ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-3xl">
                    <div className="p-4 bg-blue-500/20 rounded-full mb-4">
                        <Upload className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
                        Import a travel JSON from a friend to compare your world exploration!
                    </p>
                    <label className="cursor-pointer bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">
                        Import Friend's Map
                        <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
                    </label>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass p-4 rounded-2xl border-white/5 text-center">
                            <div className="text-2xl font-black text-white">{comparison.compatibility}%</div>
                            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Compatibility</div>
                        </div>
                        <div className="glass p-4 rounded-2xl border-white/5 text-center">
                            <div className="text-2xl font-black text-blue-400">{comparison.shared.length}</div>
                            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Shared Countries</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-green-500/10 p-4 rounded-2xl border border-green-500/20">
                            <h4 className="text-[9px] font-black text-green-500 uppercase mb-2 flex items-center gap-2">
                                <Globe className="w-3 h-3" /> Shared Destinations
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {comparison.shared.slice(0, 10).map(c => (
                                    <span key={c} className="px-2 py-1 bg-green-500/20 rounded text-[9px] text-green-300 font-bold">{c}</span>
                                ))}
                                {comparison.shared.length > 10 && <span className="text-[9px] text-green-500 font-bold">+{comparison.shared.length - 10} more</span>}
                            </div>
                        </div>

                        <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
                            <h4 className="text-[9px] font-black text-blue-500 uppercase mb-2 flex items-center gap-2">
                                <Globe className="w-3 h-3" /> Only Visited by You
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {comparison.uniqueToMe.slice(0, 10).map(c => (
                                    <span key={c} className="px-2 py-1 bg-blue-500/20 rounded text-[9px] text-blue-300 font-bold">{c}</span>
                                ))}
                                {comparison.uniqueToMe.length > 10 && <span className="text-[9px] text-blue-500 font-bold">+{comparison.uniqueToMe.length - 10} more</span>}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => { setComparison(null); setFriendData(null); }}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] text-slate-400 font-black uppercase tracking-widest transition-all"
                    >
                        Reset Comparison
                    </button>
                </div>
            )}
        </div>
    );
};

export default TravelComparison;
