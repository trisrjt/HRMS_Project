import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const baseItems = [
  { key: "dashboard", label: "Dashboard", to: "/dashboard", roles: [1, 2, 3] },
  { key: "employees", label: "Employees", to: "/employees", roles: [1, 2, 3] },
  { key: "departments", label: "Departments", to: "/departments", roles: [1] },
  { key: "designations", label: "Designations", to: "/designations", roles: [1] },
  { key: "attendance", label: "Attendance", to: "/attendance", roles: [1, 2, 3] },
  { key: "leaves", label: "Leaves", to: "/leaves", roles: [1, 2, 3] },
  { key: "salaries", label: "Salaries", to: "/salaries", roles: [1, 2] },
  { key: "payslips", label: "Payslips", to: "/payslips", roles: [1, 2] },
  { key: "documents", label: "Documents", to: "/documents", roles: [1, 2, 3] },
  { key: "recruitment", label: "Recruitment", to: "/recruitment", roles: [1, 2, 3] },
  { key: "performance", label: "Performance Reviews", to: "/performance-reviews", roles: [1, 2] },
  { key: "announcements", label: "Announcements", to: "/announcements", roles: [1] },
  { key: "settings", label: "Settings", to: "/settings", roles: [1] },
];

const Sidebar = () => {
  const { user } = useAuth();
  const roleId = user?.role_id;

  const items = baseItems.filter((item) =>
    item.roles.includes(roleId)
  );

  return (
    <aside
      style={{
        width: "220px",
        minHeight: "100vh",
        borderRight: "1px solid #e5e7eb",
        padding: "1rem 0.5rem",
        boxSizing: "border-box",
      }}
    >
      <div style={{ padding: "0 0.75rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "bold" }}>HRMS</h2>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {items.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            style={({ isActive }) => ({
              padding: "0.5rem 0.75rem",
              borderRadius: "0.375rem",
              textDecoration: "none",
              color: isActive ? "#111827" : "#4b5563",
              backgroundColor: isActive ? "#e5e7eb" : "transparent",
              fontSize: "0.9rem",
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;


