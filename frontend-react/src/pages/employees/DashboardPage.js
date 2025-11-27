import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { formatTime, calculateHours, calculateWeeklyStats, calculateMonthlyStats } from "../../utils/dateUtils";

// --- UI Components ---

const Card = ({ children, style, className }) => (
    <div
        className={className}
        style={{
            backgroundColor: "white",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            padding: "1.5rem",
            ...style
        }}
    >
        {children}
    </div>
);

const SectionTitle = ({ children }) => (
    <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "1rem" }}>
        {children}
    </h3>
);

const Badge = ({ children, variant = "default" }) => {
    const styles = {
        default: { bg: "#f3f4f6", color: "#374151" },
        success: { bg: "#d1fae5", color: "#065f46" }, // Approved, Present
        danger: { bg: "#fee2e2", color: "#991b1b" },  // Rejected, Absent
        warning: { bg: "#fef3c7", color: "#92400e" }, // Pending, Late
        primary: { bg: "#dbeafe", color: "#1e40af" }
    };

    let style = styles.default;
    if (["Approved", "Present"].includes(variant)) style = styles.success;
    if (["Rejected", "Absent"].includes(variant)) style = styles.danger;
    if (["Pending", "Late"].includes(variant)) style = styles.warning;

    return (
        <span style={{
            padding: "2px 10px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: "600",
            backgroundColor: style.bg,
            color: style.color
        }}>
            {children}
        </span>
    );
};

const Button = ({ children, onClick, disabled, variant = "primary", style }) => {
    const baseStyle = {
        padding: "10px 20px",
        borderRadius: "8px",
        fontWeight: "500",
        fontSize: "14px",
        cursor: disabled ? "not-allowed" : "pointer",
        border: "none",
        transition: "all 0.2s",
        opacity: disabled ? 0.7 : 1,
        ...style
    };

    const variants = {
        primary: { backgroundColor: "#3b82f6", color: "white" },
        success: { backgroundColor: "#10b981", color: "white" },
        danger: { backgroundColor: "#ef4444", color: "white" }
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

// --- Main Component ---

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [data, setData] = useState({
        profile: null,
        attendance: null,
        announcements: [],
        leaves: [],
        announcements: [],
        leaves: [],
        payslips: [],
        payslips: [],
        weeklyStats: null,
        monthlyStats: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all dashboard data
    const fetchDashboardData = async () => {
        try {
            // 1. Profile
            const profileRes = await api.get("/user");

            // 2. Attendance (Today)
            const attendanceRes = await api.get("/my-attendance");
            const today = new Date().toISOString().split("T")[0];
            const todayRecord = Array.isArray(attendanceRes.data)
                ? attendanceRes.data.find(r => r.date === today)
                : null;

            // Calculate Weekly Stats
            const weeklyStats = calculateWeeklyStats(attendanceRes.data);

            // Calculate Monthly Stats (Current Month)
            const currentMonth = today.substring(0, 7); // YYYY-MM
            const monthlyStats = calculateMonthlyStats(attendanceRes.data, currentMonth);

            // 3. Announcements
            const announcementsRes = await api.get("/announcements");

            // 4. Leaves
            const leavesRes = await api.get("/my-leaves");

            // 5. Payslips
            const payslipsRes = await api.get("/my-payslips");

            setData({
                profile: profileRes.data,
                attendance: todayRecord,
                announcements: Array.isArray(announcementsRes.data) ? announcementsRes.data.slice(0, 5) : [],
                leaves: Array.isArray(leavesRes.data) ? leavesRes.data.slice(0, 5) : [],
                leaves: Array.isArray(leavesRes.data) ? leavesRes.data.slice(0, 5) : [],
                payslips: Array.isArray(payslipsRes.data) ? payslipsRes.data.slice(0, 3) : [],
                payslips: Array.isArray(payslipsRes.data) ? payslipsRes.data.slice(0, 3) : [],
                weeklyStats,
                monthlyStats
            });
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            setError("Failed to load dashboard data.");
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
            // Refresh data to show updated status
            await fetchDashboardData();
        } catch (err) {
            alert(err?.response?.data?.message || `Failed to ${type}`);
        } finally {
            setActionLoading(false);
        }
    };

    // Derived State for Leaves Summary
    const leaveStats = {
        pending: data.leaves.filter(l => l.status === "Pending").length,
        approved: data.leaves.filter(l => l.status === "Approved").length,
        rejected: data.leaves.filter(l => l.status === "Rejected").length
    };

    if (isLoading) {
        return (
            <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: "500" }}>Loading Dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>
                <div>{error}</div>
                <Button onClick={fetchDashboardData} style={{ marginTop: "1rem" }}>Retry</Button>
            </div>
        );
    }

    const { profile, attendance, weeklyStats, monthlyStats, announcements, leaves, payslips } = data;
    const isCheckedIn = !!attendance?.check_in;
    const isCheckedOut = !!attendance?.check_out;

    return (
        <div style={{ padding: "1.5rem", maxWidth: "1400px", margin: "0 auto" }}>

            {/* 1. Welcome Card & 2. Attendance Card */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>

                {/* Welcome Card */}
                <Card style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "white", border: "none" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "0.5rem" }}>
                        Hello, {profile?.name || "Employee"}!
                    </h2>
                    <div style={{ opacity: 0.9, fontSize: "15px", lineHeight: "1.6" }}>
                        <p>Department: <strong>{profile?.employee?.department?.name || "N/A"}</strong></p>
                        <p>Designation: <strong>{profile?.employee?.designation?.name || profile?.employee?.designation || "N/A"}</strong></p>
                    </div>
                    <div style={{ marginTop: "1.5rem", fontSize: "14px", opacity: 0.8 }}>
                        {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </Card>

                {/* Attendance Card */}
                <Card>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <SectionTitle>Today's Attendance</SectionTitle>
                            <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "1rem" }}>
                                Status: <Badge variant={attendance?.status || "Absent"}>{attendance?.status || "Not Marked"}</Badge>
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "13px", color: "#6b7280" }}>Check In</div>
                            <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "0.5rem" }}>{formatTime(attendance?.check_in, attendance?.date)}</div>
                            <div style={{ fontSize: "13px", color: "#6b7280" }}>Check Out</div>
                            <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "0.5rem" }}>{formatTime(attendance?.check_out, attendance?.date)}</div>
                            <div style={{ fontSize: "13px", color: "#6b7280" }}>Hours Worked</div>
                            <div style={{ fontSize: "16px", fontWeight: "600" }}>{calculateHours(attendance?.check_in, attendance?.check_out)}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: "1.5rem" }}>
                        {!isCheckedIn ? (
                            <Button
                                onClick={() => handleAttendanceAction("check-in")}
                                disabled={actionLoading}
                                variant="success"
    );
};

                        const Button = ({children, onClick, disabled, variant = "primary", style}) => {
    const baseStyle = {
                            padding: "10px 20px",
                        borderRadius: "8px",
                        fontWeight: "500",
                        fontSize: "14px",
                        cursor: disabled ? "not-allowed" : "pointer",
                        border: "none",
                        transition: "all 0.2s",
                        opacity: disabled ? 0.7 : 1,
                        ...style
    };

                        const variants = {
                            primary: {backgroundColor: "#3b82f6", color: "white" },
                        success: {backgroundColor: "#10b981", color: "white" },
                        danger: {backgroundColor: "#ef4444", color: "white" }
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

// --- Main Component ---

const DashboardPage = () => {
    const {user} = useAuth();
                        const navigate = useNavigate();

                        const [data, setData] = useState({
                            profile: null,
                        attendance: null,
                        announcements: [],
                        leaves: [],
                        announcements: [],
                        leaves: [],
                        payslips: [],
                        payslips: [],
                        weeklyStats: null,
                        monthlyStats: null
    });
                        const [isLoading, setIsLoading] = useState(true);
                        const [actionLoading, setActionLoading] = useState(false);
                        const [error, setError] = useState(null);

    // Fetch all dashboard data
    const fetchDashboardData = async () => {
        try {
            // 1. Profile
            const profileRes = await api.get("/user");

                        // 2. Attendance (Today)
                        const attendanceRes = await api.get("/my-attendance");
                        const today = new Date().toISOString().split("T")[0];
                        const todayRecord = Array.isArray(attendanceRes.data)
                ? attendanceRes.data.find(r => r.date === today)
                        : null;

                        // Calculate Weekly Stats
                        const weeklyStats = calculateWeeklyStats(attendanceRes.data);

                        // Calculate Monthly Stats (Current Month)
                        const currentMonth = today.substring(0, 7); // YYYY-MM
                        const monthlyStats = calculateMonthlyStats(attendanceRes.data, currentMonth);

                        // 3. Announcements
                        const announcementsRes = await api.get("/announcements");

                        // 4. Leaves
                        const leavesRes = await api.get("/my-leaves");

                        // 5. Payslips
                        const payslipsRes = await api.get("/my-payslips");

                        setData({
                            profile: profileRes.data,
                        attendance: todayRecord,
                        announcements: Array.isArray(announcementsRes.data) ? announcementsRes.data.slice(0, 5) : [],
                        leaves: Array.isArray(leavesRes.data) ? leavesRes.data.slice(0, 5) : [],
                        leaves: Array.isArray(leavesRes.data) ? leavesRes.data.slice(0, 5) : [],
                        payslips: Array.isArray(payslipsRes.data) ? payslipsRes.data.slice(0, 3) : [],
                        payslips: Array.isArray(payslipsRes.data) ? payslipsRes.data.slice(0, 3) : [],
                        weeklyStats,
                        monthlyStats
            });
        } catch (err) {
                            console.error("Dashboard fetch error:", err);
                        setError("Failed to load dashboard data.");
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
                        // Refresh data to show updated status
                        await fetchDashboardData();
        } catch (err) {
                            alert(err?.response?.data?.message || `Failed to ${type}`);
        } finally {
                            setActionLoading(false);
        }
    };

                        // Derived State for Leaves Summary
                        const leaveStats = {
                            pending: data.leaves.filter(l => l.status === "Pending").length,
        approved: data.leaves.filter(l => l.status === "Approved").length,
        rejected: data.leaves.filter(l => l.status === "Rejected").length
    };

                        if (isLoading) {
        return (
                        <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>
                            <div style={{ fontSize: "1.2rem", fontWeight: "500" }}>Loading Dashboard...</div>
                        </div>
                        );
    }

                        if (error) {
        return (
                        <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>
                            <div>{error}</div>
                            <Button onClick={fetchDashboardData} style={{ marginTop: "1rem" }}>Retry</Button>
                        </div>
                        );
    }

                        const {profile, attendance, weeklyStats, monthlyStats, announcements, leaves, payslips} = data;
                        const isCheckedIn = !!attendance?.check_in;
                        const isCheckedOut = !!attendance?.check_out;

                        return (
                        <div style={{ padding: "1.5rem", maxWidth: "1400px", margin: "0 auto" }}>

                            {/* 1. Welcome Card & 2. Attendance Card */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>

                                {/* Welcome Card */}
                                <Card style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "white", border: "none" }}>
                                    <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "0.5rem" }}>
                                        Hello, {profile?.name || "Employee"}!
                                    </h2>
                                    <div style={{ opacity: 0.9, fontSize: "15px", lineHeight: "1.6" }}>
                                        <p>Department: <strong>{profile?.employee?.department?.name || "N/A"}</strong></p>
                                        <p>Designation: <strong>{profile?.employee?.designation?.name || profile?.employee?.designation || "N/A"}</strong></p>
                                    </div>
                                    <div style={{ marginTop: "1.5rem", fontSize: "14px", opacity: 0.8 }}>
                                        {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                </Card>

                                {/* Attendance Card */}
                                <Card>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div>
                                            <SectionTitle>Today's Attendance</SectionTitle>
                                            <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "1rem" }}>
                                                Status: <Badge variant={attendance?.status || "Absent"}>{attendance?.status || "Not Marked"}</Badge>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: "13px", color: "#6b7280" }}>Check In</div>
                                            <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "0.5rem" }}>{formatTime(attendance?.check_in, attendance?.date)}</div>
                                            <div style={{ fontSize: "13px", color: "#6b7280" }}>Check Out</div>
                                            <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "0.5rem" }}>{formatTime(attendance?.check_out, attendance?.date)}</div>
                                            <div style={{ fontSize: "13px", color: "#6b7280" }}>Hours Worked</div>
                                            <div style={{ fontSize: "16px", fontWeight: "600" }}>{calculateHours(attendance?.check_in, attendance?.check_out)}</div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: "1.5rem" }}>
                                        {!isCheckedIn ? (
                                            <Button
                                                onClick={() => handleAttendanceAction("check-in")}
                                                disabled={actionLoading}
                                                variant="success"
                                                style={{ width: "100%" }}
                                            >
                                                {actionLoading ? "Processing..." : "Check In Now"}
                                            </Button>
                                        ) : !isCheckedOut ? (
                                            <Button
                                                onClick={() => handleAttendanceAction("check-out")}
                                                disabled={actionLoading}
                                                variant="danger"
                                                style={{ width: "100%" }}
                                            >
                                                {actionLoading ? "Processing..." : "Check Out Now"}
                                            </Button>
                                        ) : (
                                            <div style={{ textAlign: "center", padding: "10px", backgroundColor: "#f3f4f6", borderRadius: "8px", color: "#374151", fontSize: "14px", fontWeight: "500" }}>
                                                Shift Completed
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Weekly Summary Card */}
                                <Card>
                                    <SectionTitle>Weekly Hours</SectionTitle>
                                    <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "1rem" }}>Mon – Sun</div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ color: "#4b5563", fontSize: "14px" }}>Total Hours</span>
                                            <span style={{ fontSize: "18px", fontWeight: "700", color: "#111827" }}>
                                                {weeklyStats?.formatted || "0h 0m"}
                                            </span>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ color: "#4b5563", fontSize: "14px" }}>Days Worked</span>
                                            <span style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                                                {weeklyStats?.daysWorked || 0} of 7
                                            </span>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ color: "#4b5563", fontSize: "14px" }}>Daily Average</span>
                                            <span style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                                                {weeklyStats?.average || "0h 0m"}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: "1.5rem", padding: "0.75rem", backgroundColor: "#f9fafb", borderRadius: "8px", fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
                                        Keep up the good work!
                                    </div>
                                </Card>

                                {/* Monthly Summary Card */}
                                <Card>
                                    <SectionTitle>Monthly Hours</SectionTitle>
                                    <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "1rem" }}>
                                        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ color: "#4b5563", fontSize: "14px" }}>Total Hours</span>
                                            <span style={{ fontSize: "18px", fontWeight: "700", color: "#111827" }}>
                                                {monthlyStats?.formatted || "0h 0m"}
                                            </span>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ color: "#4b5563", fontSize: "14px" }}>Working Days</span>
                                            <span style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                                                {monthlyStats?.daysWorked || 0}
                                            </span>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ color: "#4b5563", fontSize: "14px" }}>Daily Average</span>
                                            <span style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                                                {monthlyStats?.average || "0h 0m"}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: "1.5rem", padding: "0.75rem", backgroundColor: "#f9fafb", borderRadius: "8px", fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
                                        {monthlyStats?.daysWorked > 0 ? "Great progress this month!" : "No attendance recorded yet."}
                                    </div>
                                </Card>
                            </div>

                            {/* 3. Leaves Summary & 5. Payslips */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>

                                {/* Leaves Summary */}
                                <Card>
                                    <SectionTitle>Leaves Overview</SectionTitle>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", textAlign: "center" }}>
                                        <div style={{ padding: "1rem", backgroundColor: "#fff7ed", borderRadius: "8px", border: "1px solid #ffedd5" }}>
                                            <div style={{ fontSize: "24px", fontWeight: "700", color: "#9a3412" }}>{leaveStats.pending}</div>
                                            <div style={{ fontSize: "13px", color: "#9a3412", fontWeight: "500" }}>Pending</div>
                                        </div>
                                        <div style={{ padding: "1rem", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #dcfce7" }}>
                                            <div style={{ fontSize: "24px", fontWeight: "700", color: "#166534" }}>{leaveStats.approved}</div>
                                            <div style={{ fontSize: "13px", color: "#166534", fontWeight: "500" }}>Approved</div>
                                        </div>
                                        <div style={{ padding: "1rem", backgroundColor: "#fef2f2", borderRadius: "8px", border: "1px solid #fee2e2" }}>
                                            <div style={{ fontSize: "24px", fontWeight: "700", color: "#991b1b" }}>{leaveStats.rejected}</div>
                                            <div style={{ fontSize: "13px", color: "#991b1b", fontWeight: "500" }}>Rejected</div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: "1rem", textAlign: "center" }}>
                                        <span
                                            onClick={() => navigate("/leaves")}
                                            style={{ fontSize: "14px", color: "#3b82f6", cursor: "pointer", fontWeight: "500" }}
                                        >
                                            View All Leaves →
                                        </span>
                                    </div>
                                </Card>

                                {/* Latest Payslips */}
                                <Card>
                                    <SectionTitle>Recent Payslips</SectionTitle>
                                    {payslips.length > 0 ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                            {payslips.map(payslip => (
                                                <div key={payslip.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                                                    <div>
                                                        <div style={{ fontWeight: "600", fontSize: "14px", color: "#374151" }}>
                                                            {new Date(0, payslip.month - 1).toLocaleString('default', { month: 'long' })} {payslip.year}
                                                        </div>
                                                        <div style={{ fontSize: "12px", color: "#6b7280" }}>Generated: {new Date(payslip.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                    <div style={{ fontWeight: "700", color: "#059669" }}>
                                                        ${Number(payslip.net_pay).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ color: "#6b7280", fontSize: "14px", textAlign: "center", padding: "1rem" }}>No payslips found</div>
                                    )}
                                    <div style={{ marginTop: "1rem", textAlign: "center" }}>
                                        <span
                                            onClick={() => navigate("/payslips")}
                                            style={{ fontSize: "14px", color: "#3b82f6", cursor: "pointer", fontWeight: "500" }}
                                        >
                                            View All Payslips →
                                        </span>
                                    </div>
                                </Card>
                            </div>

                            {/* 4. Latest Leaves Table & 6. Announcements */}
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", alignItems: "start" }}>

                                {/* Latest Leaves Table */}
                                <Card>
                                    <SectionTitle>Recent Leave Applications</SectionTitle>
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                            <thead>
                                                <tr style={{ borderBottom: "2px solid #f3f4f6", textAlign: "left" }}>
                                                    <th style={{ padding: "0.75rem", color: "#6b7280", fontWeight: "600" }}>Type</th>
                                                    <th style={{ padding: "0.75rem", color: "#6b7280", fontWeight: "600" }}>Dates</th>
                                                    <th style={{ padding: "0.75rem", color: "#6b7280", fontWeight: "600" }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leaves.length > 0 ? (
                                                    leaves.map(leave => (
                                                        <tr key={leave.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                            <td style={{ padding: "0.75rem", fontWeight: "500", color: "#374151" }}>{leave.leave_type?.name || "Leave"}</td>
                                                            <td style={{ padding: "0.75rem", color: "#6b7280" }}>
                                                                {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                                            </td>
                                                            <td style={{ padding: "0.75rem" }}>
                                                                <Badge variant={leave.status}>{leave.status}</Badge>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="3" style={{ padding: "1.5rem", textAlign: "center", color: "#6b7280" }}>No recent leave applications</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                {/* Latest Announcements */}
                                <Card>
                                    <SectionTitle>Announcements</SectionTitle>
                                    {announcements.length > 0 ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                            {announcements.map(announcement => (
                                                <div key={announcement.id} style={{ paddingBottom: "1rem", borderBottom: "1px solid #f3f4f6" }}>
                                                    <div style={{ fontWeight: "600", fontSize: "14px", color: "#1f2937", marginBottom: "0.25rem" }}>
                                                        {announcement.title}
                                                    </div>
                                                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                                                        {new Date(announcement.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ color: "#6b7280", fontSize: "14px", textAlign: "center", padding: "1rem" }}>No announcements</div>
                                    )}
                                    <div style={{ marginTop: "1rem", textAlign: "center" }}>
                                        <span
                                            onClick={() => navigate("/announcements")}
                                            style={{ fontSize: "14px", color: "#3b82f6", cursor: "pointer", fontWeight: "500" }}
                                        >
                                            View All →
                                        </span>
                                    </div>
                                </Card>
                            </div>

                        </div>
                        );
};

                        export default DashboardPage;
