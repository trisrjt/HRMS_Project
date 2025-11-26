import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

// Simple Toast Component
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === "success" ? "#10b981" : "#ef4444";

    return (
        <div
            style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                backgroundColor: bgColor,
                color: "white",
                padding: "12px 20px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 1000,
                opacity: 1,
                transition: "opacity 0.3s ease-out",
            }}
        >
            {message}
        </div>
    );
};

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [userInfo, setUserInfo] = useState(null);
    const [attendance, setAttendance] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [toast, setToast] = useState(null);

    // Fetch all required data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 1. Fetch User Info
                const userRes = await api.get("/user");
                setUserInfo(userRes.data);

                // 2. Fetch Attendance
                const attendanceRes = await api.get("/my-attendance");
                const today = new Date().toISOString().split("T")[0];
                // Find today's record if it exists
                const todayRecord = Array.isArray(attendanceRes.data)
                    ? attendanceRes.data.find((record) => {
                        const recordDate = new Date(record.date).toISOString().split("T")[0];
                        return recordDate === today;
                    })
                    : null;
                setAttendance(todayRecord);

                // 3. Fetch Announcements
                const announcementsRes = await api.get("/announcements");
                // Get latest 3 announcements
                const latest = Array.isArray(announcementsRes.data)
                    ? announcementsRes.data.slice(0, 3)
                    : [];
                setAnnouncements(latest);

            } catch (err) {
                console.error("Dashboard data fetch error:", err);
                // If /user fails (401), axios interceptor handles redirect, but we can double check
                if (err.response && err.response.status === 401) {
                    navigate("/login");
                    return;
                }
                setError("Failed to load dashboard data. Please try refreshing.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [navigate]);

    // Check In Handler
    const handleCheckIn = async () => {
        try {
            setIsCheckingIn(true);
            await api.post("/my-attendance/check-in");
            setToast({ message: "Check-in successful!", type: "success" });

            // Refresh attendance data
            const { data } = await api.get("/my-attendance");
            const today = new Date().toISOString().split("T")[0];
            const todayRecord = data.find((record) => {
                const recordDate = new Date(record.date).toISOString().split("T")[0];
                return recordDate === today;
            });
            setAttendance(todayRecord || null);

        } catch (err) {
            const message = err?.response?.data?.message || "Failed to check in.";
            setToast({ message, type: "error" });
        } finally {
            setIsCheckingIn(false);
        }
    };

    // Check Out Handler
    const handleCheckOut = async () => {
        try {
            setIsCheckingOut(true);
            await api.post("/my-attendance/check-out");
            setToast({ message: "Check-out successful!", type: "success" });

            // Refresh attendance data
            const { data } = await api.get("/my-attendance");
            const today = new Date().toISOString().split("T")[0];
            const todayRecord = data.find((record) => {
                const recordDate = new Date(record.date).toISOString().split("T")[0];
                return recordDate === today;
            });
            setAttendance(todayRecord || null);

        } catch (err) {
            const message = err?.response?.data?.message || "Failed to check out.";
            setToast({ message, type: "error" });
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                <h2>Loading Dashboard...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
                <h2>Error</h2>
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        marginTop: "1rem",
                        padding: "8px 16px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    const todayDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Fallback for user name if userInfo is not yet set (though isLoading should prevent this)
    const displayName = userInfo?.name || user?.name || "Employee";
    const displayEmail = userInfo?.email || user?.email || "";

    return (
        <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Welcome Section */}
            <div
                style={{
                    marginBottom: "2rem",
                    padding: "1.5rem",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                }}
            >
                <h1 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "0.5rem", color: "#111827" }}>
                    Welcome, {displayName}!
                </h1>
                <p style={{ color: "#6b7280", marginBottom: "0.5rem" }}>
                    {displayEmail}
                </p>
                <p style={{ color: "#6b7280", fontSize: "14px" }}>{todayDate}</p>
            </div>

            {/* Attendance Section */}
            <div
                style={{
                    marginBottom: "2rem",
                    padding: "1.5rem",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
            >
                <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "1rem", color: "#111827" }}>
                    Today's Attendance
                </h2>

                {attendance ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "1rem",
                            marginBottom: "1.5rem",
                        }}
                    >
                        <div>
                            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "0.25rem" }}>
                                Check In
                            </p>
                            <p style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}>
                                {attendance.check_in || "N/A"}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "0.25rem" }}>
                                Check Out
                            </p>
                            <p style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}>
                                {attendance.check_out || "Not checked out"}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "0.25rem" }}>
                                Status
                            </p>
                            <p
                                style={{
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    color: attendance.status === "Present" ? "#10b981" : "#ef4444",
                                }}
                            >
                                {attendance.status || "N/A"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
                        No attendance record for today.
                    </p>
                )}

                {/* Check In/Out Buttons */}
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <button
                        onClick={handleCheckIn}
                        disabled={isCheckingIn || isCheckingOut || attendance?.check_in}
                        style={{
                            flex: "1",
                            minWidth: "150px",
                            padding: "12px 24px",
                            fontSize: "16px",
                            fontWeight: "500",
                            color: "white",
                            backgroundColor:
                                isCheckingIn || isCheckingOut || attendance?.check_in
                                    ? "#9ca3af"
                                    : "#10b981",
                            border: "none",
                            borderRadius: "8px",
                            cursor:
                                isCheckingIn || isCheckingOut || attendance?.check_in
                                    ? "not-allowed"
                                    : "pointer",
                            transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            if (!isCheckingIn && !isCheckingOut && !attendance?.check_in) {
                                e.target.style.backgroundColor = "#059669";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isCheckingIn && !isCheckingOut && !attendance?.check_in) {
                                e.target.style.backgroundColor = "#10b981";
                            }
                        }}
                    >
                        {isCheckingIn ? "Checking In..." : "Check In"}
                    </button>

                    <button
                        onClick={handleCheckOut}
                        disabled={
                            isCheckingIn ||
                            isCheckingOut ||
                            !attendance?.check_in ||
                            attendance?.check_out
                        }
                        style={{
                            flex: "1",
                            minWidth: "150px",
                            padding: "12px 24px",
                            fontSize: "16px",
                            fontWeight: "500",
                            color: "white",
                            backgroundColor:
                                isCheckingIn ||
                                    isCheckingOut ||
                                    !attendance?.check_in ||
                                    attendance?.check_out
                                    ? "#9ca3af"
                                    : "#3b82f6",
                            border: "none",
                            borderRadius: "8px",
                            cursor:
                                isCheckingIn ||
                                    isCheckingOut ||
                                    !attendance?.check_in ||
                                    attendance?.check_out
                                    ? "not-allowed"
                                    : "pointer",
                            transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            if (
                                !isCheckingIn &&
                                !isCheckingOut &&
                                attendance?.check_in &&
                                !attendance?.check_out
                            ) {
                                e.target.style.backgroundColor = "#2563eb";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (
                                !isCheckingIn &&
                                !isCheckingOut &&
                                attendance?.check_in &&
                                !attendance?.check_out
                            ) {
                                e.target.style.backgroundColor = "#3b82f6";
                            }
                        }}
                    >
                        {isCheckingOut ? "Checking Out..." : "Check Out"}
                    </button>
                </div>
            </div>

            {/* Announcements Section */}
            <div
                style={{
                    padding: "1.5rem",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
            >
                <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "1rem", color: "#111827" }}>
                    Latest Announcements
                </h2>

                {announcements.length > 0 ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                            gap: "1rem",
                        }}
                    >
                        {announcements.map((announcement) => (
                            <div
                                key={announcement.id}
                                style={{
                                    padding: "1rem",
                                    backgroundColor: "#f9fafb",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e7eb",
                                }}
                            >
                                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "0.5rem", color: "#1f2937" }}>
                                    {announcement.title || announcement.message?.substring(0, 50)}
                                </h3>
                                <p
                                    style={{
                                        fontSize: "14px",
                                        color: "#6b7280",
                                        marginBottom: "0.5rem",
                                        lineHeight: "1.5",
                                    }}
                                >
                                    {announcement.message || announcement.description}
                                </p>
                                {announcement.created_at && (
                                    <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                                        {new Date(announcement.created_at).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: "#6b7280" }}>No announcements available.</p>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
