import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import { formatDate } from "../../utils/dateUtils";

const EmployeeAttendancePage = () => {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    // State
    const [employee, setEmployee] = useState(null);
    const [attendanceData, setAttendanceData] = useState({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } });
    const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, on_leave: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [month, setMonth] = useState(searchParams.get("month") || currentMonth);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setSearchParams({ month });
        fetchEmployee();
        fetchAttendance();
        fetchSummary();
    }, [id, month, currentPage]);

    const fetchEmployee = async () => {
        try {
            const response = await api.get(`/superadmin/employees/${id}`);
            setEmployee(response.data);
        } catch (err) {
            console.error("Failed to fetch employee", err);
            setError("Failed to load employee details.");
        }
    };

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/superadmin/employees/${id}/attendance`, {
                params: { month, page: currentPage }
            });
            setAttendanceData(response.data);
        } catch (err) {
            console.error("Failed to fetch attendance", err);
            setError("Failed to load attendance records.");
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await api.get(`/superadmin/employees/${id}/attendance/summary`, {
                params: { month }
            });
            setSummary(response.data);
        } catch (err) {
            console.error("Failed to fetch summary", err);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get(`/superadmin/employees/${id}/attendance/export`, {
                params: { month },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${employee?.employee_code}_${month}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Failed to export attendance", err);
            alert("Failed to export attendance.");
        }
    };

    const handleMonthChange = (offset) => {
        const date = new Date(month + "-01");
        date.setMonth(date.getMonth() + offset);
        const newMonth = date.toISOString().slice(0, 7);
        setMonth(newMonth);
        setCurrentPage(1);
    };

    const formatTime = (timeString) => {
        if (!timeString) return "-";
        const [hours, minutes] = timeString.split(":");
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusBadgeStyle = (status) => {
        const baseStyle = { padding: "0.25rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "600" };
        switch (status) {
            case "Present": return { ...baseStyle, backgroundColor: "#d1fae5", color: "#065f46" }; // Green
            case "Absent": return { ...baseStyle, backgroundColor: "#fee2e2", color: "#b91c1c" }; // Red
            case "Late": return { ...baseStyle, backgroundColor: "#ffedd5", color: "#c2410c" }; // Orange
            case "On Leave": return { ...baseStyle, backgroundColor: "#dbeafe", color: "#1e40af" }; // Blue
            default: return { ...baseStyle, backgroundColor: "#f3f4f6", color: "#1f2937" }; // Gray
        }
    };

    // Styles
    const containerStyle = { padding: "2rem" };
    const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" };
    const titleStyle = { fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" };
    const subTitleStyle = { fontSize: "0.875rem", color: "#6b7280" };
    const cardStyle = { backgroundColor: "white", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", marginBottom: "1.5rem" };
    const statGridStyle = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" };
    const statBoxStyle = { textAlign: "center", padding: "1rem", borderRadius: "0.5rem", backgroundColor: "#f9fafb" };
    const statValueStyle = { fontSize: "1.5rem", fontWeight: "bold", color: "#111827" };
    const statLabelStyle = { fontSize: "0.875rem", color: "#6b7280" };
    const controlsStyle = { display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" };
    const buttonStyle = { padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", backgroundColor: "white", color: "#374151", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500" };
    const primaryButtonStyle = { ...buttonStyle, backgroundColor: "#2563eb", color: "white", border: "none" };
    const tableContainerStyle = { backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", overflow: "hidden" };
    const tableStyle = { width: "100%", borderCollapse: "collapse", textAlign: "left" };
    const thStyle = { padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" };
    const tdStyle = { padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#111827", borderBottom: "1px solid #e5e7eb" };

    if (error) {
        return <div style={{ padding: "2rem", color: "#ef4444" }}>{error}</div>;
    }

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div>
                    <h1 style={titleStyle}>{employee?.user?.name || "Employee Attendance"}</h1>
                    <p style={subTitleStyle}>
                        {employee?.employee_code} • {employee?.department?.name}
                    </p>
                </div>
                <Link to="/superadmin/employees" style={buttonStyle}>Back to Employees</Link>
            </div>

            {/* Summary Card */}
            <div style={cardStyle}>
                <div style={statGridStyle}>
                    <div style={statBoxStyle}>
                        <div style={statValueStyle}>{summary.present}</div>
                        <div style={statLabelStyle}>Present</div>
                    </div>
                    <div style={statBoxStyle}>
                        <div style={statValueStyle}>{summary.absent}</div>
                        <div style={statLabelStyle}>Absent</div>
                    </div>
                    <div style={statBoxStyle}>
                        <div style={statValueStyle}>{summary.late}</div>
                        <div style={statLabelStyle}>Late</div>
                    </div>
                    <div style={statBoxStyle}>
                        <div style={statValueStyle}>{summary.on_leave}</div>
                        <div style={statLabelStyle}>On Leave</div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div style={controlsStyle}>
                <button onClick={() => handleMonthChange(-1)} style={buttonStyle}>&lt; Prev</button>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    style={{ ...buttonStyle, cursor: "text" }}
                />
                <button onClick={() => handleMonthChange(1)} style={buttonStyle}>Next &gt;</button>
                <button onClick={handleExport} style={buttonStyle} title="Export CSV">Export CSV</button>
                <button onClick={fetchAttendance} style={buttonStyle} title="Refresh">Refresh</button>
            </div>

            {/* Table */}
            <div style={tableContainerStyle}>
                {loading ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading attendance...</div>
                ) : (
                    <>
                        <div style={{ overflowX: "auto" }}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Date</th>
                                        <th style={thStyle}>Day</th>
                                        <th style={thStyle}>Check In</th>
                                        <th style={thStyle}>Check Out</th>
                                        <th style={thStyle}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceData.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                                                No records for this month.
                                            </td>
                                        </tr>
                                    ) : (
                                        attendanceData.data.map((record) => (
                                            <tr key={record.id}>
                                                <td style={tdStyle}>{formatDate(record.date)}</td>
                                                <td style={tdStyle}>{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}</td>
                                                <td style={tdStyle}>{formatTime(record.check_in)}</td>
                                                <td style={tdStyle}>{formatTime(record.check_out)}</td>
                                                <td style={tdStyle}>
                                                    <span style={getStatusBadgeStyle(record.status)}>{record.status}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {attendanceData.last_page > 1 && (
                            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    style={{ ...buttonStyle, opacity: currentPage === 1 ? 0.5 : 1 }}
                                >
                                    Previous
                                </button>
                                <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>
                                    Page {currentPage} of {attendanceData.last_page}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(attendanceData.last_page, p + 1))}
                                    disabled={currentPage === attendanceData.last_page}
                                    style={{ ...buttonStyle, opacity: currentPage === attendanceData.last_page ? 0.5 : 1 }}
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

export default EmployeeAttendancePage;
