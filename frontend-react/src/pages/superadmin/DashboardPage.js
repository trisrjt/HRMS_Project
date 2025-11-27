import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStats, getActivityLog, getSystemHealth } from "../../api/superadmin";
import { useAuth } from "../../context/AuthContext";

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

const StatCard = ({ title, value, icon, color, subtext }) => (
    <Card style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
            width: "50px", height: "50px", borderRadius: "12px",
            backgroundColor: `${color}20`, color: color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px"
        }}>
            {icon}
        </div>
        <div>
            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "0.25rem" }}>{title}</p>
            <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937", lineHeight: "1" }}>{value}</h3>
            {subtext && <p style={{ fontSize: "12px", color: color, marginTop: "0.25rem" }}>{subtext}</p>}
        </div>
    </Card>
);

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // State
    const [stats, setStats] = useState(null);
    const [activityLog, setActivityLog] = useState([]);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch Data
    const fetchData = async () => {
        try {
            const [statsData, activityData, healthData] = await Promise.all([
                getStats(),
                getActivityLog(),
                getSystemHealth()
            ]);
            setStats(statsData);
            setActivityLog(activityData);
            setHealth(healthData);
            setError(null);
        } catch (err) {
            console.error("Failed to load dashboard data", err);
            setError("Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 20000); // Auto-refresh every 20s
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) {
        return <div style={{ padding: "2rem", textAlign: "center" }}>Loading Dashboard...</div>;
    }

    if (error && !stats) {
        return <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>{error}</div>;
    }

    return (
        <div style={{ padding: "2rem", maxWidth: "1600px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#111827", marginBottom: "0.5rem" }}>
                        SuperAdmin Dashboard
                    </h1>
                    <p style={{ color: "#6b7280" }}>Welcome back, {user?.name} 👋</p>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <button
                        onClick={fetchData}
                        style={{
                            padding: "0.5rem 1rem", backgroundColor: "white", border: "1px solid #e5e7eb",
                            borderRadius: "8px", cursor: "pointer", fontWeight: "500"
                        }}
                    >
                        Refresh Data
                    </button>
                    <button style={{
                        padding: "0.5rem 1rem", backgroundColor: "#2563eb", color: "white", border: "none",
                        borderRadius: "8px", cursor: "pointer", fontWeight: "500"
                    }}>
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
                <StatCard title="Total Users" value={stats?.total_users || 0} icon="👥" color="#2563eb" subtext="+12% from last month" />
                <StatCard title="Total Employees" value={stats?.total_employees || 0} icon="👔" color="#059669" subtext="Active workforce" />
                <StatCard title="Departments" value={stats?.total_departments || 0} icon="🏢" color="#7c3aed" subtext="Across organization" />
                <StatCard title="Admins & HR" value={stats?.total_admins_and_hr || 0} icon="🛡️" color="#db2777" subtext="System managers" />
            </div>

            {/* Main Content Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>

                {/* Left Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

                    {/* Today's Snapshot */}
                    <Card>
                        <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "1.5rem" }}>Today's Snapshot</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                            <div style={{ textAlign: "center", padding: "1rem", backgroundColor: "#f3f4f6", borderRadius: "8px" }}>
                                <h4 style={{ fontSize: "24px", fontWeight: "700", color: "#059669" }}>{stats?.present_today || 0}</h4>
                                <p style={{ fontSize: "13px", color: "#6b7280" }}>Present</p>
                            </div>
                            <div style={{ textAlign: "center", padding: "1rem", backgroundColor: "#f3f4f6", borderRadius: "8px" }}>
                                <h4 style={{ fontSize: "24px", fontWeight: "700", color: "#d97706" }}>{stats?.on_leave_today || 0}</h4>
                                <p style={{ fontSize: "13px", color: "#6b7280" }}>On Leave</p>
                            </div>
                            <div style={{ textAlign: "center", padding: "1rem", backgroundColor: "#f3f4f6", borderRadius: "8px" }}>
                                <h4 style={{ fontSize: "24px", fontWeight: "700", color: "#dc2626" }}>{stats?.late_checkins || 0}</h4>
                                <p style={{ fontSize: "13px", color: "#6b7280" }}>Late</p>
                            </div>
                            <div style={{ textAlign: "center", padding: "1rem", backgroundColor: "#f3f4f6", borderRadius: "8px" }}>
                                <h4 style={{ fontSize: "24px", fontWeight: "700", color: "#2563eb" }}>{stats?.pending_leave_requests || 0}</h4>
                                <p style={{ fontSize: "13px", color: "#6b7280" }}>Pending Requests</p>
                            </div>
                        </div>
                    </Card>

                    {/* Feature Usage Stats */}
                    <Card>
                        <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "1.5rem" }}>System Utilization</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            {[
                                { label: "Attendance Module", value: 85, color: "#2563eb" },
                                { label: "Leave Management", value: 62, color: "#059669" },
                                { label: "Payroll Processing", value: 45, color: "#d97706" },
                                { label: "Announcements", value: 92, color: "#7c3aed" }
                            ].map((item) => (
                                <div key={item.label}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                        <span style={{ fontSize: "14px", fontWeight: "500" }}>{item.label}</span>
                                        <span style={{ fontSize: "14px", color: "#6b7280" }}>{item.value}%</span>
                                    </div>
                                    <div style={{ width: "100%", height: "8px", backgroundColor: "#f3f4f6", borderRadius: "4px", overflow: "hidden" }}>
                                        <div style={{ width: `${item.value}%`, height: "100%", backgroundColor: item.color, borderRadius: "4px" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                </div>

                {/* Right Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

                    {/* System Health */}
                    <Card>
                        <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "1.5rem" }}>System Health</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "14px", color: "#4b5563" }}>API Status</span>
                                <span style={{ fontSize: "12px", fontWeight: "600", color: health?.api_status === 'online' ? "#059669" : "red", backgroundColor: health?.api_status === 'online' ? "#d1fae5" : "#fee2e2", padding: "2px 8px", borderRadius: "12px" }}>
                                    {health?.api_status?.toUpperCase() || "UNKNOWN"}
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "14px", color: "#4b5563" }}>Database</span>
                                <span style={{ fontSize: "12px", fontWeight: "600", color: health?.database_status === 'connected' ? "#059669" : "red", backgroundColor: health?.database_status === 'connected' ? "#d1fae5" : "#fee2e2", padding: "2px 8px", borderRadius: "12px" }}>
                                    {health?.database_status?.toUpperCase() || "UNKNOWN"}
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "14px", color: "#4b5563" }}>Storage</span>
                                <span style={{ fontSize: "12px", fontWeight: "600", color: health?.storage_status === 'healthy' ? "#059669" : "orange", backgroundColor: health?.storage_status === 'healthy' ? "#d1fae5" : "#ffedd5", padding: "2px 8px", borderRadius: "12px" }}>
                                    {health?.storage_status?.toUpperCase() || "UNKNOWN"}
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "14px", color: "#4b5563" }}>Queue Worker</span>
                                <span style={{ fontSize: "12px", fontWeight: "600", color: health?.queue_status === 'running' ? "#059669" : "orange", backgroundColor: health?.queue_status === 'running' ? "#d1fae5" : "#ffedd5", padding: "2px 8px", borderRadius: "12px" }}>
                                    {health?.queue_status?.toUpperCase() || "UNKNOWN"}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Activity Feed */}
                    <Card style={{ flex: 1 }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "1.5rem" }}>Recent Activity</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            {activityLog.length === 0 ? (
                                <p style={{ color: "#6b7280", textAlign: "center" }}>No recent activity.</p>
                            ) : (
                                activityLog.map((log, index) => (
                                    <div key={index} style={{ display: "flex", gap: "1rem" }}>
                                        <div style={{
                                            width: "8px", height: "8px", borderRadius: "50%",
                                            backgroundColor: log.type === 'success' ? "#059669" : log.type === 'error' ? "#dc2626" : "#3b82f6",
                                            marginTop: "6px"
                                        }} />
                                        <div>
                                            <p style={{ fontSize: "14px", color: "#1f2937", marginBottom: "0.25rem" }}>{log.message}</p>
                                            <p style={{ fontSize: "12px", color: "#9ca3af" }}>{log.timestamp}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
