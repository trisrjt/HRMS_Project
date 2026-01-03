import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const baseItems = [
  { key: "dashboard", label: "Dashboard", to: "/dashboard", roles: [1, 2, 3, 4] },
  { key: "profile", label: "My Profile", to: "/profile", roles: [1, 2, 3, 4] },
  { key: "employees", label: "Employees", to: "/employees", roles: [1, 2, 3] },
  { key: "departments", label: "Departments", to: "/departments", roles: [1] },
  { key: "designations", label: "Designations", to: "/designations", roles: [1] },
  { key: "attendance", label: "Attendance", to: "/attendance", roles: [1, 2, 3, 4] },
  { key: "leaves", label: "Leaves", to: "/leaves", roles: [1, 2, 3, 4] },
  { key: "salaries", label: "Salaries", to: "/salaries", roles: [1, 2, 4] },
  { key: "payslips", label: "Payslips", to: "/payslips", roles: [1, 2, 4] },
  { key: "documents", label: "Documents", to: "/documents", roles: [1, 2, 3] },
  { key: "recruitment", label: "Recruitment", to: "/recruitment", roles: [1, 2, 3] },
  { key: "performance", label: "Performance Reviews", to: "/performance-reviews", roles: [1, 2] },
  { key: "announcements", label: "Announcements", to: "/announcements", roles: [1, 4] },
  { key: "settings", label: "Settings", to: "/settings", roles: [1] },
];

const Sidebar = () => {
  const { user } = useAuth();
  const roleId = user?.role_id;

  const items = baseItems.filter((item) =>
    item.roles.includes(roleId)
  );

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 transition-colors duration-200">
      <div className="px-3 mb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">HRMS</h2>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            className={({ isActive }) => `
              px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
              ${isActive
                ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"}
            `}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;


