import { useState, useEffect } from "react";
import api from "../api/axios";

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get("/user");
                setProfile(data);
            } catch (err) {
                setError("Failed to load profile.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (isLoading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading Profile...</div>;
    if (error) return <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>{error}</div>;

    return (
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "1.5rem" }}>My Profile</h1>

            <div style={{
                backgroundColor: "white",
                padding: "2rem",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb"
            }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem" }}>
                    <div style={{
                        width: "80px",
                        height: "80px",
                        backgroundColor: "#3b82f6",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "32px",
                        fontWeight: "bold",
                        marginRight: "1.5rem"
                    }}>
                        {profile?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 style={{ fontSize: "20px", fontWeight: "600" }}>{profile?.name}</h2>
                        <p style={{ color: "#6b7280" }}>{profile?.email}</p>
                        <span style={{
                            display: "inline-block",
                            marginTop: "0.5rem",
                            padding: "4px 12px",
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                            borderRadius: "9999px",
                            fontSize: "14px",
                            fontWeight: "500"
                        }}>
                            {profile?.role?.name || "Employee"}
                        </span>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                    <div>
                        <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "1rem", color: "#374151" }}>Personal Information</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <div>
                                <label style={{ fontSize: "12px", color: "#6b7280", display: "block" }}>Employee Code</label>
                                <div style={{ fontWeight: "500" }}>{profile?.employee?.employee_code || "N/A"}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: "12px", color: "#6b7280", display: "block" }}>Phone</label>
                                <div style={{ fontWeight: "500" }}>{profile?.employee?.phone || "N/A"}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: "12px", color: "#6b7280", display: "block" }}>Date of Joining</label>
                                <div style={{ fontWeight: "500" }}>{profile?.employee?.date_of_joining || "N/A"}</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "1rem", color: "#374151" }}>Work Information</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <div>
                                <label style={{ fontSize: "12px", color: "#6b7280", display: "block" }}>Designation</label>
                                <div style={{ fontWeight: "500" }}>{profile?.employee?.designation || "N/A"}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: "12px", color: "#6b7280", display: "block" }}>Address</label>
                                <div style={{ fontWeight: "500" }}>{profile?.employee?.address || "N/A"}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
