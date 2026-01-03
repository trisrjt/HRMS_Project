import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ToggleSidebar from "./ui/ToggleSidebar";

const EmployeeSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Check if user is a manager (assumes user object has is_manager flag from backend)
  const isManager = user?.is_manager || false;

  const menuItems = [
    { key: "dashboard", label: "Dashboard", to: "/employee/dashboard" },
    ...(isManager ? [{ key: "my-team", label: "My Team", to: "/employee/my-team" }] : []),
    { key: "profile", label: "My Profile", to: "/employee/profile" },
    { key: "attendance", label: "Attendance", to: "/employee/attendance" },
    { key: "leaves", label: "Leaves", to: "/employee/leaves" },
    { key: "salary", label: "Salary", to: "/employee/salary" },
    { key: "payslips", label: "Payslips", to: "/employee/payslips" },
    { key: "announcements", label: "Announcements", to: "/employee/announcements" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <ToggleSidebar
      title="HRMS"
      subtitle="Employee Portal"
      menuItems={menuItems}
      onLogout={handleLogout}
    />
  );
};

export default EmployeeSidebar;

