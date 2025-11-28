import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { formatDate } from "../../utils/dateUtils";

const SalariesPage = () => {
    // State
    const [salaries, setSalaries] = useState({ data: [], current_page: 1, last_page: 1, total: 0 });
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [search, setSearch] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [month, setMonth] = useState(currentMonth);
    const [currentPage, setCurrentPage] = useState(1);

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        employee_id: "",
        basic: 0,
        hra: 0,
        da: 0,
        deductions: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        loadSalaries();
    }, [currentPage, departmentId, month]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage === 1) loadSalaries();
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

    const loadSalaries = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: currentPage,
                search,
                department_id: departmentId,
                month
            };
            const response = await api.get("/superadmin/salaries", { params });
            setSalaries(response.data);
        } catch (err) {
            console.error("Failed to load salaries", err);
            setError("Failed to load salary records.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (salary) => {
        setSelectedSalary(salary);
        setFormData({
            employee_id: salary.employee_id,
            basic: salary.basic,
            hra: salary.hra,
            da: salary.da,
            deductions: salary.deductions
        });
        setIsEditModalOpen(true);
    };

    const handleHistory = async (employeeId) => {
        setIsHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            const response = await api.get(`/superadmin/salaries/history/${employeeId}`);
            setSalaryHistory(response.data);
        } catch (err) {
            console.error("Failed to load history", err);
            setSalaryHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post("/superadmin/salaries/update", formData);
            loadSalaries();
            setIsEditModalOpen(false);
        } catch (err) {
            console.error("Failed to update salary", err);
            alert("Failed to update salary.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get("/superadmin/salaries/export", {
                params: { month, department_id: departmentId, search },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `salaries_export_${month}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Failed to export salaries", err);
            alert("Failed to export salaries.");
        }
    };

    const handleRefresh = () => {
        loadSalaries();
    };

    // Helper: Format INR
    const formatINR = (value) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0
        }).format(value);
    };

    // Calculations
    const calculateGross = (basic, hra, da, deductions) => {
        return parseFloat(basic || 0) + parseFloat(hra || 0) + parseFloat(da || 0) - parseFloat(deductions || 0);
    };

    const summaryStats = () => {
        if (!salaries.data.length) return { totalEmployees: 0, totalExpense: 0, avgSalary: 0, highest: 0, lowest: 0 };

        const totalEmployees = salaries.total;
        const currentData = salaries.data;
        const totalExpense = currentData.reduce((sum, s) => sum + parseFloat(s.gross_salary), 0);
        const avgSalary = totalExpense / (currentData.length || 1);
        const highest = Math.max(...currentData.map(s => parseFloat(s.gross_salary)));
        const lowest = Math.min(...currentData.map(s => parseFloat(s.gross_salary)));

        return { totalEmployees, totalExpense, avgSalary, highest, lowest };
    };

    const stats = summaryStats();

    // Styles
    const containerStyle = { padding: "2rem" };
    const headerStyle = { marginBottom: "1.5rem" };
    const titleStyle = { fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" };
    const subTitleStyle = { fontSize: "0.875rem", color: "#6b7280" };

    const summaryGridStyle = { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", marginBottom: "1.5rem" };
    const summaryCardStyle = { backgroundColor: "white", padding: "1rem", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", textAlign: "center" };
    const summaryValueStyle = { fontSize: "1.25rem", fontWeight: "bold", color: "#111827" };
    const summaryLabelStyle = { fontSize: "0.75rem", color: "#6b7280" };

    const controlsContainerStyle = { backgroundColor: "white", padding: "1rem", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" };
    const inputStyle = { padding: "0.5rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", outline: "none" };
    const buttonStyle = { padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", backgroundColor: "white", color: "#374151", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500" };
    const primaryButtonStyle = { ...buttonStyle, backgroundColor: "#2563eb", color: "white", border: "none" };

    const tableContainerStyle = { backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", overflow: "hidden" };
    const tableStyle = { width: "100%", borderCollapse: "collapse", textAlign: "left" };
    const thStyle = { padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" };
    const tdStyle = { padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#111827", borderBottom: "1px solid #e5e7eb" };
    const actionButtonStyle = { padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer", border: "none", marginRight: "0.5rem", backgroundColor: "#f3f4f6", color: "#374151" };

    const modalOverlayStyle = { position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 };
    const modalContentStyle = { backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", width: "100%", maxWidth: "500px", padding: "1.5rem", maxHeight: "90vh", overflowY: "auto" };
    const labelStyle = { display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.25rem" };
    const formGroupStyle = { marginBottom: "1rem" };

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <h1 style={titleStyle}>Salaries Management</h1>
                <p style={subTitleStyle}>Manage and review employee salary structures.</p>
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
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    style={inputStyle}
                />
                <button onClick={handleRefresh} style={buttonStyle}>Refresh</button>
                <button onClick={handleExport} style={buttonStyle}>Export CSV</button>
            </div>

            {/* Summary Cards */}
            <div style={summaryGridStyle}>
                <div style={summaryCardStyle}>
                    <div style={summaryValueStyle}>{stats.totalEmployees}</div>
                    <div style={summaryLabelStyle}>Total Employees</div>
                </div>
                <div style={summaryCardStyle}>
                    <div style={summaryValueStyle}>{formatINR(stats.totalExpense)}</div>
                    <div style={summaryLabelStyle}>Total Expense (Page)</div>
                </div>
                <div style={summaryCardStyle}>
                    <div style={summaryValueStyle}>{formatINR(stats.avgSalary)}</div>
                    <div style={summaryLabelStyle}>Avg Salary</div>
                </div>
                <div style={summaryCardStyle}>
                    <div style={summaryValueStyle}>{formatINR(stats.highest)}</div>
                    <div style={summaryLabelStyle}>Highest</div>
                </div>
                <div style={summaryCardStyle}>
                    <div style={summaryValueStyle}>{formatINR(stats.lowest)}</div>
                    <div style={summaryLabelStyle}>Lowest</div>
                </div>
            </div>

            {/* Table */}
            <div style={tableContainerStyle}>
                {loading ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading salaries...</div>
                ) : error ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>{error}</div>
                ) : (
                    <>
                        <div style={{ overflowX: "auto" }}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Employee</th>
                                        <th style={thStyle}>Basic (₹)</th>
                                        <th style={thStyle}>HRA (₹)</th>
                                        <th style={thStyle}>DA (₹)</th>
                                        <th style={thStyle}>Deductions (₹)</th>
                                        <th style={thStyle}>Gross Salary (₹)</th>
                                        <th style={thStyle}>Last Updated</th>
                                        <th style={thStyle}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salaries.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                                                No employees found.
                                            </td>
                                        </tr>
                                    ) : (
                                        salaries.data.map((salary) => (
                                            <tr key={salary.employee_id}>
                                                <td style={tdStyle}>
                                                    <div style={{ fontWeight: "600" }}>{salary.employee?.user?.name}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{salary.employee?.employee_code}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{salary.employee?.department?.name}</div>
                                                </td>
                                                <td style={tdStyle}>{salary.basic ? formatINR(salary.basic) : "-"}</td>
                                                <td style={tdStyle}>{salary.hra ? formatINR(salary.hra) : "-"}</td>
                                                <td style={tdStyle}>{salary.da ? formatINR(salary.da) : "-"}</td>
                                                <td style={{ ...tdStyle, color: "#ef4444" }}>{salary.deductions ? `-${formatINR(salary.deductions)}` : "-"}</td>
                                                <td style={{ ...tdStyle, fontWeight: "bold" }}>
                                                    {salary.gross_salary
                                                        ? formatINR(salary.gross_salary)
                                                        : (salary.employee?.salary ? <span title="From Employee Profile">{formatINR(salary.employee.salary)}*</span> : "Not Set")
                                                    }
                                                </td>
                                                <td style={{ ...tdStyle, color: "#6b7280" }}>{salary.updated_at ? formatDate(salary.updated_at) : "Never"}</td>
                                                <td style={tdStyle}>
                                                    <button onClick={() => handleEdit(salary)} style={actionButtonStyle}>
                                                        {salary.id ? "Edit Salary" : "Set Salary"}
                                                    </button>
                                                    <button onClick={() => handleHistory(salary.employee_id)} style={actionButtonStyle}>View History</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {salaries.last_page > 1 && (
                            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    style={{ ...buttonStyle, opacity: currentPage === 1 ? 0.5 : 1 }}
                                >
                                    Previous
                                </button>
                                <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>
                                    Page {currentPage} of {salaries.last_page}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(salaries.last_page, p + 1))}
                                    disabled={currentPage === salaries.last_page}
                                    style={{ ...buttonStyle, opacity: currentPage === salaries.last_page ? 0.5 : 1 }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#1f2937" }}>Edit Salary Structure</h2>
                        <form onSubmit={handleSave}>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Basic Salary</label>
                                <input type="number" value={formData.basic} onChange={(e) => setFormData({ ...formData, basic: e.target.value })} style={{ ...inputStyle, width: "100%" }} required />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>HRA</label>
                                <input type="number" value={formData.hra} onChange={(e) => setFormData({ ...formData, hra: e.target.value })} style={{ ...inputStyle, width: "100%" }} required />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>DA</label>
                                <input type="number" value={formData.da} onChange={(e) => setFormData({ ...formData, da: e.target.value })} style={{ ...inputStyle, width: "100%" }} required />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Deductions</label>
                                <input type="number" value={formData.deductions} onChange={(e) => setFormData({ ...formData, deductions: e.target.value })} style={{ ...inputStyle, width: "100%" }} />
                            </div>
                            <div style={{ ...formGroupStyle, padding: "1rem", backgroundColor: "#f3f4f6", borderRadius: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: "600", color: "#374151" }}>Gross Salary:</span>
                                <span style={{ fontWeight: "bold", fontSize: "1.125rem", color: "#111827" }}>
                                    {formatINR(calculateGross(formData.basic, formData.hra, formData.da, formData.deductions))}
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} style={buttonStyle}>Cancel</button>
                                <button type="submit" disabled={isSubmitting} style={{ ...primaryButtonStyle, opacity: isSubmitting ? 0.5 : 1 }}>
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* HISTORY MODAL */}
            {isHistoryModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalContentStyle, maxWidth: "600px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#1f2937" }}>Salary History</h2>
                            <button onClick={() => setIsHistoryModalOpen(false)} style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#6b7280" }}>✕</button>
                        </div>

                        {historyLoading ? (
                            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading history...</div>
                        ) : salaryHistory.length === 0 ? (
                            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No history found.</div>
                        ) : (
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Month</th>
                                        <th style={thStyle}>Basic (₹)</th>
                                        <th style={thStyle}>HRA (₹)</th>
                                        <th style={thStyle}>DA (₹)</th>
                                        <th style={thStyle}>Ded. (₹)</th>
                                        <th style={thStyle}>Gross (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salaryHistory.map((item, index) => (
                                        <tr key={index}>
                                            <td style={tdStyle}>{item.month}</td>
                                            <td style={tdStyle}>{formatINR(item.basic)}</td>
                                            <td style={tdStyle}>{formatINR(item.hra)}</td>
                                            <td style={tdStyle}>{formatINR(item.da)}</td>
                                            <td style={{ ...tdStyle, color: "#ef4444" }}>-{formatINR(item.deductions)}</td>
                                            <td style={{ ...tdStyle, fontWeight: "bold" }}>{formatINR(item.gross_salary)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
                            <button onClick={() => setIsHistoryModalOpen(false)} style={buttonStyle}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalariesPage;
