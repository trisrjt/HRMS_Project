import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HRSidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const menuItems = [
        { key: "dashboard", label: "Dashboard", to: "/hr/dashboard" },
        { key: "employees", label: "Employees", to: "/hr/employees" },
        { key: "attendance", label: "Attendance", to: "/hr/attendance" },
        { key: "leaves", label: "Leaves", to: "/hr/leaves" },
        { key: "recruitment", label: "Recruitment", to: "/hr/recruitment" },
    ];

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <aside
            style={{
                width: "240px",
                minHeight: "100vh",
                backgroundColor: "white",
                borderRight: "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
                boxShadow: "2px 0 4px rgba(0,0,0,0.05)",
            }}
        >
            <div style={{ padding: "1.5rem 1rem", borderBottom: "1px solid #e5e7eb", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1f2937" }}>HRMS</h2>
                <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "0.25rem" }}>HR Portal</p>
            </div>

            <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0 0.75rem" }}>
                {menuItems.map((item) => (
                    <NavLink
                        key={item.key}
                        to={item.to}
                        style={({ isActive }) => ({
                            padding: "0.75rem 1rem",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontSize: "14px",
                            fontWeight: isActive ? "600" : "500",
                            color: isActive ? "#3b82f6" : "#4b5563",
                            backgroundColor: isActive ? "#eff6ff" : "transparent",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                        })}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid #e5e7eb" }}>
                <button
                    onClick={handleLogout}
                    style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#dc2626",
                        backgroundColor: "transparent",
                        border: "1px solid #dc2626",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                >
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default HRSidebar;
