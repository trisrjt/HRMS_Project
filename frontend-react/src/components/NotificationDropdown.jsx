import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../utils/timeAgo";

const NotificationDropdown = ({ onClose, onSelect }) => {
    const { notifications, fetchNotifications, markRead, markAllRead, loading } = useNotifications();
    const { user } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const handleItemClick = (notification) => {
        if (!notification.is_read) {
            markRead(notification.id);
        }
        // Instead of navigating, pass to parent to open modal
        if (onSelect) {
            onSelect(notification);
        }
        onClose();
    };

    const handleViewAll = () => {
        if (user?.role_id === 1) {
            navigate("/superadmin/notifications");
        } else if (user?.role_id === 4) {
            navigate("/employee/notifications");
        } else if (user?.role_id === 2) {
            navigate("/admin/notifications");
        } else if (user?.role_id === 3) {
            navigate("/hr/notifications");
        }
        onClose();
    };

    const getBorderColorClass = (type) => {
        switch (type) {
            case 'leave': return 'border-l-amber-500'; // Orange
            case 'attendance': return 'border-l-blue-500'; // Blue
            case 'hr-action': return 'border-l-violet-500'; // Purple
            case 'admin-action': return 'border-l-emerald-500'; // Green
            case 'security': return 'border-l-red-500'; // Red
            default: return 'border-l-gray-500'; // Gray
        }
    };

    return (
        <div
            ref={dropdownRef}
            className="absolute top-12 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 flex flex-col max-h-[480px] transition-colors duration-200"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white m-0">Notifications</h3>
                <button
                    onClick={markAllRead}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline bg-transparent border-none cursor-pointer"
                >
                    Mark all read
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications</div>
                ) : (
                    notifications.slice(0, 10).map((n) => (
                        <div
                            key={n.id}
                            onClick={() => handleItemClick(n)}
                            className={`
                                p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors duration-200
                                ${n.is_read ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/30'}
                                ${!n.is_read ? `border-l-4 ${getBorderColorClass(n.type)}` : 'border-l-4 border-l-transparent'}
                                hover:bg-gray-50 dark:hover:bg-gray-700/50
                            `}
                        >
                            <div className="flex justify-between mb-1">
                                <span className={`text-sm ${n.is_read ? 'font-medium text-gray-700 dark:text-gray-300' : 'font-bold text-gray-900 dark:text-white'}`}>
                                    {n.title}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(n.created_at)}</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 m-0 leading-snug">
                                {n.message}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                <button
                    onClick={handleViewAll}
                    className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                    View All Notifications
                </button>
            </div>
        </div>
    );
};

export default NotificationDropdown;
