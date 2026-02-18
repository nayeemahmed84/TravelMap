import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const Timeline = React.memo(({ cities, currentDate, onChange }) => {
    const sortedCities = React.useMemo(() => [...cities].sort((a, b) => new Date(a.date) - new Date(b.date)), [cities]);

    // Local state for smooth sliding
    const [localVal, setLocalVal] = React.useState(new Date(currentDate).getTime());
    const throttleRef = React.useRef(0);

    React.useEffect(() => {
        const currentMs = new Date(currentDate).getTime();
        // Sync parent date back to local state only if it's a significant jump (prevents fighting with local drag)
        if (Math.abs(localVal - currentMs) > 1000 * 60 * 60 * 24) {
            setLocalVal(currentMs);
        }
    }, [currentDate]);

    if (sortedCities.length < 2) return null;

    const minDate = new Date(sortedCities[0].date).getTime();
    const maxDate = new Date().getTime();

    const handleInput = (e) => {
        const val = parseInt(e.target.value);
        setLocalVal(val);

        // Throttle parent update (32ms = ~30fps map updates)
        // This keeps the thumb at 60fps while map updates just enough
        const now = Date.now();
        if (now - throttleRef.current > 32) {
            const dateString = new Date(val).toISOString().split('T')[0];
            onChange(dateString);
            throttleRef.current = now;
        }
    };

    const step = (direction) => {
        const currentIndex = sortedCities.findIndex(c => c.date >= currentDate);
        const nextIndex = direction === 'next'
            ? Math.min(currentIndex + 1, sortedCities.length - 1)
            : Math.max(currentIndex - 1, 0);
        onChange(sortedCities[nextIndex].date);
    };

    const progressPercent = ((localVal - minDate) / (maxDate - minDate)) * 100;

    return (
        <div className="fixed bottom-10 left-[calc(50%+225px)] -translate-x-1/2 w-[calc(100%-550px)] max-w-[800px] z-[1000] glass p-6 rounded-[2.5rem] border-white/10 shadow-2xl animate-slide-up">
            <div className="flex items-center gap-6 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                    <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Time Travel Navigation</h3>
                    <p className="text-xl font-black text-white italic">{new Date(currentDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => step('prev')} className="p-2 glass rounded-xl text-slate-500 hover:text-white transition-all hover:bg-white/5"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => step('next')} className="p-2 glass rounded-xl text-slate-500 hover:text-white transition-all hover:bg-white/5"><ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="relative h-2 w-full bg-slate-900 rounded-full mb-2 group">
                <input
                    type="range"
                    min={minDate}
                    max={maxDate}
                    value={localVal}
                    onInput={handleInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                    className="absolute h-full bg-gradient-to-r from-blue-600 to-amber-500 rounded-full"
                    style={{ width: `${progressPercent}%`, willChange: 'width' }}
                />
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] border-4 border-blue-600 cursor-grab active:cursor-grabbing"
                    style={{ left: `${progressPercent}%`, transform: `translate(-50%, -50%)`, willChange: 'left' }}
                />

                {/* City Anchors */}
                {sortedCities.map((city) => (
                    <div
                        key={city.id}
                        className={`absolute top-0 w-1 h-full bg-white transition-opacity ${new Date(city.date).getTime() <= localVal ? 'opacity-40' : 'opacity-0'}`}
                        style={{ left: `${((new Date(city.date).getTime() - minDate) / (maxDate - minDate)) * 100}%` }}
                    />
                ))}
            </div>
            <div className="flex justify-between text-[8px] font-black text-slate-700 uppercase tracking-widest px-1">
                <span>The Journey Starts</span>
                <span>Present Moment</span>
            </div>
        </div>
    );
});

export default Timeline;
