import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ToggleSidebar from "./ui/ToggleSidebar";

const SuperAdminSidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const menuItems = [
        { key: "dashboard", label: "Dashboard", to: "/superadmin/dashboard" },
        { key: "employees", label: "Employees", to: "/superadmin/employees" },
        { key: "departments", label: "Departments", to: "/superadmin/departments" },
        { key: "designations", label: "Designations", to: "/superadmin/designations" },
        { key: "attendance", label: "Attendance", to: "/superadmin/attendance" },
        { key: "leaves", label: "Leaves (Approvals)", to: "/superadmin/leaves" },
        { key: "holidays", label: "Holiday Calendar", to: "/superadmin/holidays" },
        { key: "leave-policies", label: "Leave Policies", to: "/superadmin/leave-policies" },

        { key: "salaries", label: "Salaries", to: "/superadmin/salaries" },
        { key: "payslips", label: "Payslips", to: "/superadmin/payslips" },
        { key: "payroll-settings", label: "Payroll Settings", to: "/superadmin/payroll-settings" },
        { key: "documents", label: "Documents", to: "/superadmin/documents" },

        { key: "performance-reviews", label: "Performance Reviews", to: "/superadmin/performance-reviews" },
        { key: "announcements", label: "Announcements", to: "/superadmin/announcements" },
        { key: "settings", label: "System Settings", to: "/superadmin/settings" },
        //{ key: "system-controls", label: "System Controls", to: "/superadmin/system-controls" },

        { key: "activity-log", label: "Activity Log", to: "/superadmin/activity-log" },
        { key: "users", label: "User Management", to: "/superadmin/users" },
        //{ key: "reports", label: "Reports / Analytics", to: "/superadmin/reports" },
    ];

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <ToggleSidebar
            title="HRMS"
            subtitle="Super Admin Portal"
            menuItems={menuItems}
            onLogout={handleLogout}
        />
    );
};

export default SuperAdminSidebar;
