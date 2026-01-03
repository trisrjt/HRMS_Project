import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SuperAdminSidebar from "../components/SuperAdminSidebar";
import NotificationBell from "../components/NotificationBell";
import ThemeToggle from "../components/ThemeToggle";

const SuperAdminLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Sidebar */}
            <div className="hidden md:block">
                <SuperAdminSidebar />
            </div>

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-gray-900 transition-colors duration-200">
                    <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Welcome, </span>
                        <span className="font-bold text-gray-900 dark:text-white">{user?.name || "Super Admin"}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <NotificationBell />
                        <button
                            onClick={handleLogout}
                            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 overflow-auto">{children}</main>
            </div>
        </div>
    );
};

export default SuperAdminLayout;
