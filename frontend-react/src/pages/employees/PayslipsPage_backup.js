import { useState, useEffect } from "react";
import api from "../api/axios";

const PayslipsPage = () => {
  const [payslips, setPayslips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        const { data } = await api.get("/my-payslips");
        setPayslips(data);
      } catch (err) {
        setError("Failed to load payslips.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayslips();
  }, []);

  if (isLoading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading Payslips...</div>;
  if (error) return <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "2rem" }}>My Payslips</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {payslips.length > 0 ? (
          payslips.map((payslip) => (
            <div key={payslip.id} style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
              padding: "1.5rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>
                  {new Date(0, payslip.month - 1).toLocaleString('default', { month: 'long' })} {payslip.year}
                </h3>
                <span style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  backgroundColor: "#f3f4f6",
                  padding: "2px 8px",
                  borderRadius: "9999px"
                }}>
                  #{payslip.id}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: "#6b7280" }}>Total Earnings</span>
                  <span style={{ fontWeight: "500" }}>${Number(payslip.total_earnings).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: "#6b7280" }}>Deductions</span>
                  <span style={{ fontWeight: "500", color: "#ef4444" }}>-${Number(payslip.total_deductions).toFixed(2)}</span>
                </div>
              </div>

              <div style={{
                borderTop: "1px solid #e5e7eb",
                paddingTop: "1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ fontWeight: "600", color: "#374151" }}>Net Pay</span>
                <span style={{ fontSize: "18px", fontWeight: "bold", color: "#10b981" }}>
                  ${Number(payslip.net_pay).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "#6b7280", padding: "2rem" }}>
            No payslips found.
          </div>
        )}
      </div>
    </div>
  );
};

export default PayslipsPage;
