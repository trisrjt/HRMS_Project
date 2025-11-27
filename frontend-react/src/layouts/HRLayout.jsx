import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HRSidebar from "../components/HRSidebar";
import NotificationBell from "../components/NotificationBell";

const HRLayout = ({ children }) => {
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
            }}
        >
            {/* Sidebar */}
            <div
                style={{
                    display: "none",
                }}
                className="sidebar-desktop"
            >
                <HRSidebar />
            </div>

            {/* Simple responsive: show sidebar always for now */}
            <HRSidebar />

            {/* Main area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Topbar */}
                <header
                    style={{
                        height: "56px",
                        borderBottom: "1px solid #e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 1rem",
                        boxSizing: "border-box",
                    }}
                >
                    <div>
                        <span style={{ fontWeight: "500" }}>Welcome, </span>
                        <span style={{ fontWeight: "600" }}>{user?.name || "HR"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <NotificationBell />
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: "0.35rem 0.75rem",
                                fontSize: "0.85rem",
                                borderRadius: "0.375rem",
                                border: "1px solid #e5e7eb",
                                backgroundColor: "#f9fafb",
                                cursor: "pointer",
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, padding: "1rem", boxSizing: "border-box" }}>{children}</main>
            </div>
        </div>
    );
};

export default HRLayout;
