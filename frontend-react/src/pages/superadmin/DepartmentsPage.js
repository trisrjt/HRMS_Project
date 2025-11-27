import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { formatDate } from "../../utils/dateUtils";

const DepartmentsPage = () => {
    // State
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ name: "" });
    const [formError, setFormError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    // Initial Fetch
    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await api.get("/superadmin/departments");
            setDepartments(response.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch departments", err);
            setError("Failed to load departments.");
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const openAddModal = () => {
        setFormData({ name: "" });
        setFormError(null);
        setIsAddModalOpen(true);
    };

    const openEditModal = (dept) => {
        setSelectedDepartment(dept);
        setFormData({ name: dept.name });
        setFormError(null);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (dept) => {
        setSelectedDepartment(dept);
        setIsDeleteModalOpen(true);
    };

    const closeModals = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedDepartment(null);
        setFormError(null);
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setFormError("Department name is required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.post("/superadmin/departments", formData);
            setDepartments([...departments, response.data.department].sort((a, b) => a.name.localeCompare(b.name)));
            setSuccessMessage("Department created successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
            closeModals();
        } catch (err) {
            console.error("Failed to create department", err);
            setFormError(err.response?.data?.message || "Failed to create department.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setFormError("Department name is required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.put(`/superadmin/departments/${selectedDepartment.id}`, formData);
            setDepartments(departments.map(d => d.id === selectedDepartment.id ? response.data.department : d).sort((a, b) => a.name.localeCompare(b.name)));
            setSuccessMessage("Department updated successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
            closeModals();
        } catch (err) {
            console.error("Failed to update department", err);
            setFormError(err.response?.data?.message || "Failed to update department.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        setIsSubmitting(true);
        try {
            await api.delete(`/superadmin/departments/${selectedDepartment.id}`);
            setDepartments(departments.filter(d => d.id !== selectedDepartment.id));
            setSuccessMessage("Department deleted successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
            closeModals();
        } catch (err) {
            console.error("Failed to delete department", err);
            alert("Failed to delete department."); // Fallback if modal closed
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filtered Departments
    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Styles
    const containerStyle = { padding: "2rem" };
    const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" };
    const titleStyle = { fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" };
    const subTitleStyle = { fontSize: "0.875rem", color: "#6b7280" };
    const buttonGroupStyle = { display: "flex", gap: "0.75rem" };
    const buttonStyle = { padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", backgroundColor: "white", color: "#374151", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500" };
    const primaryButtonStyle = { ...buttonStyle, backgroundColor: "#2563eb", color: "white", border: "none" };
    const filterContainerStyle = { marginBottom: "1.5rem" };
    const inputStyle = { padding: "0.5rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", outline: "none", width: "100%", maxWidth: "300px" };
    const tableContainerStyle = { backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", overflow: "hidden" };
    const tableStyle = { width: "100%", borderCollapse: "collapse", textAlign: "left" };
    const thStyle = { padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" };
    const tdStyle = { padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#111827", borderBottom: "1px solid #e5e7eb" };
    const actionButtonStyle = { color: "#6b7280", fontWeight: "500", marginRight: "0.5rem", cursor: "pointer", background: "none", border: "none" };
    const modalOverlayStyle = { position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 };
    const modalContentStyle = { backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", width: "100%", maxWidth: "500px", padding: "1.5rem" };
    const labelStyle = { display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.25rem" };
    const errorStyle = { color: "#ef4444", fontSize: "0.875rem", marginBottom: "1rem", padding: "0.5rem", backgroundColor: "#fee2e2", borderRadius: "0.375rem" };
    const successStyle = { position: "fixed", top: "1rem", right: "1rem", backgroundColor: "#10b981", color: "white", padding: "1rem", borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", zIndex: 100 };

    return (
        <div style={containerStyle}>
            {successMessage && <div style={successStyle}>{successMessage}</div>}

            {/* Header */}
            <div style={headerStyle}>
                <div>
                    <h1 style={titleStyle}>Departments Management</h1>
                    <p style={subTitleStyle}>Manage all departments in the organization</p>
                </div>
                <div style={buttonGroupStyle}>
                    <button onClick={fetchDepartments} style={buttonStyle}>Refresh</button>
                    <button onClick={openAddModal} style={primaryButtonStyle}>+ Add Department</button>
                </div>
            </div>

            {/* Search */}
            <div style={filterContainerStyle}>
                <input
                    type="text"
                    placeholder="Search by department name..."
                    value={searchQuery}
                    onChange={handleSearch}
                    style={inputStyle}
                />
            </div>

            {/* Table */}
            <div style={tableContainerStyle}>
                {loading ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading departments...</div>
                ) : error ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>{error}</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Name</th>
                                    <th style={thStyle}>Created At</th>
                                    <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDepartments.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                                            No departments found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDepartments.map((dept) => (
                                        <tr key={dept.id}>
                                            <td style={{ ...tdStyle, fontWeight: "500" }}>{dept.name}</td>
                                            <td style={{ ...tdStyle, color: "#6b7280" }}>{formatDate(dept.created_at)}</td>
                                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                                <button onClick={() => openEditModal(dept)} style={{ ...actionButtonStyle, color: "#2563eb" }}>Edit</button>
                                                <button onClick={() => openDeleteModal(dept)} style={{ ...actionButtonStyle, color: "#dc2626", marginRight: 0 }}>Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ADD MODAL */}
            {isAddModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#1f2937" }}>Add Department</h2>
                        {formError && <div style={errorStyle}>{formError}</div>}
                        <form onSubmit={handleAddSubmit}>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={labelStyle}>Department Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                                <button type="button" onClick={closeModals} style={buttonStyle}>Cancel</button>
                                <button type="submit" disabled={isSubmitting} style={{ ...primaryButtonStyle, opacity: isSubmitting ? 0.5 : 1 }}>
                                    {isSubmitting ? "Creating..." : "Create"}
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
                        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#1f2937" }}>Edit Department</h2>
                        {formError && <div style={errorStyle}>{formError}</div>}
                        <form onSubmit={handleEditSubmit}>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={labelStyle}>Department Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                                <button type="button" onClick={closeModals} style={buttonStyle}>Cancel</button>
                                <button type="submit" disabled={isSubmitting} style={{ ...primaryButtonStyle, opacity: isSubmitting ? 0.5 : 1 }}>
                                    {isSubmitting ? "Updating..." : "Update"}
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
                        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#1f2937" }}>Delete Department</h2>
                        <p style={{ color: "#4b5563", marginBottom: "1.5rem" }}>
                            Are you sure you want to delete <strong>{selectedDepartment?.name}</strong>?
                            This action cannot be undone.
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                            <button onClick={closeModals} style={buttonStyle}>Cancel</button>
                            <button onClick={handleDeleteSubmit} disabled={isSubmitting} style={{ ...primaryButtonStyle, backgroundColor: "#dc2626", opacity: isSubmitting ? 0.5 : 1 }}>
                                {isSubmitting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentsPage;
