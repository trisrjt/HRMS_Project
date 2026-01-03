import { useState, useEffect } from "react";
import { useNotifications } from "../../../context/NotificationContext";
import { useAuth } from "../../../context/AuthContext"; // Import AuthContext
import { timeAgo } from "../../../utils/timeAgo";
import { useNavigate } from "react-router-dom";
import NotificationDetailModal from "../../../components/ui/NotificationDetailModal";

const NotificationsPage = () => {
    const { notifications, fetchNotifications, markRead, markAllRead, loading } = useNotifications();
    const { user } = useAuth(); // Get user from context
    const navigate = useNavigate();
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Determine Dashboard Path based on Role
    const getDashboardPath = () => {
        switch (user?.role_id) {
            case 1: return "/superadmin/dashboard";
            case 2: return "/admin/dashboard";
            case 3: return "/hr/dashboard";
            case 4: return "/employee/dashboard";
            default: return "/login";
        }
    };

    const [selectedNotification, setSelectedNotification] = useState(null);

    const handleItemClick = (notification) => {
        if (!notification.is_read) {
            markRead(notification.id);
        }

        // Logic for navigation vs modal
        // 1. If it's an announcement, navigate to announcements page
        if (notification.type === 'announcement' || notification.title.toLowerCase().includes('announcement')) {
            navigate("/employee/announcements");
            return;
        }

        // 2. Otherwise, open the detail modal (card)
        setSelectedNotification(notification);
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.message.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === "all") return true;
        if (filter === "unread") return !n.is_read;
        return n.type === filter;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
    const paginatedNotifications = filteredNotifications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo(0, 0);
        }
    };

    const getBorderColorClass = (type) => {
        switch (type) {
            case 'leave': return 'border-l-amber-500';
            case 'attendance': return 'border-l-blue-500';
            case 'hr-action': return 'border-l-violet-500';
            case 'admin-action': return 'border-l-emerald-500';
            case 'security': return 'border-l-red-500';
            default: return 'border-l-gray-500';
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <div className="mb-6">
                <button
                    onClick={() => navigate(getDashboardPath())}
                    className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to Dashboard
                </button>
            </div>

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                <button
                    onClick={markAllRead}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                    Mark All Read
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6 flex-wrap">
                {['all', 'unread', 'leave', 'attendance', 'hr-action', 'admin-action', 'security'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`
                            px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize
                            ${filter === f
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"}
                        `}
                    >
                        {f.replace('-', ' ')}
                    </button>
                ))}
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none mb-8 transition-colors shadow-sm"
            />

            {/* List */}
            <div className="flex flex-col gap-4">
                {loading ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</p>
                ) : filteredNotifications.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No notifications found.</p>
                ) : (
                    <>
                        {paginatedNotifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => handleItemClick(n)}
                                className={`
                                    bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 
                                    border-l-4 ${getBorderColorClass(n.type)} 
                                    cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5
                                    ${n.is_read ? 'opacity-75 dark:opacity-60' : 'opacity-100'}
                                `}
                            >
                                <div className="flex justify-between mb-2">
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white m-0 flex items-center gap-2">
                                        {n.title}
                                        {!n.is_read && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">NEW</span>}
                                    </h3>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(n.created_at)}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 m-0">{n.message}</p>
                            </div>
                        ))}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-8">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`
                                        px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium transition-colors
                                        ${currentPage === 1
                                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"}
                                    `}
                                >
                                    Previous
                                </button>
                                <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`
                                        px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium transition-colors
                                        ${currentPage === totalPages
                                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"}
                                    `}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Detail Modal */}
            <NotificationDetailModal
                isOpen={!!selectedNotification}
                onClose={() => setSelectedNotification(null)}
                notification={selectedNotification}
            />
        </div>
    );
};

export default NotificationsPage;
