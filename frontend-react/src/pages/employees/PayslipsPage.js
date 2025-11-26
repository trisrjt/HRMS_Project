import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

// --- UI Components ---

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

// --- Helper Functions ---

const getMonthName = (monthNumber) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('default', { month: 'long' });
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
};

// --- Main Page Component ---

const PayslipsPage = () => {
    const navigate = useNavigate();
    const [payslips, setPayslips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPayslips = async () => {
            try {
                const { data } = await api.get("/my-payslips");
                setPayslips(data);
            } catch (err) {
                console.error("Fetch payslips error:", err);
                setError("Failed to load payslips.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPayslips();
    }, []);

    if (isLoading) {
        return (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                Loading payslips...
            </div>
        );
    }

    return (
        <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827" }}>My Payslips</h1>
                    <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>View your salary statements</p>
                </div>
                <div>
                    <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>

            {/* Error Alert */}
            {error && <Alert variant="error">{error}</Alert>}

            {/* Payslips List */}
            <Card>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead style={{ backgroundColor: "#f9fafb" }}>
                            <tr>
                                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Month</th>
                                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Year</th>
                                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Earnings</th>
                                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Deductions</th>
                                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Net Pay</th>
                                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Generated On</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payslips.length > 0 ? (
                                payslips.map((payslip) => (
                                    <tr key={payslip.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                        <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827" }}>
                                            {getMonthName(payslip.month)}
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827" }}>
                                            {payslip.year}
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827" }}>
                                            ${Number(payslip.total_earnings).toFixed(2)}
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: "14px", color: "#ef4444" }}>
                                            -${Number(payslip.total_deductions).toFixed(2)}
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: "600", color: "#059669" }}>
                                            ${Number(payslip.net_pay).toFixed(2)}
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: "14px", color: "#6b7280" }}>
                                            {formatDate(payslip.created_at)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>
                                        No payslips found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

        </div>
    );
};

export default PayslipsPage;
