import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FastForward, SkipBack, X } from 'lucide-react';

const TimeLapseControls = ({ cities = [], currentDate, onChange, onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1000); // ms per step
    const timerRef = useRef(null);

    const sortedCities = [...cities].sort((a, b) => new Date(a.date) - new Date(b.date));
    const uniqueDates = [...new Set(sortedCities.map(c => c.date))].sort();

    const handleNext = () => {
        const currentIndex = uniqueDates.indexOf(currentDate);
        if (currentIndex < uniqueDates.length - 1) {
            onChange(uniqueDates[currentIndex + 1]);
        } else {
            setIsPlaying(false);
        }
    };

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(handleNext, speed);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, currentDate, speed]);

    return (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[5000] glass px-8 py-4 rounded-full border-white/10 flex items-center gap-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex flex-col">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Time-Lapse Replay</span>
                <span className="text-sm font-black text-white">{new Date(currentDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
            </div>

            <div className="w-[1px] h-8 bg-white/10" />

            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 bg-blue-500 hover:bg-blue-400 rounded-full text-white transition-all shadow-lg"
                >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                <div className="flex items-center gap-2 bg-white/5 rounded-full p-1">
                    {[500, 1000, 2000].map(s => (
                        <button
                            key={s}
                            onClick={() => setSpeed(s)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${speed === s ? 'bg-white/20 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {s === 500 ? 'Fast' : s === 1000 ? 'Med' : 'Slow'}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={onClose}
                className="ml-4 p-2 text-slate-500 hover:text-white transition-all"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

export default TimeLapseControls;
