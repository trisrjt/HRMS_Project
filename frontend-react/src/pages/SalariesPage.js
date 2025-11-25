import { useState, useEffect } from "react";
import api from "../api/axios";

const SalariesPage = () => {
  const [salary, setSalary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalary = async () => {
      try {
        const { data } = await api.get("/my-salary");
        setSalary(data);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError("Salary details not found.");
        } else {
          setError("Failed to load salary details.");
        }
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalary();
  }, []);

  if (isLoading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading Salary...</div>;
  if (error) return <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "1.5rem" }}>My Salary Structure</h1>

      <div style={{
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "1rem", color: "#374151" }}>Earnings</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                <span style={{ color: "#6b7280" }}>Basic Salary</span>
                <span style={{ fontWeight: "600" }}>${Number(salary?.basic).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                <span style={{ color: "#6b7280" }}>HRA</span>
                <span style={{ fontWeight: "600" }}>${Number(salary?.hra).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                <span style={{ color: "#6b7280" }}>DA</span>
                <span style={{ fontWeight: "600" }}>${Number(salary?.da).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "1rem", color: "#374151" }}>Deductions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                <span style={{ color: "#6b7280" }}>Total Deductions</span>
                <span style={{ fontWeight: "600", color: "#ef4444" }}>-${Number(salary?.deductions).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "2px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}>Gross Salary</span>
          <span style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>${Number(salary?.gross_salary).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default SalariesPage;
