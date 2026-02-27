import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const PLANE_ICON = L.divIcon({
    html: `<div style="font-size: 24px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5)); transform: rotate(var(--angle, 0deg));">✈️</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const FlightAnimationOverlay = ({ cities, onClose }) => {
    const map = useMap();
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [progress, setProgress] = useState(0);
    const [trailPoints, setTrailPoints] = useState([]);
    const markerRef = useRef(null);
    const animRef = useRef(null);
    const progressRef = useRef(0);

    const sortedCities = React.useMemo(
        () => [...cities].sort((a, b) => new Date(a.date) - new Date(b.date)),
        [cities]
    );

    // Build full path
    const fullPath = React.useMemo(() => {
        return sortedCities.map(c => [c.lat, c.lng]);
    }, [sortedCities]);

    const totalSegments = fullPath.length - 1;

    // Interpolate position
    const getPosition = useCallback((p) => {
        if (fullPath.length < 2) return fullPath[0] || [0, 0];
        const segmentFloat = p * totalSegments;
        const segIdx = Math.min(Math.floor(segmentFloat), totalSegments - 1);
        const t = segmentFloat - segIdx;
        const from = fullPath[segIdx];
        const to = fullPath[Math.min(segIdx + 1, fullPath.length - 1)];
        return [
            from[0] + (to[0] - from[0]) * t,
            from[1] + (to[1] - from[1]) * t
        ];
    }, [fullPath, totalSegments]);

    // Animation loop
    useEffect(() => {
        if (!isPlaying || fullPath.length < 2) return;

        const step = () => {
            progressRef.current += 0.002 * speed;
            if (progressRef.current >= 1) {
                progressRef.current = 1;
                setIsPlaying(false);
            }
            setProgress(progressRef.current);

            const pos = getPosition(progressRef.current);
            setTrailPoints(prev => [...prev, pos]);

            if (markerRef.current) {
                markerRef.current.setLatLng(pos);
            }

            if (progressRef.current < 1) {
                animRef.current = requestAnimationFrame(step);
            }
        };

        animRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animRef.current);
    }, [isPlaying, speed, getPosition, fullPath.length]);

    // Create marker
    useEffect(() => {
        if (fullPath.length < 2) return;
        const marker = L.marker(fullPath[0], { icon: PLANE_ICON, zIndexOffset: 10000 }).addTo(map);
        markerRef.current = marker;
        map.flyTo(fullPath[0], 4, { animate: true, duration: 1 });
        return () => marker.remove();
    }, [map, fullPath]);

    const reset = () => {
        setIsPlaying(false);
        progressRef.current = 0;
        setProgress(0);
        setTrailPoints([]);
        if (markerRef.current && fullPath[0]) {
            markerRef.current.setLatLng(fullPath[0]);
        }
    };

    if (fullPath.length < 2) return null;

    return (
        <>
            {/* Trail line */}
            {trailPoints.length > 1 && (
                <Polyline
                    positions={trailPoints}
                    pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.8, dashArray: '8,4' }}
                />
            )}

            {/* Controls overlay - rendered via portal-style absolute positioning */}
            <div className="flight-controls" style={{
                position: 'fixed',
                bottom: '160px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10000
            }}>
                <div className="glass p-4 rounded-2xl flex items-center gap-4 shadow-2xl border-blue-500/20" style={{
                    background: 'rgba(15,23,42,0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(59,130,246,0.3)'
                }}>
                    <button onClick={() => { setIsPlaying(!isPlaying); }} className="p-3 bg-blue-600 rounded-xl text-white hover:bg-blue-500 transition-all">
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>

                    <button onClick={reset} className="p-2 text-slate-400 hover:text-white transition-colors">
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Speed  */}
                    <div className="flex gap-1">
                        {[1, 2, 4].map(s => (
                            <button
                                key={s}
                                onClick={() => setSpeed(s)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${speed === s ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-white'}`}
                            >
                                {s}x
                            </button>
                        ))}
                    </div>

                    {/* Progress bar */}
                    <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-amber-500 rounded-full transition-[width]" style={{ width: `${progress * 100}%` }} />
                    </div>

                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Math.round(progress * 100)}%</span>

                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-red-400 transition-colors ml-2">
                        <span className="text-[10px] font-black uppercase">Close</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default FlightAnimationOverlay;
