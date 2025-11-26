import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

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

const Badge = ({ children, variant = "default" }) => {
  const styles = {
    default: { bg: "#f3f4f6", color: "#374151" },
    success: { bg: "#d1fae5", color: "#065f46" },
    danger: { bg: "#fee2e2", color: "#991b1b" },
    warning: { bg: "#fef3c7", color: "#92400e" },
    info: { bg: "#dbeafe", color: "#1e40af" }
  };

  const current = styles[variant] || styles.default;

  return (
    <span style={{
      padding: "2px 8px",
      borderRadius: "9999px",
      fontSize: "12px",
      fontWeight: "500",
      backgroundColor: current.bg,
      color: current.color
    }}>
      {children}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        width: "100%",
        maxWidth: "500px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        margin: "1rem"
      }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280" }}>&times;</button>
        </div>
        <div style={{ padding: "1.5rem" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---

const LeavesPage = () => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  // Fetch Data
  const fetchLeaves = async () => {
    try {
      const { data } = await api.get("/my-leaves");
      setLeaves(data);
    } catch (err) {
      console.error("Fetch leaves error:", err);
      setError("Failed to load leave history.");
    }
  };

  const fetchLeaveTypes = async () => {
    // Hardcoded types as per previous context, or could fetch if endpoint existed
    setLeaveTypes([
      { id: 1, name: "Sick Leave" },
      { id: 2, name: "Casual Leave" },
      { id: 3, name: "Earned Leave" },
      { id: 4, name: "Unpaid Leave" }
    ]);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchLeaves(), fetchLeaveTypes()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Form Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      await api.post("/leaves", formData);
      setIsModalOpen(false);
      setFormData({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
      await fetchLeaves(); // Reload list
    } catch (err) {
      console.error("Apply leave error:", err);
      setFormError(err?.response?.data?.message || "Failed to submit leave application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "Approved": return "success";
      case "Rejected": return "danger";
      case "Pending": return "warning";
      default: return "default";
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
        Loading leaves...
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827" }}>My Leaves</h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>Manage your leave applications</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Button variant="secondary" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            Apply Leave
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Leaves List */}
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead style={{ backgroundColor: "#f9fafb" }}>
              <tr>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Type</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Dates</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Reason</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length > 0 ? (
                leaves.map((leave) => (
                  <tr key={leave.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827" }}>
                      {leave.leave_type?.name || "Leave"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>{new Date(leave.start_date).toLocaleDateString()}</span>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>to {new Date(leave.end_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827", maxWidth: "300px" }}>
                      {leave.reason}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "14px" }}>
                      <Badge variant={getStatusVariant(leave.status)}>
                        {leave.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>
                    No leave applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Apply for Leave"
      >
        {formError && <Alert variant="error">{formError}</Alert>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "0.5rem", color: "#374151" }}>Leave Type</label>
            <select
              name="leave_type_id"
              value={formData.leave_type_id}
              onChange={handleInputChange}
              required
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }}
            >
              <option value="">Select Type</option>
              {leaveTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "0.5rem", color: "#374151" }}>Start Date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "0.5rem", color: "#374151" }}>End Date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "0.5rem", color: "#374151" }}>Reason</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows="3"
              required
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", resize: "vertical" }}
              placeholder="Please provide a reason for your leave..."
            ></textarea>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Applying..." : "Apply Leave"}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default LeavesPage;
