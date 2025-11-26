import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EmployeeSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { key: "dashboard", label: "Dashboard", to: "/dashboard" },
    { key: "profile", label: "My Profile", to: "/profile" },
    { key: "attendance", label: "Attendance", to: "/attendance" },
    { key: "leaves", label: "Leaves", to: "/leaves" },
    { key: "salary", label: "Salary", to: "/salary" },
    { key: "payslips", label: "Payslips", to: "/payslips" },
    { key: "announcements", label: "Announcements", to: "/announcements" },
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
      {/* Logo/Brand */}
      <div
        style={{
          padding: "1.5rem 1rem",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1f2937" }}>
          HRMS
        </h2>
        <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "0.25rem" }}>
          Employee Portal
        </p>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          padding: "0 0.75rem",
        }}
      >
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
            onMouseEnter={(e) => {
              if (!e.target.style.backgroundColor.includes("eff6ff")) {
                e.target.style.backgroundColor = "#f3f4f6";
              }
            }}
            onMouseLeave={(e) => {
              if (!e.target.pathname.includes(window.location.pathname.split("/")[1])) {
                e.target.style.backgroundColor = "transparent";
              }
            }}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
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
    </aside>
  );
};

export default EmployeeSidebar;

