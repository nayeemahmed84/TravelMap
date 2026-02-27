import React, { useState, useEffect } from 'react';
import { Globe, X } from 'lucide-react';

const GlobeView = ({ visitedCountries = [], onClose }) => {
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setRotation(prev => (prev + 0.5) % 360);
        }, 30);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-950/90 backdrop-blur-3xl animate-in fade-in zoom-in duration-300">
            <button
                onClick={onClose}
                className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-[5001]"
            >
                <X className="w-6 h-6" />
            </button>

            <div className="relative group cursor-pointer">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full group-hover:bg-blue-500/30 transition-all duration-1000" />

                {/* Globe Container */}
                <div className="relative w-80 h-80 rounded-full overflow-hidden border border-white/20 shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                    {/* Shadow & Shading Overlay */}
                    <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_-20px_60px_rgba(0,0,0,0.8),inset_0_20px_60px_rgba(255,255,255,0.1)]" />
                    <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-tr from-transparent via-transparent to-blue-500/10" />

                    {/* Rotating Map Layer */}
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                            transform: `translateX(${-rotation}px)`,
                            width: '2000px',
                            transition: 'none'
                        }}
                    >
                        {/* Repeat map for continuous rotation */}
                        {[0, 1, 2].map(i => (
                            <svg key={i} viewBox="0 0 800 400" className="h-full w-auto opacity-40">
                                <rect width="800" height="400" fill="transparent" />
                                {visitedCountries.length > 0 && (
                                    <text x="400" y="200" fill="#3b82f6" fontSize="40" textAnchor="middle" fontWeight="black" className="uppercase tracking-widest opacity-20">
                                        WORLD EXPLORER
                                    </text>
                                )}
                                {/* This is a placeholder for a complex GeoJSON path. 
                                    In a real app, we'd render the paths here. 
                                    For now, we'll use a stylized dotted pattern. */}
                                <g fill="#60a5fa" opacity="0.5">
                                    {Array.from({ length: 150 }).map((_, j) => (
                                        <circle
                                            key={j}
                                            cx={Math.random() * 800}
                                            cy={Math.random() * 400}
                                            r={1.5}
                                        />
                                    ))}
                                </g>
                            </svg>
                        ))}
                    </div>

                    {/* Center Info Overlay */}
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
                        <div className="bg-slate-900/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 scale-90 group-hover:scale-110 transition-transform duration-500">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Exploring World</span>
                        </div>
                    </div>
                </div>

                {/* Atmosphere Ring */}
                <div className="absolute -inset-4 border border-blue-500/30 rounded-full animate-pulse blur-sm" />
                <div className="absolute -inset-10 border border-blue-500/10 rounded-full animate-ping opacity-20" />
            </div>

            {/* Bottom Stats Overlay */}
            <div className="absolute bottom-12 flex gap-8 animate-in slide-in-from-bottom duration-700">
                <div className="text-center">
                    <div className="text-3xl font-black text-white">{visitedCountries.length}</div>
                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Countries Visited</div>
                </div>
                <div className="w-[1px] h-12 bg-white/10" />
                <div className="text-center">
                    <div className="text-3xl font-black text-white">{Math.round((visitedCountries.length / 195) * 100)}%</div>
                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">World Covered</div>
                </div>
            </div>
        </div>
    );
};

export default GlobeView;
