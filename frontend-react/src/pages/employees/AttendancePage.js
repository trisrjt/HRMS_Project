import { useState, useEffect } from "react";
import api from "../../api/axios";
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
    const [currentLocation, setCurrentLocation] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'check-in' or 'check-out'
    
    // Pending checkouts modal states
    const [showPendingCheckoutsModal, setShowPendingCheckoutsModal] = useState(false);
    const [pendingCheckouts, setPendingCheckouts] = useState([]);

    // Overtime states
    const [isStartingOvertime, setIsStartingOvertime] = useState(false);
    const [isEndingOvertime, setIsEndingOvertime] = useState(false);

    const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : false;

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

    // Check In Handler - Request location first, then show modal
    const handleCheckIn = async () => {
        console.log("🔵 Check-in button clicked");
        
        // Check if already checked in today
        const today = new Date().toISOString().split("T")[0];
        const todayRecord = attendance.find(
            (record) => new Date(record.date).toISOString().split("T")[0] === today
        );
        
        if (todayRecord?.check_in) {
            setActionError("You have already checked in today.");
            return;
        }
        
        try {
            setPendingAction('check-in');
            setActionError(null);
            
            console.log("📍 Requesting location for check-in...");
            // Request location permission immediately - this triggers browser prompt
            const location = await getLocation();
            
            console.log("✅ Location received:", location);
            
            // Check for pending checkouts before proceeding
            const checkResponse = await api.post("/my-attendance/check-in", {
                latitude: location.latitude,
                longitude: location.longitude,
                ...getDeviceInfo()
            });
            
            // If the response indicates pending checkouts
            if (checkResponse.data.requires_action && checkResponse.data.pending_checkouts) {
                console.log("⚠️ Pending checkouts detected:", checkResponse.data.pending_checkouts);
                setPendingCheckouts(checkResponse.data.pending_checkouts);
                setShowPendingCheckoutsModal(true);
                setCurrentLocation(location); // Save location for later use
                return;
            }
            
            // If no pending checkouts, proceed normally
            setShowLocationModal(true);
        } catch (err) {
            console.error("❌ Check-in error:", err);
            
            // If it's a 409 error (already checked in), show appropriate message
            if (err?.response?.status === 409) {
                setActionError(err?.response?.data?.message || "Already checked in today.");
            } else {
                setActionError(
                    err?.message ||
                        "Location access denied. In Brave: click the icon near the URL → Site settings → Location → Allow"
                );
            }
            setPendingAction(null);
        }
    };

    // Skip pending checkouts and proceed with new check-in
    const skipPendingCheckoutsAndCheckIn = async () => {
        try {
            setIsCheckingIn(true);
            setActionError(null);
            setShowPendingCheckoutsModal(false);

            const deviceInfo = getDeviceInfo();
            const payload = {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                force_checkin: true, // Force check-in even with pending checkouts
                ...deviceInfo
            };

            await api.post("/my-attendance/check-in", payload);
            setSuccessMessage("Checked in successfully! Don't forget to check out your pending sessions.");
            await fetchAttendance(); // Reload list
        } catch (err) {
            console.error("Force check-in error:", err);
            setActionError(err?.message || err?.response?.data?.message || "Failed to check in.");
        } finally {
            setIsCheckingIn(false);
            setPendingAction(null);
            setCurrentLocation(null);
            setPendingCheckouts([]);
        }
    };

    // Close pending checkouts modal
    const closePendingCheckoutsModal = () => {
        setShowPendingCheckoutsModal(false);
        setPendingCheckouts([]);
        setPendingAction(null);
        setCurrentLocation(null);
    };

    // Check Out Handler - Current Session Only
    // Check Out Handler - Current Session Only
    const handleCheckOut = async () => {
        console.log("🔴 Check-out button clicked");
        setActionError(null);
        console.log("🔴 Getting location for check-out...");

        try {
            const location = await getLocation();
            console.log("✅ Location obtained:", location);
            setCurrentLocation(location);
            setPendingAction('check-out');
            setShowLocationModal(true);
        } catch (error) {
            console.error("❌ Location error:", error);
            setActionError(error.message || "Failed to get your location. Please enable location services.");
        }
    };

    // Proceed with Check In after location confirmation
    const proceedWithCheckIn = async () => {
        try {
            setIsCheckingIn(true);
            setActionError(null);
            setShowLocationModal(false);

            // Location already captured, just get device info
            const deviceInfo = getDeviceInfo();

            const payload = {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                force_checkin: true, // Use force to ensure check-in happens
                ...deviceInfo
            };

            await api.post("/my-attendance/check-in", payload);
            setSuccessMessage("Checked in successfully at your current location!");
            await fetchAttendance(); // Reload list
        } catch (err) {
            console.error("Check-in error:", err);
            setActionError(err?.message || err?.response?.data?.message || "Failed to check in.");
        } finally {
            setIsCheckingIn(false);
            setPendingAction(null);
            setCurrentLocation(null);
        }
    };

    // Perform Check-Out - Current Session Only
    const performCheckOut = async () => {
        try {
            setIsCheckingOut(true);
            setShowLocationModal(false);
            
            const response = await api.post("/my-attendance/check-out", {
                check_out_latitude: currentLocation.latitude,
                check_out_longitude: currentLocation.longitude,
            });

            setSuccessMessage("Successfully checked out! 👋");
            await fetchAttendance();
        } catch (error) {
            console.error("Checkout error:", error);
            
            // Check if it's a time restriction error
            if (error.response?.data?.error === 'checkout_restricted') {
                setActionError(error.response.data.message || "Checkout is not allowed after 9:00 PM. Please contact HR/Admin/SuperAdmin.");
            } else {
                setActionError(error.response?.data?.message || "Failed to check out. Please try again.");
            }
        } finally {
            setIsCheckingOut(false);
            setPendingAction(null);
            setCurrentLocation(null);
        }
    };

    // Handle Start Overtime
    const handleStartOvertime = async () => {
        try {
            setIsStartingOvertime(true);
            setActionError(null);
            
            await api.post("/my-attendance/overtime/start");
            setSuccessMessage("Overtime started successfully!");
            await fetchAttendance();
        } catch (err) {
            console.error("Start overtime error:", err);
            setActionError(err?.response?.data?.message || "Failed to start overtime. Please try again.");
        } finally {
            setIsStartingOvertime(false);
        }
    };

    // Handle End Overtime
    const handleEndOvertime = async () => {
        try {
            setIsEndingOvertime(true);
            setActionError(null);
            
            await api.post("/my-attendance/overtime/end");
            setSuccessMessage("Overtime ended successfully!");
            await fetchAttendance();
        } catch (err) {
            console.error("End overtime error:", err);
            setActionError(err?.response?.data?.message || "Failed to end overtime. Please try again.");
        } finally {
            setIsEndingOvertime(false);
        }
    };

    // Determine today's status for button states
    const today = new Date().toISOString().split("T")[0];
    const todayRecord = attendance.find(
        (record) => new Date(record.date).toISOString().split("T")[0] === today
    );
    const isCheckedInToday = !!todayRecord?.check_in;
    const isCheckedOutToday = !!todayRecord?.check_out;
    const hasStartedOvertime = !!todayRecord?.overtime_start;
    const hasEndedOvertime = !!todayRecord?.overtime_end;

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

                    <div className="flex gap-4 flex-wrap">
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

                        {/* Overtime Buttons */}
                        {isCheckedOutToday && !hasEndedOvertime && (
                            <>
                                <Button
                                    onClick={handleStartOvertime}
                                    disabled={isStartingOvertime || hasStartedOvertime}
                                    variant="primary"
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    {isStartingOvertime ? "Starting..." : hasStartedOvertime ? "OT Started" : "Start Overtime"}
                                </Button>
                                
                                {hasStartedOvertime && (
                                    <Button
                                        onClick={handleEndOvertime}
                                        disabled={isEndingOvertime}
                                        variant="primary"
                                        className="bg-orange-600 hover:bg-orange-700"
                                    >
                                        {isEndingOvertime ? "Ending..." : "End Overtime"}
                                    </Button>
                                )}
                            </>
                        )}
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
                                    <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overtime</th>
                                    <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                                    <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Device</th>
                                    <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remarks</th>
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
                                                <div className="flex flex-col">
                                                    <span>{record.check_in ? formatTime(record.check_in, record.date) : "--:--"}</span>
                                                    {record.check_in_latitude && record.check_in_longitude && (
                                                        <a 
                                                            href={`https://www.google.com/maps?q=${record.check_in_latitude},${record.check_in_longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 hover:underline mt-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            📍 View
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                                <div className="flex flex-col">
                                                    <span>{record.check_out ? formatTime(record.check_out, record.date) : "--:--"}</span>
                                                    {record.check_out_latitude && record.check_out_longitude && (
                                                        <a 
                                                            href={`https://www.google.com/maps?q=${record.check_out_latitude},${record.check_out_longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 hover:underline mt-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            📍 View
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                                {calculateHours(record.check_in, record.check_out)}
                                            </td>
                                            <td className="p-4 text-sm">
                                                {record.overtime_start ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                                                            Start: {formatTime(record.overtime_start, record.date)}
                                                        </span>
                                                        {record.overtime_end ? (
                                                            <>
                                                                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                                                    End: {formatTime(record.overtime_end, record.date)}
                                                                </span>
                                                                <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                                                    {record.overtime_hours}h OT
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                                                ⏳ In Progress
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">--</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-xs text-gray-600 dark:text-gray-400">
                                                {record.check_in_latitude && record.check_in_longitude ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium">In: {Number(record.check_in_latitude).toFixed(4)}, {Number(record.check_in_longitude).toFixed(4)}</span>
                                                        {record.check_out_latitude && record.check_out_longitude && (
                                                            <span className="font-medium">Out: {Number(record.check_out_latitude).toFixed(4)}, {Number(record.check_out_longitude).toFixed(4)}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">--</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-xs text-gray-600 dark:text-gray-400">
                                                {record.device_id ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium">{record.device_type || 'Unknown'}</span>
                                                        <span className="text-gray-500 dark:text-gray-500 truncate max-w-[120px]" title={String(record.device_id)}>
                                                            ID: {String(record.device_id).substring(0, 12)}...
                                                        </span>
                                                        {record.browser && (
                                                            <span className="text-gray-500 dark:text-gray-500">{record.browser}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">--</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm">
                                                <Badge variant={record.status}>
                                                    {record.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-xs text-gray-600 dark:text-gray-400">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium text-green-600 dark:text-green-400">
                                                        ✓ Checked in by {record.checked_in_by || 'self'}
                                                    </span>
                                                    {record.check_out && (
                                                        <span className="font-medium text-purple-600 dark:text-purple-400">
                                                            ✓ Checked out by {record.checked_out_by || 'self'}
                                                        </span>
                                                    )}
                                                    {!record.check_out && (
                                                        <span className="text-amber-600 dark:text-amber-400">
                                                            ⏳ Pending checkout
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            No attendance records found for this month.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

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
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowLocationModal(false);
                                    setPendingAction(null);
                                    setCurrentLocation(null);
                                    setIsCheckingIn(false);
                                    setIsCheckingOut(false);
                                }}
                                disabled={isCheckingIn || isCheckingOut}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant={pendingAction === 'check-out' ? 'destructive' : 'success'}
                                onClick={pendingAction === 'check-out' ? performCheckOut : proceedWithCheckIn}
                                disabled={isCheckingIn || isCheckingOut}
                            >
                                {isCheckingIn || isCheckingOut 
                                    ? 'Processing...' 
                                    : pendingAction === 'check-out' 
                                        ? 'Confirm Check Out' 
                                        : 'Confirm Check In'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Checkouts Modal */}
            {showPendingCheckoutsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                ⚠️ Pending Check-Outs Detected
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                You have {pendingCheckouts.length} session{pendingCheckouts.length > 1 ? 's' : ''} without check-out. Contact HR/Admin for checkout or proceed with new check-in.
                            </p>
                        </div>

                        <div className="p-5">
                            <div className="space-y-3">
                                {pendingCheckouts.map((session) => (
                                    <div
                                        key={session.id}
                                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    📅 {new Date(session.date).toLocaleDateString('en-US', { 
                                                        weekday: 'long', 
                                                        year: 'numeric', 
                                                        month: 'long', 
                                                        day: 'numeric' 
                                                    })}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                    Check-in: <span className="font-medium text-green-600 dark:text-green-400">{session.check_in}</span>
                                                </div>
                                                {session.check_in_latitude && session.check_in_longitude && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        📍 {Number(session.check_in_latitude).toFixed(4)}, {Number(session.check_in_longitude).toFixed(4)}
                                                    </div>
                                                )}
                                            </div>
                                            <Badge variant="warning">Pending</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Info Box */}
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                    <strong>ℹ️ Note:</strong> Employees cannot check themselves out. Please contact HR or Admin to complete these checkouts, or proceed with a new check-in. Unchecked sessions will be automatically checked out at midnight.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={closePendingCheckoutsModal}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="success"
                                onClick={skipPendingCheckoutsAndCheckIn}
                            >
                                Proceed with Check In
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendancePage;
