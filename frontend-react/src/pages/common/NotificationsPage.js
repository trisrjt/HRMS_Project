import { useState, useEffect } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { timeAgo } from "../../utils/timeAgo";
import { useNavigate } from "react-router-dom";

const NotificationsPage = () => {
    const { notifications, fetchNotifications, markRead, markAllRead, loading } = useNotifications();
    const navigate = useNavigate();
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleItemClick = (notification) => {
        if (!notification.is_read) {
            markRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.message.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === "all") return true;
        if (filter === "unread") return !n.is_read;
        return n.type === filter;
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

    const getBorderColor = (type) => {
        switch (type) {
            case 'leave': return '#f59e0b';
            case 'attendance': return '#3b82f6';
            case 'hr-action': return '#8b5cf6';
            case 'admin-action': return '#10b981';
            case 'security': return '#ef4444';
            default: return '#6b7280';
        }
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>Notifications</h1>
                <button
                    onClick={markAllRead}
                    style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "500",
                        color: "#374151"
                    }}
                >
                    Mark All Read
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                {['all', 'unread', 'leave', 'attendance', 'hr-action', 'admin-action', 'security'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            border: "none",
                            backgroundColor: filter === f ? "#2563eb" : "#e5e7eb",
                            color: filter === f ? "white" : "#374151",
                            cursor: "pointer",
                            fontSize: "13px",
                            textTransform: "capitalize"
                        }}
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
                style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    marginBottom: "2rem",
                    fontSize: "14px"
                }}
            />

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {loading ? (
                    <p style={{ textAlign: "center", color: "#6b7280" }}>Loading...</p>
                ) : filteredNotifications.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#6b7280" }}>No notifications found.</p>
                ) : (
                    <>
                        {paginatedNotifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => handleItemClick(n)}
                                style={{
                                    backgroundColor: "white",
                                    padding: "1rem",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e7eb",
                                    borderLeft: `4px solid ${getBorderColor(n.type)}`,
                                    cursor: "pointer",
                                    opacity: n.is_read ? 0.7 : 1,
                                    transition: "transform 0.1s",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: 0 }}>
                                        {n.title}
                                        {!n.is_read && <span style={{ marginLeft: "0.5rem", fontSize: "10px", backgroundColor: "#ef4444", color: "white", padding: "2px 6px", borderRadius: "9999px" }}>NEW</span>}
                                    </h3>
                                    <span style={{ fontSize: "12px", color: "#6b7280" }}>{timeAgo(n.created_at)}</span>
                                </div>
                                <p style={{ color: "#4b5563", fontSize: "14px", margin: 0 }}>{n.message}</p>
                            </div>
                        ))}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    style={{
                                        padding: "0.5rem 1rem",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "6px",
                                        backgroundColor: currentPage === 1 ? "#f3f4f6" : "white",
                                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                        color: "#374151"
                                    }}
                                >
                                    Previous
                                </button>
                                <span style={{ display: "flex", alignItems: "center", padding: "0 1rem", color: "#374151" }}>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        padding: "0.5rem 1rem",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "6px",
                                        backgroundColor: currentPage === totalPages ? "#f3f4f6" : "white",
                                        cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                        color: "#374151"
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
