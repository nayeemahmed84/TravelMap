import React, { useState, useEffect } from 'react';
import { X, Globe, Star, MapPin, Award, Zap, Camera, Calendar, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

const WrappedModal = ({ stats, isOpen, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setCurrentSlide(0);
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#fbbf24', '#ffffff']
            });
        }
    }, [isOpen]);

    if (!isOpen || !stats) return null;

    const slides = [
        {
            title: "Your Year in Motion",
            content: (
                <div className="text-center space-y-6">
                    <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <Globe className="w-12 h-12 text-blue-400" />
                    </div>
                    <h2 className="text-4xl font-black text-white italic">{stats.year} Recap</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Let's look back at your journey.</p>
                </div>
            )
        },
        {
            title: "The Distance",
            content: (
                <div className="text-center space-y-6">
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">You covered</p>
                    <h2 className="text-6xl font-black text-amber-500">{stats.distance.toLocaleString()}</h2>
                    <p className="text-2xl font-black text-white italic">Kilometers</p>
                    <p className="text-slate-600 font-medium italic mt-4">That's like circling the earth {(stats.distance / 40075).toFixed(2)} times!</p>
                </div>
            )
        },
        {
            title: "Destinations",
            content: (
                <div className="grid grid-cols-2 gap-6 p-4">
                    <div className="glass p-6 rounded-3xl text-center space-y-2 border-white/5">
                        <h3 className="text-3xl font-black text-blue-400">{stats.cityCount}</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cities</p>
                    </div>
                    <div className="glass p-6 rounded-3xl text-center space-y-2 border-white/5">
                        <h3 className="text-3xl font-black text-purple-400">{stats.countryCount}</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Countries</p>
                    </div>
                    <div className="glass p-6 rounded-3xl text-center space-y-2 border-white/10 col-span-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Impact</p>
                        <h3 className="text-xl font-black text-white">{stats.continentCount} Continents</h3>
                    </div>
                </div>
            )
        },
        {
            title: "Your Persona",
            content: (
                <div className="text-center space-y-8">
                    <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                        <Award className="w-10 h-10 text-amber-400" />
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">You are</p>
                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-200 to-amber-600">{stats.persona}</h2>
                    <p className="text-slate-400 text-sm max-w-[200px] mx-auto italic leading-relaxed">Your travel style reflects an appetite for discovery and new perspectives.</p>
                </div>
            )
        },
        {
            title: "The Peak",
            content: (
                <div className="text-center space-y-6">
                    <div className="relative">
                        <Calendar className="w-16 h-16 text-slate-800 mx-auto opacity-20" />
                        <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-blue-400 mt-2">✨</span>
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Peak Adventure in</p>
                    <h2 className="text-4xl font-black text-white">{stats.peakMonth}</h2>
                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mt-4">Top Stop: {stats.topCity}</p>
                </div>
            )
        }
    ];

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
            if (currentSlide === slides.length - 2) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full max-w-sm aspect-[9/16] glass rounded-[3rem] border-white/10 overflow-hidden shadow-[0_0_100px_rgba(59,130,246,0.2)]">
                {/* Progress Bar */}
                <div className="absolute top-8 left-8 right-8 flex gap-1 z-50">
                    {slides.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-blue-500 transition-all duration-300 ${idx < currentSlide ? 'w-full' : idx === currentSlide ? 'w-full animate-progress' : 'w-0'}`}
                            />
                        </div>
                    ))}
                </div>

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-12 right-8 z-50 p-2 text-white/50 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>

                {/* Content */}
                <div
                    className="h-full flex flex-col justify-center px-10 animate-slide-up"
                    key={currentSlide}
                >
                    {slides[currentSlide].content}
                </div>

                {/* Next Button Overlay */}
                <div className="absolute inset-0 z-40 cursor-pointer" onClick={nextSlide} />

                {/* Visual Hint */}
                <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-2 text-slate-500 animate-pulse pointer-events-none z-50">
                    <p className="text-[10px] font-black uppercase tracking-widest">Tap to continue</p>
                    <ChevronRight className="w-4 h-4" />
                </div>

                {/* Background Micro-decor */}
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/10 blur-[100px] pointer-events-none" />
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-500/5 blur-[100px] pointer-events-none" />
            </div>
        </div>
    );
};

export default WrappedModal;
