import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ToggleSidebar from "./ui/ToggleSidebar";

const AdminSidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const hasPermission = (permission) => {
        // SuperAdmin (Role 1) has all permissions
        if (user?.role_id === 1) return true;
        // Admin (Role 2) has basic access, check specific flags
        return user?.role_id === 2 || user?.permissions?.includes(permission);
    };

    // Base Menu Items (Matching HR Sidebar)
    let menuItems = [
        { key: "dashboard", label: "Dashboard", to: "/admin/dashboard" },
        { key: "employees", label: "Employees", to: "/admin/employees" },
        { key: "departments", label: "Departments", to: "/admin/departments" },
        { key: "designations", label: "Designations", to: "/admin/designations" },
        { key: "attendance", label: "Attendance", to: "/admin/attendance" },
        { key: "leaves", label: "Leaves", to: "/admin/leaves" },
        { key: "holidays", label: "Holidays", to: "/admin/holidays" },
        { key: "policies", label: "Leave Policies", to: "/admin/leave-policies" },
        { key: "recruitment", label: "Recruitment", to: "/admin/recruitment" },
        { key: "announcements", label: "Announcements", to: "/admin/announcements" },
        // Explicitly EXCLUDING System Settings and User Management
    ];

    // Permission-based Additions (Salary & Payslips)
    // Admin (Role 2) or anyone with permission can access
    if (user?.role_id === 2 || hasPermission("can_manage_salaries") || hasPermission("can_view_salaries")) {
        menuItems.push({ key: "salaries", label: "Salaries", to: "/admin/salaries" });
        // Payroll Settings hidden for Admin usually, but if needed:
        // if (hasPermission("can_manage_salaries")) {
        //    menuItems.push({ key: "payroll-settings", label: "Payroll Settings", to: "/admin/payroll-settings" });
        // }
    }

    if (user?.role_id === 2 || hasPermission("can_manage_payslips")) {
        menuItems.push({ key: "payslips", label: "Payslips", to: "/admin/payslips" });
    }

    // Documents (was in old Admin list, keeping for parity if HR has it, but HR list didn't show it explicitly above. 
    // Assuming HR might have it or user wants exact match involving "others all can do". 
    // However, user said "same sidebar like hr", and HR source didn't show "Documents". 
    // Creating "Documents" route mapping in AdminSidebar just in case, but sticking to HR list primarily.
    // user said "others all can do", implying full feature set except restricted ones.
    // I will add Documents if it exists in SuperAdmin to be safe, or just stick to HR parity.)
    // HR Sidebar source above: Dashboard, Employees, Designations, Attendance, Leaves, Holidays, Policies, Recruitment, Announcements, Salaries, Payslips, Reports.
    // Documents is NOT in HR Sidebar source. So I will omit it to be "same like hr".

    if (hasPermission("view_reports")) {
        menuItems.push({ key: "reports", label: "Reports", to: "/admin/reports" });
    }

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <ToggleSidebar
            title="HRMS"
            subtitle="Admin Portal"
            menuItems={menuItems}
            onLogout={handleLogout}
        />
    );
};

export default AdminSidebar;
