import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { formatDate } from "../../utils/dateUtils";

const AttendancePage = () => {
    // State
    const [attendanceData, setAttendanceData] = useState({ data: [], current_page: 1, last_page: 1, total: 0 });
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [search, setSearch] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [status, setStatus] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Initial Fetch
    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        loadAttendance();
    }, [currentPage]); // Reload when page changes

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/superadmin/departments");
            setDepartments(response.data);
        } catch (err) {
            console.error("Failed to fetch departments", err);
        }
    };

    const loadAttendance = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: currentPage,
                search,
                department_id: departmentId,
                status,
                start_date: startDate,
                end_date: endDate
            };
            const response = await api.get("/superadmin/attendance", { params });
            setAttendanceData(response.data.attendance);
        } catch (err) {
            console.error("Failed to load attendance", err);
            setError("Failed to load attendance data.");
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        setCurrentPage(1);
        loadAttendance();
    };

    const handleReset = () => {
        setSearch("");
        setDepartmentId("");
        setStatus("");
        setStartDate("");
        setEndDate("");
        setCurrentPage(1);
        // We need to call loadAttendance after state updates, but since state updates are async, 
        // we can just call it with empty params or wait for effect if we added dependencies.
        // For simplicity, we'll just trigger a reload with cleared values directly.
        setLoading(true);
        api.get("/superadmin/attendance", { params: { page: 1 } })
            .then(res => {
                setAttendanceData(res.data.attendance);
                setLoading(false);
            })
            .catch(err => {
                setError("Failed to reset filters.");
                setLoading(false);
            });
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
    const headerStyle = { marginBottom: "1.5rem" };
    const titleStyle = { fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" };
    const subTitleStyle = { fontSize: "0.875rem", color: "#6b7280" };
    const controlsContainerStyle = { backgroundColor: "white", padding: "1rem", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" };
    const inputStyle = { padding: "0.5rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", outline: "none" };
    const buttonStyle = { padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", backgroundColor: "white", color: "#374151", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500" };
    const primaryButtonStyle = { ...buttonStyle, backgroundColor: "#2563eb", color: "white", border: "none" };
    const tableContainerStyle = { backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", overflow: "hidden" };
    const tableStyle = { width: "100%", borderCollapse: "collapse", textAlign: "left" };
    const thStyle = { padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" };
    const tdStyle = { padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#111827", borderBottom: "1px solid #e5e7eb" };

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <h1 style={titleStyle}>Attendance Management</h1>
                <p style={subTitleStyle}>Monitor and manage attendance across all departments</p>
            </div>

            {/* Controls */}
            <div style={controlsContainerStyle}>
                <input
                    type="text"
                    placeholder="Search employee..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ ...inputStyle, width: "250px" }}
                />
                <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} style={inputStyle}>
                    <option value="">All Departments</option>
                    {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
                    <option value="">All Status</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                    <option value="On Leave">On Leave</option>
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>From:</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>To:</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
                </div>
                <button onClick={handleFilter} style={primaryButtonStyle}>Filter</button>
                <button onClick={handleReset} style={buttonStyle}>Reset</button>
                <button onClick={() => loadAttendance()} style={buttonStyle}>Refresh</button>
            </div>

            {/* Table */}
            <div style={tableContainerStyle}>
                {loading ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading attendance data...</div>
                ) : error ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>{error}</div>
                ) : (
                    <>
                        <div style={{ overflowX: "auto" }}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Employee</th>
                                        <th style={thStyle}>Date</th>
                                        <th style={thStyle}>Check In</th>
                                        <th style={thStyle}>Check Out</th>
                                        <th style={thStyle}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceData.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                                                No attendance records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        attendanceData.data.map((record) => (
                                            <tr key={record.id}>
                                                <td style={tdStyle}>
                                                    <div style={{ fontWeight: "600" }}>{record.employee?.user?.name}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{record.employee?.user?.email}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{record.employee?.employee_code} • {record.employee?.department?.name}</div>
                                                </td>
                                                <td style={tdStyle}>{formatDate(record.date)}</td>
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

export default AttendancePage;
