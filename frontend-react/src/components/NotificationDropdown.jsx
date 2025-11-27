import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { timeAgo } from "../utils/timeAgo";

const NotificationDropdown = ({ onClose }) => {
    const { notifications, fetchNotifications, markRead, markAllRead, loading } = useNotifications();
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
        if (notification.link) {
            navigate(notification.link);
            onClose();
        }
    };

    const handleViewAll = () => {
        navigate("/notifications");
        onClose();
    };

    const getBorderColor = (type) => {
        switch (type) {
            case 'leave': return '#f59e0b'; // Orange
            case 'attendance': return '#3b82f6'; // Blue
            case 'hr-action': return '#8b5cf6'; // Purple
            case 'admin-action': return '#10b981'; // Green
            case 'security': return '#ef4444'; // Red
            default: return '#6b7280'; // Gray
        }
    };

    return (
        <div
            ref={dropdownRef}
            style={{
                position: "absolute",
                top: "50px",
                right: "0",
                width: "320px",
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                border: "1px solid #e5e7eb",
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                maxHeight: "480px"
            }}
        >
            {/* Header */}
            <div style={{
                padding: "1rem",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>Notifications</h3>
                <button
                    onClick={markAllRead}
                    style={{
                        fontSize: "12px",
                        color: "#2563eb",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline"
                    }}
                >
                    Mark all read
                </button>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto" }}>
                {loading ? (
                    <div style={{ padding: "1rem", textAlign: "center", color: "#6b7280" }}>Loading...</div>
                ) : notifications.length === 0 ? (
                    <div style={{ padding: "1rem", textAlign: "center", color: "#6b7280" }}>No notifications</div>
                ) : (
                    notifications.slice(0, 10).map((n) => (
                        <div
                            key={n.id}
                            onClick={() => handleItemClick(n)}
                            style={{
                                padding: "0.75rem 1rem",
                                borderBottom: "1px solid #f3f4f6",
                                cursor: "pointer",
                                backgroundColor: n.is_read ? "white" : "#f9fafb",
                                borderLeft: !n.is_read ? `4px solid ${getBorderColor(n.type)}` : "4px solid transparent",
                                transition: "background-color 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.is_read ? "white" : "#f9fafb"}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                <span style={{ fontSize: "14px", fontWeight: n.is_read ? "500" : "700", color: "#1f2937" }}>
                                    {n.title}
                                </span>
                                <span style={{ fontSize: "11px", color: "#9ca3af" }}>{timeAgo(n.created_at)}</span>
                            </div>
                            <p style={{ fontSize: "13px", color: "#4b5563", margin: 0, lineHeight: "1.4" }}>
                                {n.message}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: "0.75rem", borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
                <button
                    onClick={handleViewAll}
                    style={{
                        width: "100%",
                        padding: "0.5rem",
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#374151",
                        cursor: "pointer"
                    }}
                >
                    View All Notifications
                </button>
            </div>
        </div>
    );
};

export default NotificationDropdown;
