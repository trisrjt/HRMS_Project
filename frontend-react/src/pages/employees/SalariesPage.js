import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

// --- UI Components (Simulated with inline styles) ---

const Button = ({ children, onClick, disabled, variant = "primary", style, type = "button" }) => {
    const baseStyle = {
        padding: "10px 20px",
        borderRadius: "6px",
        fontWeight: "500",
        fontSize: "14px",
        cursor: disabled ? "not-allowed" : "pointer",
        border: "none",
        transition: "background-color 0.2s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.7 : 1,
        ...style
    };

    const variants = {
        primary: { backgroundColor: "#3b82f6", color: "white" },
        secondary: { backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" },
        destructive: { backgroundColor: "#ef4444", color: "white" }
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{ ...baseStyle, ...variants[variant] }}
        >
            {children}
        </button>
    );
};

const Card = ({ children, style }) => (
    <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        ...style
    }}>
        {children}
    </div>
);

const Alert = ({ children, variant = "error" }) => (
    <div style={{
        padding: "1rem",
        borderRadius: "6px",
        marginBottom: "1rem",
        backgroundColor: variant === "error" ? "#fef2f2" : "#ecfdf5",
        border: `1px solid ${variant === "error" ? "#fecaca" : "#a7f3d0"}`,
        color: variant === "error" ? "#991b1b" : "#065f46",
        fontSize: "14px"
    }}>
        {children}
    </div>
);

// --- Main Page Component ---

const SalariesPage = () => {
    const navigate = useNavigate();
    const [salary, setSalary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSalary = async () => {
            try {
                const { data } = await api.get("/my-salary");
                // Check if the response indicates no salary record
                if (data && data.salary === null) {
                    setSalary(null);
                } else {
                    setSalary(data);
                }
            } catch (err) {
                console.error("Salary fetch error:", err);
                if (err.response && err.response.status === 404) {
                    setError("Employee profile not found or system error.");
                } else {
                    setError("Failed to load salary details.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchSalary();
    }, []);

    if (isLoading) {
        return (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                Loading Salary...
            </div>
        );
    }

    return (
        <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827" }}>My Salary</h1>
                    <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>View your salary details</p>
                </div>
                <div>
                    <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>

            {/* Error Alert */}
            {error && <Alert variant="error">{error}</Alert>}

            {/* No Salary Message */}
            {!isLoading && !error && !salary && (
                <Alert variant="info">Salary not added yet. Contact HR/Admin.</Alert>
            )}

            {/* Salary Details Card */}
            {salary && (
                <Card style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                        {/* Earnings Section */}
                        <div>
                            <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "1rem", color: "#374151", borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem" }}>Earnings</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                                    <span style={{ color: "#6b7280" }}>Basic Salary</span>
                                    <span style={{ fontWeight: "600" }}>${Number(salary.basic || 0).toFixed(2)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                                    <span style={{ color: "#6b7280" }}>HRA</span>
                                    <span style={{ fontWeight: "600" }}>${Number(salary.hra || 0).toFixed(2)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                                    <span style={{ color: "#6b7280" }}>DA</span>
                                    <span style={{ fontWeight: "600" }}>${Number(salary.da || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Deductions Section */}
                        <div>
                            <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "1rem", color: "#374151", borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem" }}>Deductions</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                                    <span style={{ color: "#6b7280" }}>Total Deductions</span>
                                    <span style={{ fontWeight: "600", color: "#ef4444" }}>-${Number(salary.deductions || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gross Salary Section */}
                    <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "2px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}>Gross Salary</span>
                        <span style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>${Number(salary.gross_salary || 0).toFixed(2)}</span>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default SalariesPage;
