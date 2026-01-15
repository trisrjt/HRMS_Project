import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import api from "../../../api/axios";
import { formatDate } from "../../../utils/dateUtils";

const EmployeeAttendancePage = () => {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    // State
    const [employee, setEmployee] = useState(null);
    const [attendanceData, setAttendanceData] = useState({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } });
    const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, on_leave: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [month, setMonth] = useState(searchParams.get("month") || currentMonth);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setSearchParams({ month });
        fetchEmployee();
        fetchAttendance();
        fetchSummary();
    }, [id, month, currentPage]);

    const fetchEmployee = async () => {
        try {
            const response = await api.get(`/superadmin/employees/${id}`);
            setEmployee(response.data);
        } catch (err) {
            console.error("Failed to fetch employee", err);
            setError("Failed to load employee details.");
        }
    };

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/superadmin/employees/${id}/attendance`, {
                params: { month, page: currentPage }
            });
            setAttendanceData(response.data);
        } catch (err) {
            console.error("Failed to fetch attendance", err);
            setError("Failed to load attendance records.");
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await api.get(`/superadmin/employees/${id}/attendance/summary`, {
                params: { month }
            });
            setSummary(response.data);
        } catch (err) {
            console.error("Failed to fetch summary", err);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get(`/superadmin/employees/${id}/attendance/export`, {
                params: { month },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${employee?.employee_code}_${month}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Failed to export attendance", err);
            alert("Failed to export attendance.");
        }
    };

    const handleMonthChange = (offset) => {
        const date = new Date(month + "-01");
        date.setMonth(date.getMonth() + offset);
        const newMonth = date.toISOString().slice(0, 7);
        setMonth(newMonth);
        setCurrentPage(1);
    };

    const formatTime = (timeString) => {
        if (!timeString) return "-";
        const [hours, minutes] = timeString.split(":");
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusBadgeClass = (status) => {
        const baseClass = "px-2 py-1 rounded-full text-xs font-semibold";
        switch (status) {
            case "Present": return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
            case "Absent": return `${baseClass} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
            case "Late": return `${baseClass} bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400`;
            case "On Leave": return `${baseClass} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
            default: return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
        }
    };

    if (error) {
        return <div className="p-8 text-red-500 dark:text-red-400 text-center">{error}</div>;
    }

    return (
        <div className="p-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{employee?.user?.name || "Employee Attendance"}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {employee?.employee_code} • {employee?.department?.name}
                    </p>
                </div>
                <Link
                    to="/superadmin/employees"
                    className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                    Back to Employees
                </Link>
            </div>

            {/* Summary Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 transition-colors">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.present}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Present</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.absent}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Absent</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.late}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Late</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.on_leave}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">On Leave</div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-center mb-6">
                <button
                    onClick={() => handleMonthChange(-1)}
                    className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                    &lt; Prev
                </button>
                <input
                    type="month"
                    id="month"
                    name="month"
                    aria-label="Filter by Month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <button
                    onClick={() => handleMonthChange(1)}
                    className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                    Next &gt;
                </button>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    title="Export CSV"
                >
                    Export CSV
                </button>
                <button
                    onClick={fetchAttendance}
                    className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    title="Refresh"
                >
                    Refresh
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading attendance...</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Day</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check In</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check Out</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {attendanceData.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                No records for this month.
                                            </td>
                                        </tr>
                                    ) : (
                                        attendanceData.data.map((record) => (
                                            <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDate(record.date)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatTime(record.check_in)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatTime(record.check_out)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={getStatusBadgeClass(record.status)}>{record.status}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {attendanceData.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm font-medium ${currentPage === 1 ? "text-gray-400 dark:text-gray-500 cursor-not-allowed" : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Page {currentPage} of {attendanceData.last_page}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(attendanceData.last_page, p + 1))}
                                    disabled={currentPage === attendanceData.last_page}
                                    className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm font-medium ${currentPage === attendanceData.last_page ? "text-gray-400 dark:text-gray-500 cursor-not-allowed" : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default EmployeeAttendancePage;
