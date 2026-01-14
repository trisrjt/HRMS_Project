import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { Calendar as CalendarIcon, List, ChevronLeft, ChevronRight } from "lucide-react";

const HolidayCalendarPage = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("calendar"); // Default to calendar
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        try {
            const res = await api.get("/holidays");
            setHolidays(res.data);
        } catch (err) {
            console.error("Failed to fetch holidays", err);
        } finally {
            setLoading(false);
        }
    };

    // Calendar Logic
    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const renderCalendar = () => {
        const { days, firstDay } = getDaysInMonth(currentMonth);
        const totalSlots = Math.ceil((days + firstDay) / 7) * 7;
        const daysArray = Array.from({ length: totalSlots }, (_, i) => {
            if (i < firstDay || i >= firstDay + days) return null;
            return i - firstDay + 1;
        });

        const getHolidaysForDate = (day) => {
            if (!day) return [];
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return holidays.filter(h => {
                const start = h.start_date;
                const end = h.end_date;
                return dateStr >= start && dateStr <= end;
            });
        };

        const isToday = (day) => {
            if (!day) return false;
            const today = new Date();
            return today.getDate() === day &&
                today.getMonth() === currentMonth.getMonth() &&
                today.getFullYear() === currentMonth.getFullYear();
        };

        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg ring-1 ring-black/5 overflow-hidden transition-all duration-300">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <button onClick={prevMonth} className="p-2 hover:bg-white/50 dark:hover:bg-gray-600 rounded-xl transition-all shadow-sm hover:shadow text-gray-600 dark:text-gray-300">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={nextMonth} className="p-2 hover:bg-white/50 dark:hover:bg-gray-600 rounded-xl transition-all shadow-sm hover:shadow text-gray-600 dark:text-gray-300">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <div className="grid grid-cols-7 text-center bg-gray-50/50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 auto-rows-fr bg-gray-50/30 dark:bg-gray-900/30">
                    {daysArray.map((day, idx) => {
                        const dayHolidays = getHolidaysForDate(day);
                        const hasHoliday = dayHolidays.length > 0;
                        return (
                            <div key={idx} className={`min-h-[120px] border-b border-r border-gray-100 dark:border-gray-700/50 p-2 transition-colors hover:bg-white dark:hover:bg-gray-750
                                ${!day ? 'bg-gray-50/50 dark:bg-gray-800/20' :
                                    hasHoliday ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-800'}`}>
                                {day && (
                                    <>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-all ${isToday(day)
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900'
                                                : hasHoliday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-700'
                                                }`}>
                                                {day}
                                            </span>
                                            {hasHoliday && (
                                                <span className="flex h-2 w-2 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-1.5 pl-1">
                                            {dayHolidays.map(h => (
                                                <div
                                                    key={h.id}
                                                    className="group text-[10px] sm:text-xs px-2 py-1.5 rounded-md border-l-2 shadow-sm bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                                                    title={h.name}
                                                >
                                                    <div className="font-semibold truncate">{h.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6" /> Holiday Calendar
                    </h1>
                    <p className="text-gray-500">Upcoming holidays for the year.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 flex">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                            title="List View"
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode("calendar")}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                            title="Calendar View"
                        >
                            <CalendarIcon size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === "list" ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Date Range</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {holidays.map((h) => (
                                <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-4 font-medium text-gray-900 dark:text-white">{h.name}</td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">
                                        {h.start_date} {h.start_date !== h.end_date && ` - ${h.end_date}`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {holidays.length === 0 && <div className="p-8 text-center text-gray-500">No holidays found.</div>}
                </div>
            ) : (
                renderCalendar()
            )}
        </div>
    );
};

export default HolidayCalendarPage;
