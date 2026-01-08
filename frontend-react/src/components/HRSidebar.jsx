import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ToggleSidebar from "./ui/ToggleSidebar";

const HRSidebar = () => {
    const { user, logout } = useAuth(); // Destructure user for permissions
    const navigate = useNavigate();

    const hasPermission = (permission) => {
        return user?.permissions?.includes(permission);
    };

    // Base Menu Items (Everyone has access)
    let menuItems = [
        { key: "dashboard", label: "Dashboard", to: "/hr/dashboard" },
        { key: "employees", label: "Employees", to: "/hr/employees" },
        { key: "departments", label: "Departments", to: "/hr/departments" },
        { key: "designations", label: "Designations", to: "/hr/designations" },
        { key: "attendance", label: "Attendance", to: "/hr/attendance" },
        { key: "leaves", label: "Leaves", to: "/hr/leaves" },
        { key: "holidays", label: "Holidays", to: "/hr/holidays" },
        { key: "policies", label: "Leave Policies", to: "/hr/leave-policies" },

        { key: "reviews", label: "Performance Reviews", to: "/hr/reviews" },
        { key: "documents", label: "Documents", to: "/hr/documents" },
        { key: "announcements", label: "Announcements", to: "/hr/announcements" },
    ];

    // Permission-based Additions
    if (hasPermission("can_manage_salaries") || hasPermission("can_view_salaries")) {
        menuItems.push({ key: "salaries", label: "Salaries", to: "/hr/salaries" });
        if (hasPermission("can_manage_salaries")) {
            menuItems.push({ key: "payroll-settings", label: "Payroll Settings", to: "/hr/payroll-settings" });
        }
    }

    if (hasPermission("can_manage_payslips")) {
        menuItems.push({ key: "payslips", label: "Payslips", to: "/hr/payslips" });
    }

    if (hasPermission("view_reports")) {
        menuItems.push({ key: "reports", label: "Reports", to: "/hr/reports" });
    }

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <ToggleSidebar
            title="HRMS"
            subtitle="HR Portal"
            menuItems={menuItems}
            onLogout={handleLogout}
        />
    );
};

export default HRSidebar;
