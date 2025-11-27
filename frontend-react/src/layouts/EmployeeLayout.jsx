import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EmployeeSidebar from "../components/EmployeeSidebar";
import NotificationBell from "../components/NotificationBell";

const EmployeeLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                backgroundColor: "#f9fafb",
            }}
        >
            {/* Sidebar */}
            <EmployeeSidebar />

            {/* Main Content Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Top Bar */}
                <header
                    style={{
                        height: "64px",
                        backgroundColor: "white",
                        borderBottom: "1px solid #e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 1.5rem",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                >
                    <div>
                        <span style={{ fontSize: "16px", color: "#6b7280" }}>Welcome, </span>
                        <span style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937" }}>
                            {user?.name || "Employee"}
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <NotificationBell />
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: "0.5rem 1rem",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#dc2626",
                                backgroundColor: "transparent",
                                border: "1px solid #dc2626",
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#dc2626";
                                e.target.style.color = "white";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "transparent";
                                e.target.style.color = "#dc2626";
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main style={{ flex: 1, overflowY: "auto", backgroundColor: "#f9fafb" }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default EmployeeLayout;
