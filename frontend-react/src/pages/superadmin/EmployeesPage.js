import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

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
    const inputStyle = { padding: "0.75rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", outline: "none", width: "100%", boxSizing: "border-box" };
    const selectStyle = { padding: "0.75rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", outline: "none", width: "100%", boxSizing: "border-box" };
    const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
    const modalContentStyle = { backgroundColor: "white", padding: "2rem", borderRadius: "0.5rem", width: "90%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" };
    const formGroupStyle = { display: "flex", flexDirection: "column", gap: "0.5rem" };
    const labelStyle = { fontSize: "0.875rem", fontWeight: "500", color: "#374151" };
    const errorStyle = { fontSize: "0.75rem", color: "#dc2626", marginTop: "0.25rem" };
    const badgeStyle = (isActive) => ({
        padding: "0.25rem 0.75rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: "500",
        backgroundColor: isActive ? "#d1fae5" : "#fee2e2",
        color: isActive ? "#065f46" : "#b91c1c"
    });
    return (
        <>
            <div style={containerStyle}>
                <div style={headerStyle}>
                    <div>
                        <h1 style={titleStyle}>Employees</h1>
                        <p style={subTitleStyle}>Manage your organization's workforce</p>
                    </div>
                    <div style={buttonGroupStyle}>
                        <button onClick={openAddModal} style={primaryButtonStyle}>+ Add Employee</button>
                    </div>
                </div>

                <div style={filterContainerStyle}>
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ ...inputStyle, maxWidth: "300px" }}
                    />
                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        style={{ ...selectStyle, maxWidth: "200px" }}
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ ...selectStyle, maxWidth: "150px" }}
                    >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>Loading employees...</div>
                ) : error ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#ef4444" }}>{error}</div>
                ) : (
                    <div style={{ backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead style={{ backgroundColor: "#f9fafb" }}>
                                <tr>
                                    <th onClick={() => handleSort("name")} style={{ padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", cursor: "pointer" }}>
                                        Employee {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th onClick={() => handleSort("department")} style={{ padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", cursor: "pointer" }}>
                                        Department {sortConfig.key === "department" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Contact</th>
                                    <th onClick={() => handleSort("date_of_joining")} style={{ padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", cursor: "pointer" }}>
                                        Joined {sortConfig.key === "date_of_joining" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Status</th>
                                    <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody style={{ divideY: "1px solid #e5e7eb" }}>
                                {paginatedEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                                            No employees found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedEmployees.map((emp) => (
                                        <tr key={emp.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                                            <td style={{ padding: "1rem 1.5rem" }}>
                                                <div style={{ fontWeight: "500", color: "#111827" }}>{emp.user?.name}</div>
                                                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{emp.designation}</div>
                                            </td>
                                            <td style={{ padding: "1rem 1.5rem", color: "#374151" }}>{emp.department?.name}</td>
                                            <td style={{ padding: "1rem 1.5rem" }}>
                                                <div style={{ color: "#374151" }}>{emp.user?.email}</div>
                                                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{emp.phone}</div>
                                            </td>
                                            <td style={{ padding: "1rem 1.5rem", color: "#374151" }}>{formatDate(emp.date_of_joining)}</td>
                                            <td style={{ padding: "1rem 1.5rem" }}>
                                                <span style={badgeStyle(emp.user?.is_active)}>
                                                    {emp.user?.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                                                    <button onClick={() => openViewModal(emp)} style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: "500" }}>View</button>
                                                    <button onClick={() => openEditModal(emp)} style={{ color: "#d97706", background: "none", border: "none", cursor: "pointer", fontWeight: "500" }}>Edit</button>
                                                    <button onClick={() => openDeleteModal(emp)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: "500" }}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                                Showing <span style={{ fontWeight: "500" }}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span style={{ fontWeight: "500" }}>{Math.min(currentPage * itemsPerPage, filteredEmployees.length)}</span> of <span style={{ fontWeight: "500" }}>{filteredEmployees.length}</span> results
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    style={{ padding: "0.5rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", backgroundColor: "white", color: currentPage === 1 ? "#9ca3af" : "#374151", cursor: currentPage === 1 ? "default" : "pointer" }}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    style={{ padding: "0.5rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", backgroundColor: "white", color: currentPage === totalPages ? "#9ca3af" : "#374151", cursor: currentPage === totalPages ? "default" : "pointer" }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ADD MODAL */}
            {isAddModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "2rem", color: "#1f2937", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem" }}>Add New Employee</h2>
                        {formErrors.api && <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "0.5rem" }}>{formErrors.api}</div>}
                        <form onSubmit={handleAddSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
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
                                <select value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} style={selectStyle}>
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
                        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "2rem", color: "#1f2937", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem" }}>Edit Employee</h2>
                        {formErrors.api && <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "0.5rem" }}>{formErrors.api}</div>}
                        <form onSubmit={handleEditSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
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
                                <select value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} style={selectStyle}>
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
                                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={selectStyle}>
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
            )
            }

            {/* PASSWORD MODAL */}
            {
                isPasswordModalOpen && (
                    <div style={modalOverlayStyle}>
                        <div style={modalContentStyle, { maxWidth: "400px", textAlign: "center" }}>
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
                )
            }

            {/* End of Modals */}
        </>
    );
};


export default EmployeesPage;
