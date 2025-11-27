import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import SuperAdminLayout from "../../layouts/SuperAdminLayout";
import { formatDate } from "../../utils/dateUtils";

const EmployeesPage = () => {
    // Data States
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter & Search States
    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Form States
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        department_id: "",
        designation: "",
        date_of_joining: "",
        salary: "",
        phone: "",
        address: "",
        status: "Active"
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await api.get("/superadmin/employees");
            setEmployees(response.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch employees", err);
            setError("Failed to load employees.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/departments");
            setDepartments(response.data);
        } catch (err) {
            console.error("Failed to fetch departments", err);
        }
    };

    // Filtering & Sorting Logic
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch =
            emp.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            emp.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            emp.employee_code?.toLowerCase().includes(search.toLowerCase());

        const matchesDept = departmentFilter ? emp.department_id === parseInt(departmentFilter) : true;
        const matchesStatus = statusFilter ? (statusFilter === "Active" ? emp.user?.is_active : !emp.user?.is_active) : true;

        return matchesSearch && matchesDept && matchesStatus;
    }).sort((a, b) => {
        if (sortConfig.key === "name") {
            return sortConfig.direction === "asc"
                ? a.user?.name.localeCompare(b.user?.name)
                : b.user?.name.localeCompare(a.user?.name);
        }
        if (sortConfig.key === "department") {
            return sortConfig.direction === "asc"
                ? (a.department?.name || "").localeCompare(b.department?.name || "")
                : (b.department?.name || "").localeCompare(a.department?.name || "");
        }
        if (sortConfig.key === "date_of_joining") {
            return sortConfig.direction === "asc"
                ? new Date(a.date_of_joining) - new Date(b.date_of_joining)
                : new Date(b.date_of_joining) - new Date(a.date_of_joining);
        }
        return 0;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredEmployees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
        }));
    };

    // Modal Handlers
    const openAddModal = () => {
        setFormData({
            name: "",
            email: "",
            department_id: "",
            designation: "",
            date_of_joining: "",
            salary: "",
            phone: "",
            address: "",
            status: "Active"
        });
        setFormErrors({});
        setIsAddModalOpen(true);
    };

    const openEditModal = (emp) => {
        setSelectedEmployee(emp);
        setFormData({
            name: emp.user?.name || "",
            email: emp.user?.email || "",
            department_id: emp.department_id || "",
            designation: emp.designation || "",
            date_of_joining: emp.date_of_joining || "",
            salary: emp.salary || "",
            phone: emp.phone || "",
            address: emp.address || "",
            status: emp.user?.is_active ? "Active" : "Inactive"
        });
        setFormErrors({});
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (emp) => {
        setSelectedEmployee(emp);
        setIsDeleteModalOpen(true);
    };

    const openViewModal = (emp) => {
        setSelectedEmployee(emp);
        setIsViewModalOpen(true);
    };

    const closeModals = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsViewModalOpen(false);
        setSelectedEmployee(null);
    };

    // Password Modal State
    const [createdPassword, setCreatedPassword] = useState(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    // Form Submission
    const validateForm = () => {
        const errors = {};
        if (!formData.name) errors.name = "Name is required";
        if (!formData.email) errors.email = "Email is required";
        if (!formData.department_id) errors.department_id = "Department is required";
        if (!formData.designation) errors.designation = "Designation is required";
        if (!formData.salary) errors.salary = "Salary is required";
        if (!formData.date_of_joining) errors.date_of_joining = "Joining Date is required";
        return errors;
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.post("/superadmin/employees", formData);
            fetchEmployees();
            closeModals();

            // Show password modal if plain_password is returned
            if (response.data.plain_password) {
                setCreatedPassword(response.data.plain_password);
                setIsPasswordModalOpen(true);
            }
        } catch (err) {
            console.error("Failed to create employee", err);
            setFormErrors({ api: err.response?.data?.message || "Failed to create employee" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        if (!selectedEmployee?.id) {
            setFormErrors({ api: "Invalid employee selected." });
            return;
        }

        setIsSubmitting(true);
        try {
            console.log("Updating employee:", selectedEmployee.id, formData);
            await api.put(`/superadmin/employees/${selectedEmployee.id}`, formData);
            await fetchEmployees();
            closeModals();
        } catch (err) {
            console.error("Failed to update employee", err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to update employee";
            setFormErrors({ api: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        setIsSubmitting(true);
        try {
            await api.delete(`/superadmin/employees/${selectedEmployee.id}`);
            fetchEmployees();
            closeModals();
        } catch (err) {
            console.error("Failed to delete employee", err);
            alert("Failed to delete employee");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Styles
    const containerStyle = { padding: "2rem" };
    const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" };
    const titleStyle = { fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" };
    const subTitleStyle = { fontSize: "0.875rem", color: "#6b7280" };
    const buttonGroupStyle = { display: "flex", gap: "0.75rem" };
    const buttonStyle = { padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", backgroundColor: "white", color: "#374151", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500" };
    const primaryButtonStyle = { ...buttonStyle, backgroundColor: "#2563eb", color: "white", border: "none" };
    const filterContainerStyle = { backgroundColor: "white", padding: "1rem", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" };
    const inputStyle = { padding: "0.5rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", outline: "none", width: "100%", maxWidth: "300px" };
    const selectStyle = { padding: "0.5rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", outline: "none" };
    const tableContainerStyle = { backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", overflow: "hidden" };
    const tableStyle = { width: "100%", borderCollapse: "collapse", textAlign: "left" };
    const thStyle = { padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb", cursor: "pointer" };
    const tdStyle = { padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#111827", borderBottom: "1px solid #e5e7eb" };
    const badgeStyle = (isActive) => ({
        padding: "0.25rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "600",
        backgroundColor: isActive ? "#d1fae5" : "#f3f4f6", color: isActive ? "#065f46" : "#1f2937"
    });
    const actionButtonStyle = { color: "#6b7280", fontWeight: "500", marginRight: "0.5rem", cursor: "pointer", background: "none", border: "none" };
    const modalOverlayStyle = { position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 };
    const modalContentStyle = { backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", width: "100%", maxWidth: "600px", padding: "1.5rem", maxHeight: "90vh", overflowY: "auto" };
    const labelStyle = { display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.25rem" };
    const formGroupStyle = { marginBottom: "1rem" };
    const errorStyle = { color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" };

    return (
        <>
            <div style={containerStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <div>
                        <h1 style={titleStyle}>Employees Management</h1>
                        <p style={subTitleStyle}>Manage all employees and their accounts</p>
                    </div>
                    <div style={buttonGroupStyle}>
                        <button onClick={fetchEmployees} style={buttonStyle}>Refresh</button>
                        <button onClick={openAddModal} style={primaryButtonStyle}>+ Add Employee</button>
                    </div>
                </div>

                {/* Filters */}
                <div style={filterContainerStyle}>
                    <input
                        type="text"
                        placeholder="Search by name, email, or code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={inputStyle}
                    />
                    <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} style={selectStyle}>
                        <option value="">All Departments</option>
                        {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                    <button
                        onClick={() => { setSearch(""); setDepartmentFilter(""); setStatusFilter(""); }}
                        style={{ ...buttonStyle, border: "none", color: "#4b5563" }}
                    >
                        Reset
                    </button>
                </div>

                {/* Table */}
                <div style={tableContainerStyle}>
                    {loading ? (
                        <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading employees...</div>
                    ) : error ? (
                        <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>{error}</div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Code</th>
                                        <th style={thStyle} onClick={() => handleSort("name")}>Name</th>
                                        <th style={thStyle}>Email</th>
                                        <th style={thStyle} onClick={() => handleSort("department")}>Department</th>
                                        <th style={thStyle}>Designation</th>
                                        <th style={thStyle} onClick={() => handleSort("date_of_joining")}>Joined</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedEmployees.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                                                No employees found matching your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedEmployees.map((emp) => (
                                            <tr key={emp.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                                <td style={tdStyle}>{emp.employee_code}</td>
                                                <td style={{ ...tdStyle, fontWeight: "500" }}>{emp.user?.name}</td>
                                                <td style={{ ...tdStyle, color: "#6b7280" }}>{emp.user?.email}</td>
                                                <td style={{ ...tdStyle, color: "#6b7280" }}>{emp.department?.name || "-"}</td>
                                                <td style={{ ...tdStyle, color: "#6b7280" }}>{emp.designation}</td>
                                                <td style={{ ...tdStyle, color: "#6b7280" }}>{formatDate(emp.date_of_joining)}</td>
                                                <td style={tdStyle}>
                                                    <span style={badgeStyle(emp.user?.is_active)}>
                                                        {emp.user?.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                                    <Link
                                                        to={`/superadmin/employees/${emp.id}/attendance`}
                                                        style={{
                                                            display: "inline-block",
                                                            padding: "0.25rem 0.5rem",
                                                            backgroundColor: "#d1fae5",
                                                            color: "#065f46",
                                                            borderRadius: "0.375rem",
                                                            textDecoration: "none",
                                                            fontSize: "0.75rem",
                                                            fontWeight: "600",
                                                            marginRight: "0.5rem",
                                                            border: "1px solid #a7f3d0"
                                                        }}
                                                    >
                                                        Attendance
                                                    </Link>
                                                    <button onClick={() => openViewModal(emp)} style={actionButtonStyle}>View</button>
                                                    <button onClick={() => openEditModal(emp)} style={{ ...actionButtonStyle, color: "#2563eb" }}>Edit</button>
                                                    <button onClick={() => openDeleteModal(emp)} style={{ ...actionButtonStyle, color: "#dc2626", marginRight: 0 }}>Delete</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{ ...buttonStyle, opacity: currentPage === 1 ? 0.5 : 1 }}
                            >
                                Previous
                            </button>
                            <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                style={{ ...buttonStyle, opacity: currentPage === totalPages ? 0.5 : 1 }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ADD MODAL */}
            {isAddModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#1f2937" }}>Add New Employee</h2>
                        {formErrors.api && <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "0.375rem" }}>{formErrors.api}</div>}
                        <form onSubmit={handleAddSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Name *</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
                                {formErrors.name && <p style={errorStyle}>{formErrors.name}</p>}
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Email *</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
                                {formErrors.email && <p style={errorStyle}>{formErrors.email}</p>}
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Department *</label>
                                <select value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} style={{ ...inputStyle, width: "100%" }}>
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                {formErrors.department_id && <p style={errorStyle}>{formErrors.department_id}</p>}
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Designation *</label>
                                <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} style={inputStyle} />
                                {formErrors.designation && <p style={errorStyle}>{formErrors.designation}</p>}
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Date of Joining *</label>
                                <input type="date" value={formData.date_of_joining} onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })} style={inputStyle} />
                                {formErrors.date_of_joining && <p style={errorStyle}>{formErrors.date_of_joining}</p>}
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Salary *</label>
                                <input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} style={inputStyle} />
                                {formErrors.salary && <p style={errorStyle}>{formErrors.salary}</p>}
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Phone</label>
                                <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Address</label>
                                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={inputStyle} />
                            </div>

                            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                                <button type="button" onClick={closeModals} style={buttonStyle}>Cancel</button>
                                <button type="submit" disabled={isSubmitting} style={{ ...primaryButtonStyle, opacity: isSubmitting ? 0.5 : 1 }}>
                                    {isSubmitting ? "Creating..." : "Create Employee"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#1f2937" }}>Edit Employee</h2>
                        {formErrors.api && <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "0.375rem" }}>{formErrors.api}</div>}
                        <form onSubmit={handleEditSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Name *</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Email *</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Department *</label>
                                <select value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} style={{ ...inputStyle, width: "100%" }}>
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Designation *</label>
                                <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Date of Joining *</label>
                                <input type="date" value={formData.date_of_joining} onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Salary *</label>
                                <input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Phone</label>
                                <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Address</label>
                                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Status</label>
                                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={{ ...inputStyle, width: "100%" }}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                                <button type="button" onClick={closeModals} style={buttonStyle}>Cancel</button>
                                <button type="submit" disabled={isSubmitting} style={{ ...primaryButtonStyle, opacity: isSubmitting ? 0.5 : 1 }}>
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {isDeleteModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalContentStyle, maxWidth: "400px" }}>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#1f2937" }}>Delete Employee</h2>
                        <p style={{ color: "#4b5563", marginBottom: "1.5rem" }}>
                            Are you sure you want to delete <strong>{selectedEmployee?.user?.name}</strong>?
                            This action cannot be undone and will remove their user account as well.
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                            <button onClick={closeModals} style={buttonStyle}>Cancel</button>
                            <button onClick={handleDeleteSubmit} disabled={isSubmitting} style={{ ...primaryButtonStyle, backgroundColor: "#dc2626", opacity: isSubmitting ? 0.5 : 1 }}>
                                {isSubmitting ? "Deleting..." : "Delete Employee"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW MODAL */}
            {isViewModalOpen && selectedEmployee && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#1f2937" }}>Employee Details</h2>
                            <button onClick={closeModals} style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#6b7280" }}>✕</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", fontWeight: "600" }}>Name</label>
                                <p style={{ color: "#111827", fontWeight: "500" }}>{selectedEmployee.user?.name}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", fontWeight: "600" }}>Code</label>
                                <p style={{ color: "#111827", fontWeight: "500" }}>{selectedEmployee.employee_code}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", fontWeight: "600" }}>Email</label>
                                <p style={{ color: "#111827" }}>{selectedEmployee.user?.email}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", fontWeight: "600" }}>Department</label>
                                <p style={{ color: "#111827" }}>{selectedEmployee.department?.name}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", fontWeight: "600" }}>Designation</label>
                                <p style={{ color: "#111827" }}>{selectedEmployee.designation}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", fontWeight: "600" }}>Joined</label>
                                <p style={{ color: "#111827" }}>{formatDate(selectedEmployee.date_of_joining)}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", fontWeight: "600" }}>Salary</label>
                                <p style={{ color: "#111827" }}>${selectedEmployee.salary}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", fontWeight: "600" }}>Status</label>
                                <span style={{ ...badgeStyle(selectedEmployee.user?.is_active), display: "inline-block", marginTop: "0.25rem" }}>
                                    {selectedEmployee.user?.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", fontWeight: "600" }}>Address</label>
                                <p style={{ color: "#111827" }}>{selectedEmployee.address || "N/A"}</p>
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", fontWeight: "600" }}>Phone</label>
                                <p style={{ color: "#111827" }}>{selectedEmployee.phone || "N/A"}</p>
                            </div>
                        </div>
                        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
                            <button onClick={closeModals} style={{ ...buttonStyle, backgroundColor: "#f3f4f6" }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* PASSWORD MODAL */}
            {isPasswordModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalContentStyle, maxWidth: "400px", textAlign: "center" }}>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#065f46" }}>Employee Created!</h2>
                        <p style={{ color: "#4b5563", marginBottom: "1rem" }}>
                            The employee account has been created successfully.
                        </p>
                        <div style={{ backgroundColor: "#f3f4f6", padding: "1rem", borderRadius: "0.5rem", marginBottom: "1.5rem" }}>
                            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.25rem" }}>Temporary Password:</p>
                            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", fontFamily: "monospace" }}>{createdPassword}</p>
                        </div>
                        <p style={{ fontSize: "0.875rem", color: "#dc2626", marginBottom: "1.5rem" }}>
                            Please copy and share this password with the employee immediately. It will not be shown again.
                        </p>
                        <button
                            onClick={() => { setIsPasswordModalOpen(false); setCreatedPassword(null); }}
                            style={{ ...primaryButtonStyle, width: "100%" }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}

        </>
    );
};


export default EmployeesPage;
