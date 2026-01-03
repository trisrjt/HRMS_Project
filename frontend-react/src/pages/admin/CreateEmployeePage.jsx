import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const CreateEmployeePage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role_id: 4, // Locked to Employee
        temp_password: "",
        basic: "",
        hra: "",
        da: "",
        allowances: "",
        deductions: "",
        gross_salary: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (['basic', 'hra', 'da', 'allowances', 'deductions'].includes(name)) {
                const basic = parseFloat(updated.basic) || 0;
                const hra = parseFloat(updated.hra) || 0;
                const da = parseFloat(updated.da) || 0;
                const allowances = parseFloat(updated.allowances) || 0;
                const deductions = parseFloat(updated.deductions) || 0;
                updated.gross_salary = (basic + hra + da + allowances - deductions).toFixed(2);
            }
            return updated;
        });
    };

    const handleBasicChange = (e) => {
        const basic = e.target.value;
        const basicVal = parseFloat(basic) || 0;
        const hra = (basicVal * 0.40).toFixed(2);
        const da = (basicVal * 0.10).toFixed(2);
        const allowances = (basicVal * 0.05).toFixed(2);
        const deductions = (basicVal * 0.02).toFixed(2);
        const gross = (basicVal + parseFloat(hra) + parseFloat(da) + parseFloat(allowances) - parseFloat(deductions)).toFixed(2);

        setFormData(prev => ({
            ...prev,
            basic: basic,
            hra,
            da,
            allowances,
            deductions,
            gross_salary: gross
        }));
    };

    const recalculate = () => {
        const basicVal = parseFloat(formData.basic) || 0;
        const hra = (basicVal * 0.40).toFixed(2);
        const da = (basicVal * 0.10).toFixed(2);
        const allowances = (basicVal * 0.05).toFixed(2);
        const deductions = (basicVal * 0.02).toFixed(2);
        const gross = (basicVal + parseFloat(hra) + parseFloat(da) + parseFloat(allowances) - parseFloat(deductions)).toFixed(2);

        setFormData(prev => ({
            ...prev,
            hra,
            da,
            allowances,
            deductions,
            gross_salary: gross
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await api.post("/users", formData);
            setSuccess("Employee created successfully!");
            setTimeout(() => {
                navigate(`/superadmin/employees/${response.data.id}`);
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create employee.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#111827", marginBottom: "2rem" }}>Create New Employee</h1>

            {error && (
                <div style={{
                    backgroundColor: "#fee2e2", border: "1px solid #f87171", color: "#b91c1c",
                    padding: "1rem", borderRadius: "8px", marginBottom: "1rem"
                }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{
                    backgroundColor: "#d1fae5", border: "1px solid #34d399", color: "#047857",
                    padding: "1rem", borderRadius: "8px", marginBottom: "1rem"
                }}>
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{
                backgroundColor: "white", padding: "2rem", borderRadius: "12px",
                border: "1px solid #e5e7eb", boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}>
                <div style={{ marginBottom: "1.5rem" }}>
                    <label htmlFor="employee_name" style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                        Name
                    </label>
                    <input
                        id="employee_name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        autoComplete="name"
                        style={{
                            width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db",
                            fontSize: "14px", outline: "none", transition: "border-color 0.2s"
                        }}
                        required
                    />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                    <label htmlFor="employee_email" style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                        Email
                    </label>
                    <input
                        id="employee_email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                        style={{
                            width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db",
                            fontSize: "14px", outline: "none", transition: "border-color 0.2s"
                        }}
                        required
                    />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                    <label htmlFor="employee_role" style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                        Role
                    </label>
                    <input
                        id="employee_role"
                        type="text"
                        value="Employee"
                        disabled
                        style={{
                            width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db",
                            fontSize: "14px", outline: "none", backgroundColor: "#f3f4f6", color: "#6b7280", cursor: "not-allowed"
                        }}
                    />
                    <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "0.5rem" }}>Admins can only create Employees.</p>
                </div>

                <div style={{ marginBottom: "2rem" }}>
                    <label htmlFor="temp_password" style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                        Temporary Password
                    </label>
                    <input
                        id="temp_password"
                        type="text" // Using text to make it visible as it is temporary
                        name="temp_password"
                        value={formData.temp_password}
                        onChange={handleChange}
                        autoComplete="off"
                        style={{
                            width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db",
                            fontSize: "14px", outline: "none", transition: "border-color 0.2s"
                        }}
                        required
                        minLength={4}
                    />
                </div>

                {/* Salary Section */}
                <div style={{ marginBottom: "2rem", padding: "1.5rem", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>Salary Details</h3>
                        <button
                            type="button"
                            onClick={recalculate}
                            style={{
                                fontSize: "12px", padding: "0.25rem 0.75rem", backgroundColor: "#e0e7ff", color: "#4338ca",
                                border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600"
                            }}
                        >
                            Recalculate
                        </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                            <label htmlFor="basic_salary" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "0.25rem" }}>
                                Basic Salary (₹)
                            </label>
                            <input
                                id="basic_salary"
                                type="number"
                                name="basic"
                                value={formData.basic}
                                onChange={handleBasicChange}
                                style={{
                                    width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db",
                                    fontSize: "14px", outline: "none"
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="hra" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "0.25rem" }}>
                                HRA (40%)
                            </label>
                            <input
                                id="hra"
                                type="number"
                                name="hra"
                                value={formData.hra}
                                onChange={handleChange}
                                style={{
                                    width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db",
                                    fontSize: "14px", outline: "none"
                                }}
                            />
                        </div>
                        <div>
                            <label htmlFor="da" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "0.25rem" }}>
                                DA (10%)
                            </label>
                            <input
                                id="da"
                                type="number"
                                name="da"
                                value={formData.da}
                                onChange={handleChange}
                                style={{
                                    width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db",
                                    fontSize: "14px", outline: "none"
                                }}
                            />
                        </div>
                        <div>
                            <label htmlFor="allowances" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "0.25rem" }}>
                                Allowances (5%)
                            </label>
                            <input
                                id="allowances"
                                type="number"
                                name="allowances"
                                value={formData.allowances}
                                onChange={handleChange}
                                style={{
                                    width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db",
                                    fontSize: "14px", outline: "none"
                                }}
                            />
                        </div>
                        <div>
                            <label htmlFor="deductions" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "0.25rem" }}>
                                Deductions (2%)
                            </label>
                            <input
                                id="deductions"
                                type="number"
                                name="deductions"
                                value={formData.deductions}
                                onChange={handleChange}
                                style={{
                                    width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db",
                                    fontSize: "14px", outline: "none"
                                }}
                            />
                        </div>
                        <div>
                            <label htmlFor="gross_salary" style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "0.25rem" }}>
                                Gross Salary
                            </label>
                            <input
                                id="gross_salary"
                                type="number"
                                name="gross_salary"
                                value={formData.gross_salary}
                                readOnly
                                style={{
                                    width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db",
                                    fontSize: "14px", outline: "none", backgroundColor: "#f3f4f6", fontWeight: "700"
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: "0.75rem 1.5rem", backgroundColor: "#2563eb", color: "white",
                            border: "none", borderRadius: "8px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? "Creating..." : "Create Employee"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/admin/employees")}
                        style={{
                            padding: "0.75rem 1.5rem", backgroundColor: "white", color: "#374151",
                            border: "1px solid #d1d5db", borderRadius: "8px", fontWeight: "600", cursor: "pointer"
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateEmployeePage;
