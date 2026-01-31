import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const AttendanceHistoryDrawer = ({ employee, isOpen, onClose, month }) => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState(""); // "" | "Present" | "Absent"
    // Local month state initiated with the passed prop month
    const [currentMonth, setCurrentMonth] = useState(month);

    const formatDuration = (hours) => {
        if (!hours) return "-";
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        if (h === 0) return `${m}m`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
    };

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
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{employee?.name}</p>
                                            <p className="text-xs text-blue-200">{employee?.code}</p>
                                        </div>
                                        {/* Checkout Button: removed from here to move to individual rows */}
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
                                                            <span className="font-medium">{formatDuration(record.total_hours)}</span>
                                                        </div>
                                                    </div>
                                                    {/* Overtime Information */}
                                                    {record.overtime_start && (
                                                        <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">Overtime</span>
                                                            </div>
                                                            <div className="flex items-center gap-x-3 text-xs">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Start</span>
                                                                    <span className="text-purple-600 font-medium">{record.overtime_start}</span>
                                                                </div>
                                                                <div className="flex flex-col border-l pl-3 dark:border-purple-300">
                                                                    <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">End</span>
                                                                    <span className="text-orange-600 font-medium">{record.overtime_end || 'In Progress'}</span>
                                                                </div>
                                                                {record.overtime_hours && (
                                                                    <div className="flex flex-col border-l pl-3 dark:border-purple-300 ml-auto text-right">
                                                                        <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">OT Hours</span>
                                                                        <span className="font-bold text-green-600">{record.overtime_hours}h</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Location and Device Information */}
                                                    {(record.check_in_latitude || record.device_id || (!record.check_out && record.check_in)) && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                                                            {/* Check-in Location */}
                                                            {record.check_in_latitude && record.check_in_longitude && (
                                                                <div className="flex items-start gap-2">
                                                                    <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Check-in Location</p>
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                                            {record.check_in_latitude}, {record.check_in_longitude}
                                                                        </p>
                                                                        <a
                                                                            href={`https://www.google.com/maps?q=${record.check_in_latitude},${record.check_in_longitude}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-xs text-blue-600 hover:underline"
                                                                        >
                                                                            View on Map
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {/* Check-out Location */}
                                                            {record.check_out_latitude && record.check_out_longitude && (
                                                                <div className="flex items-start gap-2">
                                                                    <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Check-out Location</p>
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                                            {record.check_out_latitude}, {record.check_out_longitude}
                                                                        </p>
                                                                        <a
                                                                            href={`https://www.google.com/maps?q=${record.check_out_latitude},${record.check_out_longitude}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-xs text-blue-600 hover:underline"
                                                                        >
                                                                            View on Map
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {/* Device Information */}
                                                            {record.device_id && (
                                                                <div className="flex items-start gap-2">
                                                                    <svg className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Device Info</p>
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                                            {record.device_type || 'Unknown'} - ID: {record.device_id}
                                                                        </p>
                                                                        {record.browser && (
                                                                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                                                                {record.browser}
                                                                            </p>
                                                                        )}
                                                                        {record.ip_address && (
                                                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                                                IP: {record.ip_address}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Force Checkout Action */}
                                                            {/* Permission Check: SuperAdmin OR can_force_checkout */}
                                                            {(user?.role_id === 1 || user?.can_force_checkout) && !record.check_out && record.check_in && (
                                                                <div className="mt-3 flex justify-end border-t border-gray-100 dark:border-gray-700 pt-2">
                                                                    <button
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            if (!window.confirm(`Force checkout for ${new Date(record.date).toLocaleDateString()}?`)) return;
                                                                            try {
                                                                                setLoading(true);
                                                                                await api.post(`/attendances/${record.id}/checkout`);
                                                                                alert("Employee checked out successfully");
                                                                                fetchHistory();
                                                                            } catch (err) {
                                                                                console.error("Checkout failed", err);
                                                                                alert(err.response?.data?.message || "Failed to checkout employee");
                                                                                setLoading(false);
                                                                            }
                                                                        }}
                                                                        className="group flex items-center gap-1 px-2 py-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-md text-[10px] font-medium transition-all shadow-sm hover:shadow-md hover:border-red-300"
                                                                        title="Force Checkout"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 group-hover:scale-110 transition-transform">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                                                        </svg>
                                                                        Force Out
                                                                    </button>
                                                                </div>
                                                            )}

                                                        </div>
                                                    )}
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
        </div >
    );
};

export default AttendanceHistoryDrawer;
