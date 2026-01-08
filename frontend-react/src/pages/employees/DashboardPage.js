import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { formatTime, calculateHours, calculateWeeklyStats, calculateMonthlyStats } from "../../utils/dateUtils";

// --- Internal Components ---

const DashboardHeader = ({ profile }) => {
    const today = new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl p-8 text-white mb-8 shadow-lg flex justify-between items-center flex-wrap gap-4">
            <div>
                <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {profile?.name?.split(' ')[0] || "Employee"}!
                </h1>
                <div className="flex gap-6 text-sm opacity-90">
                    <span>Department: <strong>{profile?.employee?.department || "N/A"}</strong></span>
                    <span>Designation: <strong>{profile?.employee?.designation || "N/A"}</strong></span>
                </div>
            </div>
            <div className="text-right bg-white/10 px-5 py-3 rounded-xl backdrop-blur-sm">
                <div className="text-sm opacity-80 mb-1">Today is</div>
                <div className="text-lg font-semibold">{today}</div>
            </div>
        </div>
    );
};

const AttendanceActionCard = ({ attendance, onCheckIn, onCheckOut, loading }) => {
    const isCheckedIn = !!attendance?.check_in;
    const isCheckedOut = !!attendance?.check_out;
    const status = attendance?.status || "Not Marked";

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8 transition-colors duration-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Attendance</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${status === "Present"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}>
                    {status}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Check In</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                        {attendance?.check_in ? formatTime(attendance.check_in) : "--:--"}
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Check Out</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                        {attendance?.check_out ? formatTime(attendance.check_out) : "--:--"}
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Duration</div>
                    <div className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                        {calculateHours(attendance?.check_in, attendance?.check_out)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={onCheckIn}
                    disabled={loading || isCheckedIn}
                    className={`py-3.5 rounded-xl font-semibold text-base transition-all duration-200 ${isCheckedIn
                        ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg"
                        }`}
                >
                    {isCheckedIn ? "Checked In" : "Check In"}
                </button>
                <button
                    onClick={onCheckOut}
                    disabled={loading || !isCheckedIn || isCheckedOut}
                    className={`py-3.5 rounded-xl font-semibold text-base transition-all duration-200 ${(!isCheckedIn || isCheckedOut)
                        ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
                        : "bg-rose-500 hover:bg-rose-600 text-white shadow-md hover:shadow-lg"
                        }`}
                >
                    {isCheckedOut ? "Checked Out" : "Check Out"}
                </button>
            </div>
        </div>
    );
};

const RecentActivitySection = ({ leaves, announcements, payslips, navigate }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Leaves */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Leave Summary</h3>
                <button onClick={() => navigate("/employee/leaves")} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm transition-colors">View All</button>
            </div>
            {leaves.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {leaves.map(leave => (
                        <div key={leave.id} className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                            <div>
                                <div className="font-medium text-gray-800 dark:text-gray-200">{leave.leave_type?.name || "Leave"}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${leave.status === "Approved" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                leave.status === "Rejected" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                                    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                }`}>
                                {leave.status}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-400 py-4">No recent leaves</div>
            )}
        </div>

        {/* Recent Announcements */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Announcements</h3>
                <button onClick={() => navigate("/employee/announcements")} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm transition-colors">View All</button>
            </div>
            {announcements.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {announcements.map(ann => (
                        <div key={ann.id} className="pb-2 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                            <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">{ann.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(ann.created_at).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-400 py-4">No announcements</div>
            )}
        </div>

        {/* Recent Payslips */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Payslips</h3>
                <button onClick={() => navigate("/employee/payslips")} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm transition-colors">View All</button>
            </div>
            {payslips.length > 0 ? (
                <div className="flex flex-col gap-3">
                    {payslips.map(payslip => (
                        <div key={payslip.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <div>
                                <div className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                                    {new Date(0, payslip.month - 1).toLocaleString('default', { month: 'short' })} {payslip.year}
                                </div>
                            </div>
                            <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                ₹{Number(payslip.net_pay || 0).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-400 py-4">No payslips found</div>
            )}
        </div>
    </div>
);

// --- Main Component ---

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [data, setData] = useState({
        profile: null,
        attendance: null,
        announcements: [],
        leaves: [],
        payslips: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all dashboard data
    const fetchDashboardData = async () => {
        try {
            // Fetch Profile (User Info)
            const profileRes = await api.get("/user");

            // Fetch Announcements
            const announcementsRes = await api.get("/announcements");
            const announcementsData = announcementsRes.data.data || announcementsRes.data; // Handle pagination

            // Fetch Leaves
            let leavesData = [];
            try {
                const leavesRes = await api.get("/my-leaves");
                leavesData = leavesRes.data;
            } catch (error) {
                console.warn("Failed to fetch leaves:", error);
            }

            // Fetch Payslips (Handle 403 if access restricted)
            let payslipsData = [];
            try {
                const payslipsRes = await api.get("/my-payslips");
                payslipsData = payslipsRes.data;
            } catch (error) {
                // If 403, it means access is restricted, which is expected for some employees
                if (error.response?.status !== 403) {
                    console.warn("Failed to fetch payslips:", error);
                }
            }

            // Fetch Attendance (Get All and find today, or assume API returns today)
            // Using /my-attendance which returns list. finding today.
            const attendanceRes = await api.get("/my-attendance");
            const todayStr = new Date().toISOString().split('T')[0];
            const attendanceList = attendanceRes.data.data || attendanceRes.data; // Handle pagination if any

            let todayAttendance = null;
            if (Array.isArray(attendanceList)) {
                todayAttendance = attendanceList.find(a => a.date === todayStr) || null;
            }

            setData({
                profile: profileRes.data,
                attendance: todayAttendance, // Object or null
                announcements: Array.isArray(announcementsData) ? announcementsData.slice(0, 3) : [],
                leaves: Array.isArray(leavesData) ? leavesData.slice(0, 5) : [],
                payslips: Array.isArray(payslipsData) ? payslipsData.slice(0, 3) : []
            });
            setError(null);
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            // Only set fatal error if core profile/attendance fails
            setError("Failed to load dashboard. Please try refreshing.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Attendance Actions
    const handleAttendanceAction = async (type) => {
        try {
            setActionLoading(true);
            const endpoint = type === "check-in" ? "/my-attendance/check-in" : "/my-attendance/check-out";
            await api.post(endpoint);
            // Refresh data
            await fetchDashboardData();
        } catch (err) {
            alert(err?.response?.data?.message || `Failed to ${type}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 transition-colors">
                <div className="text-xl font-medium animate-pulse">Loading Dashboard...</div>
            </div>
        );
    }

    if (!data.profile && error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen text-red-500 dark:text-red-400 bg-gray-50 dark:bg-gray-900 transition-colors">
                <div className="mb-4">{error}</div>
                <button onClick={fetchDashboardData} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Retry</button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
            <DashboardHeader profile={data.profile} />

            {/* Attendance Section */}
            <AttendanceActionCard
                attendance={data.attendance}
                onCheckIn={() => handleAttendanceAction("check-in")}
                onCheckOut={() => handleAttendanceAction("check-out")}
                loading={actionLoading}
            />

            {/* Recent Activity */}
            <RecentActivitySection
                leaves={data.leaves}
                announcements={data.announcements}
                payslips={data.payslips}
                navigate={navigate}
            />
        </div>
    );
};

export default DashboardPage;
