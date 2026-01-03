import { useState, useEffect } from "react";
import api from "../../api/axios";
import { formatTime, calculateHours, calculateWeeklyStats, calculateMonthlyStats } from "../../utils/dateUtils";

// --- UI Components ---

const Card = ({ children, className }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200 ${className}`}>
        {children}
    </div>
);

const CardHeader = ({ children }) => (
    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        {children}
    </div>
);

const CardContent = ({ children, className }) => (
    <div className={`p-6 ${className}`}>
        {children}
    </div>
);

const CardTitle = ({ children }) => (
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white m-0">
        {children}
    </h2>
);

const Button = ({ children, onClick, disabled, variant = "primary", className }) => {
    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg disabled:bg-blue-300 disabled:shadow-none",
        success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg disabled:bg-emerald-300 disabled:shadow-none",
        outline: "bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50",
        destructive: "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg disabled:bg-red-300 disabled:shadow-none"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center ${variants[variant]} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        >
            {children}
        </button>
    );
};

const Alert = ({ children, variant = "error" }) => (
    <div className={`p-4 rounded-lg mb-4 text-sm border ${variant === "error"
        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
        : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
        }`}>
        {children}
    </div>
);

const Badge = ({ children, variant = "default" }) => {
    const styles = {
        default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        Present: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        Absent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        Late: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        "Half Day": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    };

    const current = styles[variant] || styles.default;

    return (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${current}`}>
            {children}
        </span>
    );
};

// --- Main Page Component ---

const AttendancePage = () => {
    const [attendance, setAttendance] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Month Filter State
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Fetch Attendance Data
    const fetchAttendance = async () => {
        try {
            setError(null);
            // Using /my-attendance which is the correct existing endpoint
            const response = await api.get("/my-attendance");
            const data = response.data.data || response.data; // Handle pagination if present
            setAttendance(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch error:", err);
            setError("Failed to load attendance records. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    // Clear messages after 3 seconds
    useEffect(() => {
        if (successMessage || actionError) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setActionError(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, actionError]);

    // Check In Handler
    const handleCheckIn = async () => {
        try {
            setIsCheckingIn(true);
            setActionError(null);
            await api.post("/my-attendance/check-in");
            setSuccessMessage("Checked in successfully!");
            await fetchAttendance(); // Reload list
        } catch (err) {
            console.error("Check-in error:", err);
            setActionError(err?.response?.data?.message || "Failed to check in.");
        } finally {
            setIsCheckingIn(false);
        }
    };

    // Check Out Handler
    const handleCheckOut = async () => {
        try {
            setIsCheckingOut(true);
            setActionError(null);
            await api.post("/my-attendance/check-out");
            setSuccessMessage("Checked out successfully!");
            await fetchAttendance(); // Reload list
        } catch (err) {
            console.error("Check-out error:", err);
            setActionError(err?.response?.data?.message || "Failed to check out.");
        } finally {
            setIsCheckingOut(false);
        }
    };

    // Determine today's status for button states
    const today = new Date().toISOString().split("T")[0];
    const todayRecord = attendance.find(
        (record) => new Date(record.date).toISOString().split("T")[0] === today
    );
    const isCheckedInToday = !!todayRecord?.check_in;
    const isCheckedOutToday = !!todayRecord?.check_out;

    // Calculate Stats
    const weeklyStats = calculateWeeklyStats(attendance);
    const monthlyStats = calculateMonthlyStats(attendance, selectedMonth);

    // Filter attendance for display based on selected month
    const filteredAttendance = attendance.filter(record => record.date.startsWith(selectedMonth));

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 transition-colors">
                <div className="text-xl font-medium animate-pulse">Loading attendance...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1200px] mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">

            {/* Header & Actions */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Attendance</h1>

                    <div className="flex gap-4">
                        <Button
                            onClick={handleCheckIn}
                            disabled={isCheckingIn || isCheckedInToday}
                            variant="success"
                        >
                            {isCheckingIn ? "Checking In..." : isCheckedInToday ? "Checked In" : "Check In"}
                        </Button>

                        <Button
                            onClick={handleCheckOut}
                            disabled={isCheckingOut || !isCheckedInToday || isCheckedOutToday}
                            variant="destructive"
                        >
                            {isCheckingOut ? "Checking Out..." : isCheckedOutToday ? "Checked Out" : "Check Out"}
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                {actionError && (
                    <Alert variant="error">
                        <strong>Error:</strong> {actionError}
                    </Alert>
                )}
                {successMessage && (
                    <Alert variant="success">
                        <strong>Success:</strong> {successMessage}
                    </Alert>
                )}
                {error && (
                    <Alert variant="error">
                        {error}
                    </Alert>
                )}
            </div>

            {/* Summaries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                {/* Weekly Summary */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wide">This Week</div>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{weeklyStats.formatted || "0h 0m"}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">worked</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4">
                        <span>Days: <strong className="text-gray-700 dark:text-gray-300">{weeklyStats.daysWorked || 0}</strong></span>
                        <span>Avg: <strong className="text-gray-700 dark:text-gray-300">{weeklyStats.average || "0h"}</strong> / day</span>
                    </div>
                </div>

                {/* Monthly Summary */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Monthly Overview</div>
                        <input
                            type="month"
                            id="month-filter"
                            name="month-filter"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm px-3 py-1 rounded border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{monthlyStats.formatted || "0h 0m"}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">worked</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4">
                        <span>Days: <strong className="text-gray-700 dark:text-gray-300">{monthlyStats.daysWorked || 0}</strong></span>
                        <span>Avg: <strong className="text-gray-700 dark:text-gray-300">{monthlyStats.average || "0h"}</strong> / day</span>
                    </div>
                </div>

            </div>

            {/* Attendance List */}
            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle>Attendance History ({new Date(selectedMonth + "-01").toLocaleString('default', { month: 'long', year: 'numeric' })})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check In</th>
                                    <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check Out</th>
                                    <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hours</th>
                                    <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredAttendance.length > 0 ? (
                                    filteredAttendance.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {new Date(record.date).toLocaleDateString("en-US", {
                                                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                                })}
                                            </td>
                                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                                {record.check_in ? formatTime(record.check_in, record.date) : "--:--"}
                                            </td>
                                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                                {record.check_out ? formatTime(record.check_out, record.date) : "--:--"}
                                            </td>
                                            <td className="p-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                                {calculateHours(record.check_in, record.check_out)}
                                            </td>
                                            <td className="p-4 text-sm">
                                                <Badge variant={record.status}>
                                                    {record.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            No attendance records found for this month.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AttendancePage;
