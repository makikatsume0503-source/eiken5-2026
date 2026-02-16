
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import type { DailyStats } from '../App';

interface CalendarViewProps {
    activityLog: Record<string, DailyStats>;
}

const CalendarView: React.FC<CalendarViewProps> = ({ activityLog }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days = useMemo(() => {
        const arr: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) arr.push(null);
        for (let i = 1; i <= daysInMonth; i++) arr.push(i);
        return arr;
    }, [year, month, daysInMonth, firstDay]);

    const getStats = (day: number | null) => {
        if (!day) return null;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return activityLog[dateStr];
    };

    return (
        <div className="bg-white p-5 rounded-[35px] border-2 border-pink-100 shadow-sm w-full">
            <div className="flex justify-between items-center mb-4 px-2">
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 text-pink-300 active:scale-75"><ChevronLeft /></button>
                <h3 className="font-black text-pink-500 text-lg">{year}年 {month + 1}月</h3>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 text-pink-300 active:scale-75"><ChevronRight /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                    <span key={d} className="text-[10px] font-bold text-gray-300 pb-2">{d}</span>
                ))}
                {days.map((day, i) => {
                    const stats = getStats(day);
                    const played = stats && stats.answered > 0;
                    return (
                        <div key={i} className="aspect-square flex items-center justify-center relative">
                            {day && (
                                <>
                                    <span className={`text-xs font-bold z-10 ${played ? 'text-pink-600' : 'text-gray-400'}`}>{day}</span>
                                    {played && (
                                        <div className="absolute inset-0 bg-pink-100/50 rounded-full scale-90 flex items-center justify-center animate-in zoom-in">
                                            <Circle size={28} className="text-pink-400 fill-pink-200 opacity-60" />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;
