import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const PhotoLightbox = ({ photos = [], currentIndex = 0, cityName = '', onClose, onNavigate }) => {
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowLeft') onNavigate(Math.max(0, currentIndex - 1));
        if (e.key === 'ArrowRight') onNavigate(Math.min(photos.length - 1, currentIndex + 1));
    }, [currentIndex, photos.length, onClose, onNavigate]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!photos.length) return null;

    return (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center animate-fade-in">
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={onClose} />

            {/* Close */}
            <button onClick={onClose} className="absolute top-6 right-6 z-50 p-3 glass rounded-2xl text-white/60 hover:text-white transition-all hover:bg-white/10">
                <X className="w-6 h-6" />
            </button>

            {/* Navigation */}
            {currentIndex > 0 && (
                <button onClick={() => onNavigate(currentIndex - 1)} className="absolute left-6 z-50 p-4 glass rounded-2xl text-white/60 hover:text-white transition-all hover:bg-white/10">
                    <ChevronLeft className="w-8 h-8" />
                </button>
            )}
            {currentIndex < photos.length - 1 && (
                <button onClick={() => onNavigate(currentIndex + 1)} className="absolute right-6 z-50 p-4 glass rounded-2xl text-white/60 hover:text-white transition-all hover:bg-white/10">
                    <ChevronRight className="w-8 h-8" />
                </button>
            )}

            {/* Photo */}
            <div className="relative z-40 max-w-[90vw] max-h-[85vh]">
                <img
                    src={photos[currentIndex]}
                    alt={`${cityName} - Photo ${currentIndex + 1}`}
                    className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                    style={{ animation: 'fadeIn 0.3s ease-out' }}
                />
            </div>

            {/* Bottom info bar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 glass px-8 py-4 rounded-2xl flex items-center gap-6">
                <h3 className="text-sm font-black text-white">{cityName}</h3>
                <div className="w-px h-4 bg-white/10" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {currentIndex + 1} / {photos.length}
                </span>
            </div>
        </div>
    );
};

export default PhotoLightbox;
