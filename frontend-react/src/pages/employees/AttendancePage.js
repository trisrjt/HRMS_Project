import { useState, useEffect } from "react";
import api from "../../api/axios";
import { formatTime, calculateHours, calculateWeeklyStats } from "../../utils/dateUtils";

// --- UI Components ---

const Card = ({ children, style }) => (
    <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        ...style
    }}>
        {children}
    </div>
);

const CardHeader = ({ children }) => (
    <div style={{ padding: "1.5rem", borderBottom: "1px solid #e5e7eb" }}>
        {children}
    </div>
);

const CardContent = ({ children, style }) => (
    <div style={{ padding: "1.5rem", ...style }}>
        {children}
    </div>
);

const CardTitle = ({ children }) => (
    <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#111827", margin: 0 }}>
        {children}
    </h2>
);

const Button = ({ children, onClick, disabled, variant = "primary", style }) => {
    const baseStyle = {
        padding: "10px 20px",
        borderRadius: "6px",
        fontWeight: "500",
        fontSize: "14px",
        cursor: disabled ? "not-allowed" : "pointer",
        border: "none",
        transition: "background-color 0.2s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.7 : 1,
        ...style
    };

    const variants = {
        primary: { backgroundColor: "#3b82f6", color: "white" },
        success: { backgroundColor: "#10b981", color: "white" },
        outline: { backgroundColor: "transparent", border: "1px solid #d1d5db", color: "#374151" },
        destructive: { backgroundColor: "#ef4444", color: "white" }
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{ ...baseStyle, ...variants[variant] }}
        >
            {children}
        </button>
    );
};

const Alert = ({ children, variant = "error" }) => (
    <div style={{
        padding: "1rem",
        borderRadius: "6px",
        marginBottom: "1rem",
        backgroundColor: variant === "error" ? "#fef2f2" : "#ecfdf5",
        border: `1px solid ${variant === "error" ? "#fecaca" : "#a7f3d0"}`,
        color: variant === "error" ? "#991b1b" : "#065f46",
        fontSize: "14px"
    }}>
        {children}
    </div>
);

const Badge = ({ children, variant = "default" }) => {
    const styles = {
        default: { bg: "#f3f4f6", color: "#374151" },
        success: { bg: "#d1fae5", color: "#065f46" },
        danger: { bg: "#fee2e2", color: "#991b1b" },
        warning: { bg: "#fef3c7", color: "#92400e" },
        Present: { bg: "#d1fae5", color: "#065f46" },
        Absent: { bg: "#fee2e2", color: "#991b1b" },
        Late: { bg: "#fef3c7", color: "#92400e" }
    };

    const current = styles[variant] || styles.default;

    return (
        <span style={{
            padding: "2px 8px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: "500",
            backgroundColor: current.bg,
            color: current.color
        }}>
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
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Fetch Attendance Data
    const fetchAttendance = async () => {
        try {
            setError(null);
            const { data } = await api.get("/my-attendance");
            setAttendance(data);
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

    // Check In Handler
    const handleCheckIn = async () => {
        try {
            setIsCheckingIn(true);
            setActionError(null);
            await api.post("/my-attendance/check-in");
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

    const weeklyStats = calculateWeeklyStats(attendance);

    if (isLoading) {
        return (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                Loading attendance...
            </div>
        );
    }

    return (
        <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>

            {/* Header & Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827" }}>My Attendance</h1>

                    <div style={{ display: "flex", gap: "1rem" }}>
                        <Button
                            onClick={handleCheckIn}
                            disabled={isCheckingIn || isCheckedInToday}
                            variant="success"
                        >
                            {isCheckingIn ? "Checking In..." : "Check In"}
                        </Button>

                        <Button
                            onClick={handleCheckOut}
                            disabled={isCheckingOut || !isCheckedInToday || isCheckedOutToday}
                            variant="primary"
                        >
                            {isCheckingOut ? "Checking Out..." : "Check Out"}
                        </Button>
                    </div>
                </div>

                {/* Action Error Alert */}
                {actionError && (
                    <Alert variant="error">
                        <strong>Error:</strong> {actionError}
                    </Alert>
                )}

                {/* Main Error Alert */}
                {error && (
                    <Alert variant="error">
                        {error}
                    </Alert>
                )}
            </div>

            {/* Weekly Summary Row */}
            <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <span style={{ fontWeight: "600", color: "#374151", marginRight: "0.5rem" }}>This Week:</span>
                    {weeklyStats.hours === 0 && weeklyStats.minutes === 0 ? (
                        <span style={{ color: "#6b7280" }}>0h (No attendance this week)</span>
                    ) : (
                        <>
                            <span style={{ fontWeight: "700", color: "#111827", fontSize: "16px" }}>{weeklyStats.formatted}</span>
                            <span style={{ color: "#6b7280", fontSize: "14px", marginLeft: "0.5rem" }}>({weeklyStats.daysWorked} working days)</span>
                        </>
                    )}
                </div>
                {weeklyStats.daysWorked > 0 && (
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>
                        Daily Avg: <span style={{ fontWeight: "600", color: "#374151" }}>{weeklyStats.average}</span>
                    </div>
                )}
            </div>

            {/* Attendance List */}
            <Card>
                <CardHeader>
                    <CardTitle>Attendance History</CardTitle>
                </CardHeader>
                <CardContent style={{ padding: 0 }}>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead style={{ backgroundColor: "#f9fafb" }}>
                                <tr>
                                    <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Date</th>
                                    <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Check In</th>
                                    <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Check Out</th>
                                    <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Hours Worked</th>
                                    <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.length > 0 ? (
                                    attendance.map((record) => (
                                        <tr key={record.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                            <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827" }}>
                                                {new Date(record.date).toLocaleDateString("en-US", {
                                                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                                })}
                                            </td>
                                            <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827" }}>
                                                {formatTime(record.check_in, record.date)}
                                            </td>
                                            <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827" }}>
                                                {formatTime(record.check_out, record.date)}
                                            </td>
                                            <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827", fontWeight: "600" }}>
                                                {calculateHours(record.check_in, record.check_out)}
                                            </td>
                                            <td style={{ padding: "12px 16px", fontSize: "14px" }}>
                                                <Badge variant={record.status}>
                                                    {record.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>
                                            No attendance records found.
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
