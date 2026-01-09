import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { formatTime, calculateHours, calculateWeeklyStats, calculateMonthlyStats } from "../../utils/dateUtils";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
                    <span>Department: <strong>{profile?.employee?.department?.name || "N/A"}</strong></span>
                    <span>Designation: <strong>{profile?.employee?.designation?.name || "N/A"}</strong></span>
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
    const [currentLocation, setCurrentLocation] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'check-in' or 'check-out'

    const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : false;

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

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (showLocationModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showLocationModal]);

    // Get Location - REQUIRED, no fallback
    const getLocation = () => {
        return new Promise((resolve, reject) => {
            if (!isSecureContext) {
                reject(
                    new Error(
                        'Location requires a secure context. Open the app on http://localhost:3000 (or use HTTPS).'
                    )
                );
                return;
            }

            console.log("🔍 Checking geolocation support...");

            if (!navigator.geolocation) {
                console.error("❌ Geolocation not supported");
                reject(new Error("Geolocation is not supported by your browser. Please use a modern browser to check in."));
                return;
            }

            console.log("✅ Geolocation supported, requesting permission...");

            // Helpful diagnostic (does not trigger prompt)
            if (navigator.permissions?.query) {
                navigator.permissions
                    .query({ name: 'geolocation' })
                    .then((status) => {
                        console.log('🧭 Geolocation permission state:', status.state);
                    })
                    .catch((e) => {
                        console.log('🧭 Geolocation permission query failed:', e);
                    });
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log("✅ Location obtained:", position.coords);
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    setCurrentLocation(location);
                    resolve(location);
                },
                (error) => {
                    console.error("❌ Location error:", error.code, error.message);
                    let errorMessage = "Location access denied. Please allow location access to check in.";

                    if (error.code === error.PERMISSION_DENIED) {
                        errorMessage = "Location permission denied. You must allow location access to check in/out.";
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errorMessage = "Location information unavailable. Please try again.";
                    } else if (error.code === error.TIMEOUT) {
                        errorMessage = "Location request timed out. Please try again.";
                    }

                    reject(new Error(errorMessage));
                },
                {
                    timeout: 15000,
                    enableHighAccuracy: true,
                    maximumAge: 0
                }
            );
        });
    };

    // Get Device Information
    const getDeviceInfo = () => {
        const ua = navigator.userAgent;
        let deviceType = 'Desktop';

        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            deviceType = 'Tablet';
        } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            deviceType = 'Mobile';
        }

        // Extract browser name
        let browser = 'Unknown';
        if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
        else if (ua.indexOf('Safari') > -1) browser = 'Safari';
        else if (ua.indexOf('Edge') > -1) browser = 'Edge';
        else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) browser = 'IE';

        // Generate a device ID (stored in localStorage)
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('device_id', deviceId);
        }

        return {
            device_id: deviceId,
            device_type: deviceType,
            browser: browser
        };
    };

    // Attendance Actions with Location
    const handleAttendanceAction = async (type) => {
        console.log(type === "check-in" ? "🔵 Check-in clicked from dashboard" : "🔴 Check-out clicked from dashboard");

        // Check if current time is after 9:00 PM for checkout
        if (type === "check-out") {
            const currentHour = new Date().getHours();
            if (currentHour >= 21) { // 21:00 = 9:00 PM
                alert("Checkout is not allowed after 9:00 PM. Please contact HR/Admin/SuperAdmin for assistance.");
                return;
            }
        }

        try {
            setPendingAction(type);

            console.log("📍 Requesting location for", type);
            // Request location permission immediately - this triggers browser prompt
            const location = await getLocation();

            console.log("✅ Location received, showing modal:", location);
            // If successful, show modal with map
            setShowLocationModal(true);
        } catch (err) {
            console.error("❌ Location error:", err);
            alert("Location Error: " + (err?.message || "Please enable location access in browser settings"));
            setPendingAction(null);
        }
    };

    // Proceed with Check In/Out after location confirmation
    const proceedWithAction = async () => {
        try {
            setActionLoading(true);
            setShowLocationModal(false);

            // Location already captured, just get device info
            const deviceInfo = getDeviceInfo();

            let payload, endpoint;

            if (pendingAction === "check-in") {
                payload = {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    force_checkin: true,
                    ...deviceInfo
                };
                endpoint = "/my-attendance/check-in";
            } else {
                payload = {
                    check_out_latitude: currentLocation.latitude,
                    check_out_longitude: currentLocation.longitude,
                };
                endpoint = "/my-attendance/check-out";
            }

            await api.post(endpoint, payload);

            // Refresh data
            await fetchDashboardData();
            alert(`${pendingAction === "check-in" ? "Checked in" : "Checked out"} successfully at your current location!`);
        } catch (err) {
            console.error(`${pendingAction} error:`, err);

            // Check if it's a time restriction error
            if (err.response?.data?.error === 'checkout_restricted') {
                alert(err.response.data.message || "Checkout is not allowed after 9:00 PM. Please contact HR/Admin/SuperAdmin.");
            } else {
                alert(err?.response?.data?.message || `Failed to ${pendingAction}`);
            }
        } finally {
            setActionLoading(false);
            setPendingAction(null);
            setCurrentLocation(null);
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

            {/* Location Permission Modal */}
            {showLocationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
                        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                📍 Location Required
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Confirm your location for attendance tracking
                            </p>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Map Preview */}
                            {currentLocation && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Your Current Location:
                                    </p>
                                    <div className="h-48 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                                        <MapContainer
                                            center={[currentLocation.latitude, currentLocation.longitude]}
                                            zoom={15}
                                            style={{ height: '100%', width: '100%' }}
                                            scrollWheelZoom={false}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <Marker position={[currentLocation.latitude, currentLocation.longitude]}>
                                                <Popup>
                                                    Your Location<br />
                                                    Lat: {currentLocation.latitude.toFixed(6)}<br />
                                                    Lng: {currentLocation.longitude.toFixed(6)}
                                                </Popup>
                                            </Marker>
                                        </MapContainer>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        📌 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                                    </p>
                                </div>
                            )}

                            {/* Info Box */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-xs text-blue-800 dark:text-blue-300">
                                    <strong>ℹ️ Note:</strong> Your location is captured only during check-in/check-out for attendance verification.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowLocationModal(false);
                                    setPendingAction(null);
                                    setCurrentLocation(null);
                                    setActionLoading(false);
                                }}
                                disabled={actionLoading}
                                className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={proceedWithAction}
                                disabled={actionLoading}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${pendingAction === 'check-in'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-rose-600 hover:bg-rose-700'
                                    } text-white shadow-md hover:shadow-lg disabled:opacity-50`}
                            >
                                {actionLoading ? 'Processing...' : `Confirm ${pendingAction === 'check-in' ? 'Check In' : 'Check Out'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
