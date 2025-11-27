import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { formatDate } from "../../utils/dateUtils";

const LeavesPage = () => {
    // State
    const [leaves, setLeaves] = useState({ data: [], current_page: 1, last_page: 1, total: 0 });
    const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // ID of leave being processed
    const [error, setError] = useState(null);

    // Filters
    const [search, setSearch] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [status, setStatus] = useState("");
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [month, setMonth] = useState(currentMonth);
    const [currentPage, setCurrentPage] = useState(1);

    // Initial Fetch
    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        loadLeaves();
        loadSummary();
    }, [currentPage, departmentId, status, month]); // Reload when filters change

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage === 1) loadLeaves();
            else setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/superadmin/departments");
            setDepartments(response.data);
        } catch (err) {
            console.error("Failed to fetch departments", err);
        }
    };

    const loadLeaves = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: currentPage,
                search,
                department_id: departmentId,
                status,
                month
            };
            const response = await api.get("/superadmin/leaves", { params });
            setLeaves(response.data);
        } catch (err) {
            console.error("Failed to load leaves", err);
            setError("Failed to load leave applications.");
        } finally {
            setLoading(false);
        }
    };

    const loadSummary = async () => {
        try {
            const response = await api.get("/superadmin/leaves/summary", { params: { month } });
            setSummary(response.data);
        } catch (err) {
            console.error("Failed to load summary", err);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm("Are you sure you want to approve this leave?")) return;
        setActionLoading(id);
        try {
            await api.post(`/superadmin/leaves/${id}/approve`);
            loadLeaves();
            loadSummary();
        } catch (err) {
            console.error("Failed to approve leave", err);
            alert("Failed to approve leave.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Are you sure you want to reject this leave?")) return;
        setActionLoading(id);
        try {
            await api.post(`/superadmin/leaves/${id}/reject`);
            loadLeaves();
            loadSummary();
        } catch (err) {
            console.error("Failed to reject leave", err);
            alert("Failed to reject leave.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get("/superadmin/leaves/export", {
                params: { month, status, department_id: departmentId },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `leaves_export_${month}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Failed to export leaves", err);
            alert("Failed to export leaves.");
        }
    };

    const handleRefresh = () => {
        loadLeaves();
        loadSummary();
    };

    const getStatusBadgeStyle = (status) => {
        const baseStyle = { padding: "0.25rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "600" };
        switch (status) {
            case "Approved": return { ...baseStyle, backgroundColor: "#d1fae5", color: "#065f46" }; // Green
            case "Rejected": return { ...baseStyle, backgroundColor: "#fee2e2", color: "#b91c1c" }; // Red
            case "Pending": return { ...baseStyle, backgroundColor: "#ffedd5", color: "#c2410c" }; // Orange
            default: return { ...baseStyle, backgroundColor: "#f3f4f6", color: "#1f2937" }; // Gray
        }
    };

    // Styles
    const containerStyle = { padding: "2rem" };
    const headerStyle = { marginBottom: "1.5rem" };
    const titleStyle = { fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" };
    const subTitleStyle = { fontSize: "0.875rem", color: "#6b7280" };

    const summaryGridStyle = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" };
    const summaryCardStyle = { backgroundColor: "white", padding: "1rem", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", textAlign: "center" };
    const summaryValueStyle = { fontSize: "1.5rem", fontWeight: "bold", color: "#111827" };
    const summaryLabelStyle = { fontSize: "0.875rem", color: "#6b7280" };

    const controlsContainerStyle = { backgroundColor: "white", padding: "1rem", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" };
    const inputStyle = { padding: "0.5rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", outline: "none" };
    const buttonStyle = { padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", backgroundColor: "white", color: "#374151", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500" };
    const primaryButtonStyle = { ...buttonStyle, backgroundColor: "#2563eb", color: "white", border: "none" };

    const tableContainerStyle = { backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", overflow: "hidden" };
    const tableStyle = { width: "100%", borderCollapse: "collapse", textAlign: "left" };
    const thStyle = { padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" };
    const tdStyle = { padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#111827", borderBottom: "1px solid #e5e7eb" };
    const actionButtonStyle = { padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer", border: "none", marginRight: "0.5rem" };

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <h1 style={titleStyle}>Leaves Management</h1>
                <p style={subTitleStyle}>View, filter, and manage all leave applications</p>
            </div>

            {/* Summary Cards */}
            <div style={summaryGridStyle}>
                <div style={summaryCardStyle}>
                    <div style={summaryValueStyle}>{summary.total}</div>
                    <div style={summaryLabelStyle}>Total Leaves</div>
                </div>
                <div style={summaryCardStyle}>
                    <div style={{ ...summaryValueStyle, color: "#c2410c" }}>{summary.pending}</div>
                    <div style={summaryLabelStyle}>Pending</div>
                </div>
                <div style={summaryCardStyle}>
                    <div style={{ ...summaryValueStyle, color: "#059669" }}>{summary.approved}</div>
                    <div style={summaryLabelStyle}>Approved</div>
                </div>
                <div style={summaryCardStyle}>
                    <div style={{ ...summaryValueStyle, color: "#dc2626" }}>{summary.rejected}</div>
                    <div style={summaryLabelStyle}>Rejected</div>
                </div>
            </div>

            {/* Controls */}
            <div style={controlsContainerStyle}>
                <input
                    type="text"
                    placeholder="Search employee..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ ...inputStyle, width: "200px" }}
                />
                <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} style={inputStyle}>
                    <option value="">All Departments</option>
                    {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    style={inputStyle}
                />
                <button onClick={handleRefresh} style={buttonStyle}>Refresh</button>
                <button onClick={handleExport} style={buttonStyle}>Export CSV</button>
            </div>

            {/* Table */}
            <div style={tableContainerStyle}>
                {loading ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading leaves...</div>
                ) : error ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>{error}</div>
                ) : (
                    <>
                        <div style={{ overflowX: "auto" }}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Employee</th>
                                        <th style={thStyle}>Leave Type</th>
                                        <th style={thStyle}>Dates</th>
                                        <th style={thStyle}>Reason</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                                                No leave applications found.
                                            </td>
                                        </tr>
                                    ) : (
                                        leaves.data.map((leave) => (
                                            <tr key={leave.id}>
                                                <td style={tdStyle}>
                                                    <div style={{ fontWeight: "600" }}>{leave.employee?.user?.name}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{leave.employee?.user?.email}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{leave.employee?.employee_code} • {leave.employee?.department?.name}</div>
                                                </td>
                                                <td style={tdStyle}>{leave.leave_type?.name || leave.type}</td>
                                                <td style={tdStyle}>
                                                    <div>{formatDate(leave.start_date)}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>to {formatDate(leave.end_date)}</div>
                                                </td>
                                                <td style={{ ...tdStyle, maxWidth: "200px" }}>{leave.reason || "-"}</td>
                                                <td style={tdStyle}>
                                                    <span style={getStatusBadgeStyle(leave.status)}>{leave.status}</span>
                                                </td>
                                                <td style={tdStyle}>
                                                    {leave.status === "Pending" && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(leave.id)}
                                                                disabled={actionLoading === leave.id}
                                                                style={{ ...actionButtonStyle, backgroundColor: "#10b981", color: "white", opacity: actionLoading === leave.id ? 0.5 : 1 }}
                                                            >
                                                                {actionLoading === leave.id ? "..." : "Approve"}
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(leave.id)}
                                                                disabled={actionLoading === leave.id}
                                                                style={{ ...actionButtonStyle, backgroundColor: "#ef4444", color: "white", opacity: actionLoading === leave.id ? 0.5 : 1 }}
                                                            >
                                                                {actionLoading === leave.id ? "..." : "Reject"}
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {leaves.last_page > 1 && (
                            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    style={{ ...buttonStyle, opacity: currentPage === 1 ? 0.5 : 1 }}
                                >
                                    Previous
                                </button>
                                <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>
                                    Page {currentPage} of {leaves.last_page}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(leaves.last_page, p + 1))}
                                    disabled={currentPage === leaves.last_page}
                                    style={{ ...buttonStyle, opacity: currentPage === leaves.last_page ? 0.5 : 1 }}
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

export default LeavesPage;
