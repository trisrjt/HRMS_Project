import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const ChangePasswordPage = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [formValues, setFormValues] = useState({
        old_password: "",
        new_password: "",
        confirm_password: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (formValues.new_password !== formValues.confirm_password) {
            setError("New passwords do not match.");
            return;
        }

        if (formValues.new_password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        try {
            setIsLoading(true);
            await api.post("/change-password", {
                old_password: formValues.old_password,
                new_password: formValues.new_password,
                new_password_confirmation: formValues.confirm_password,
            });

            setSuccess("Password changed successfully! Redirecting...");

            // Optional: Clear temp password flag in local storage if we set one
            // But simpler to just redirect to dashboard
            setTimeout(() => {
                navigate("/dashboard");
            }, 2000);

        } catch (err) {
            setError(err.response?.data?.message || "Failed to change password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f3f4f6",
            padding: "20px"
        }}>
            <div style={{
                width: "100%",
                maxWidth: "400px",
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "32px"
            }}>
                <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px", textAlign: "center", color: "#1f2937" }}>
                    Change Password
                </h2>

                <p style={{ marginBottom: "20px", color: "#4b5563", fontSize: "14px", textAlign: "center" }}>
                    Please update your password to continue.
                </p>

                {error && (
                    <div style={{
                        backgroundColor: "#fee2e2",
                        color: "#dc2626",
                        padding: "12px",
                        borderRadius: "6px",
                        marginBottom: "16px",
                        fontSize: "14px"
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        backgroundColor: "#d1fae5",
                        color: "#059669",
                        padding: "12px",
                        borderRadius: "6px",
                        marginBottom: "16px",
                        fontSize: "14px"
                    }}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "4px" }}>
                            Old Password (or Temp Password)
                        </label>
                        <input
                            type="password"
                            name="old_password"
                            value={formValues.old_password}
                            onChange={handleChange}
                            required
                            style={{
                                width: "100%",
                                padding: "10px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                fontSize: "14px",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "4px" }}>
                            New Password
                        </label>
                        <input
                            type="password"
                            name="new_password"
                            value={formValues.new_password}
                            onChange={handleChange}
                            required
                            style={{
                                width: "100%",
                                padding: "10px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                fontSize: "14px",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "4px" }}>
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            name="confirm_password"
                            value={formValues.confirm_password}
                            onChange={handleChange}
                            required
                            style={{
                                width: "100%",
                                padding: "10px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                fontSize: "14px",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: "100%",
                            padding: "12px",
                            backgroundColor: isLoading ? "#9ca3af" : "#2563eb",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "16px",
                            fontWeight: "500",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            marginTop: "8px"
                        }}
                    >
                        {isLoading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
