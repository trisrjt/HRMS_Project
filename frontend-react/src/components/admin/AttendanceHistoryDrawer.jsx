import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const AttendanceHistoryDrawer = ({ employee, isOpen, onClose, month }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState(""); // "" | "Present" | "Absent"
    // Local month state initiated with the passed prop month
    const [currentMonth, setCurrentMonth] = useState(month);

    useEffect(() => {
        if (isOpen && employee) {
            // Update local month if prop changes (e.g. parent filter changed), 
            // but primarily we use currentMonth for fetching
            setCurrentMonth(month);
        }
    }, [isOpen, employee, month]);

    // Fetch whenever currentMonth changes
    useEffect(() => {
        if (isOpen && employee) {
            fetchHistory();
        }
    }, [currentMonth, isOpen, employee]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Use local currentMonth state
            const response = await api.get(`/attendance/employee/${employee.id}?month=${currentMonth}`);
            setHistory(response.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch history", err);
            setError("Failed to load attendance history.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                    <div className="pointer-events-auto w-screen max-w-sm"> {/* Reduced width */}
                        <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-gray-800 shadow-xl">
                            <div className="bg-blue-600 px-4 py-4 sm:px-6"> {/* Reduced top padding */}
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-medium text-white">Attendance History</h2> {/* Smaller title */}
                                    <button
                                        type="button"
                                        className="relative rounded-md text-blue-200 hover:text-white focus:outline-none"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close panel</span>
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="mt-4 flex flex-col gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{employee?.name}</p>
                                        <p className="text-xs text-blue-200">{employee?.code}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            id="drawer_month_filter"
                                            name="drawer_month"
                                            type="month"
                                            value={currentMonth}
                                            onChange={(e) => setCurrentMonth(e.target.value)}
                                            className="block w-full text-xs p-1.5 rounded bg-blue-700 text-white border-none outline-none focus:ring-1 focus:ring-white placeholder-blue-300"
                                        />
                                        <select
                                            id="history_status_filter"
                                            name="status_filter"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="block w-full text-xs p-1.5 rounded bg-blue-700 text-white border-none outline-none focus:ring-1 focus:ring-white"
                                        >
                                            <option value="">All Status</option>
                                            <option value="Present">Present</option>
                                            <option value="Absent">Absent</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="relative flex-1 px-4 py-4 sm:px-6">
                                {loading ? (
                                    <div className="text-center text-gray-500 mt-10 text-sm">Loading history...</div>
                                ) : error ? (
                                    <div className="text-center text-red-500 mt-10 text-sm">{error}</div>
                                ) : history.length === 0 ? (
                                    <div className="text-center text-gray-500 mt-10 text-sm">No records found for this month.</div>
                                ) : (
                                    <ul className="space-y-3"> {/* Reduced gap */}
                                        {history.filter(record => statusFilter ? record.status === statusFilter : true).map((record) => (
                                            <li key={record.id} className="relative flex gap-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"> {/* Compact padding/gap */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg 
                                                    ${record.status === 'Present' ? 'bg-green-500' :
                                                        record.status === 'Absent' ? 'bg-red-500' :
                                                            record.status === 'Weekend' ? 'bg-indigo-400' : 'bg-gray-500'}`}
                                                />
                                                <div className="flex-auto">
                                                    <div className="flex justify-between gap-x-2">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="font-medium text-gray-900 dark:text-white block">
                                                                {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                            </span>
                                                        </div>
                                                        <div className={`text-[10px] font-medium rounded-full px-2 py-0.5 self-start
                                                            ${record.status === 'Present' ? 'bg-green-100 text-green-800' :
                                                                record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                                                                    record.status === 'Weekend' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                                                            {record.status}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-x-3 text-xs text-gray-500 dark:text-gray-400">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">In</span>
                                                            <span className={record.check_in ? 'text-green-600 font-medium' : 'text-red-500'}>{record.check_in || '-'}</span>
                                                        </div>
                                                        <div className="flex flex-col border-l pl-3 dark:border-gray-600">
                                                            <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Out</span>
                                                            <span className={record.check_out ? 'text-blue-600 font-medium' : 'text-gray-400'}>{record.check_out || '-'}</span>
                                                        </div>
                                                        <div className="flex flex-col border-l pl-3 dark:border-gray-600 ml-auto text-right">
                                                            <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Duration</span>
                                                            <span className="font-medium">{record.total_hours} hrs</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceHistoryDrawer;
