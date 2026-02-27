import React, { useMemo } from 'react';
import { HelpCircle } from 'lucide-react';

const TravelCalendarHeatmap = ({ data = {} }) => {
    const years = useMemo(() => {
        const dates = Object.keys(data);
        if (dates.length === 0) return [new Date().getFullYear()];
        const yearsSet = new Set(dates.map(d => new Date(d).getFullYear()));
        return [...yearsSet].sort((a, b) => b - a);
    }, [data]);

    const currentYear = years[0] || new Date().getFullYear();

    // Generate dates for the year
    const days = useMemo(() => {
        const result = [];
        const start = new Date(currentYear, 0, 1);
        const end = new Date(currentYear, 11, 31);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            result.push({
                date: dateStr,
                count: data[dateStr] || 0,
                dayOfWeek: d.getDay()
            });
        }
        return result;
    }, [currentYear, data]);

    const getColor = (count) => {
        if (count === 0) return 'bg-slate-900 border-white/5';
        if (count === 1) return 'bg-blue-900 border-blue-800/50';
        if (count === 2) return 'bg-blue-700 border-blue-600/50';
        if (count === 3) return 'bg-blue-500 border-blue-400/50';
        return 'bg-blue-300 border-blue-200/50';
    };

    return (
        <div className="glass p-4 rounded-3xl border-white/5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Travel Activity</h3>
                <div className="flex items-center gap-1">
                    <span className="text-[8px] text-slate-600 font-bold uppercase">{currentYear}</span>
                    <HelpCircle className="w-3 h-3 text-slate-700" />
                </div>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar">
                <div className="grid grid-flow-col grid-rows-7 gap-1">
                    {days.map((day, idx) => (
                        <div
                            key={idx}
                            title={`${day.date}: ${day.count} visits`}
                            className={`w-2.5 h-2.5 rounded-sm border ${getColor(day.count)} transition-all hover:scale-125`}
                        />
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-end gap-1 mt-3">
                <span className="text-[8px] text-slate-700 font-bold uppercase mr-1">Less</span>
                <div className="w-2 h-2 rounded-sm bg-slate-900 border border-white/5" />
                <div className="w-2 h-2 rounded-sm bg-blue-900 border border-blue-800/50" />
                <div className="w-2 h-2 rounded-sm bg-blue-700 border border-blue-600/50" />
                <div className="w-2 h-2 rounded-sm bg-blue-500 border border-blue-400/50" />
                <div className="w-2 h-2 rounded-sm bg-blue-300 border border-blue-200/50" />
                <span className="text-[8px] text-slate-700 font-bold uppercase ml-1">More</span>
            </div>
        </div>
    );
};

export default TravelCalendarHeatmap;
