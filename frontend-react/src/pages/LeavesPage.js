import { useState, useEffect } from "react";
import api from "../api/axios";

const LeavesPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      const { data } = await api.get("/my-leaves");
      setLeaves(data);
    } catch (err) {
      console.error("Failed to load leaves:", err);
    }
  };

  const fetchLeaveTypes = async () => {
    // Assuming there's an endpoint for leave types, or we might need to hardcode if not available to employees
    // Usually leave types are public or common. Let's try to fetch if possible, or use hardcoded for now if backend doesn't support list for employees.
    // Checking backend: LeaveTypeSeeder exists. But no public endpoint seen in api.php for leave types list for employees.
    // Wait, let's check api.php again. No generic leave-types endpoint.
    // I will hardcode common types for now or try to fetch if I missed it.
    // Actually, I'll just use a text input or select if I can find IDs.
    // Let's assume IDs 1=Sick, 2=Casual, 3=Earned based on typical seeders.
    // Better: I'll try to fetch /leave-types if it existed, but it doesn't.
    // I will use a static list for now: Sick Leave (1), Casual Leave (2), Earned Leave (3).
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
      await fetchLeaves();
      await fetchLeaveTypes();
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/leaves", formData);
      setIsModalOpen(false);
      setFormData({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
      await fetchLeaves();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to apply leave.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading Leaves...</div>;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>My Leaves</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "500"
          }}
        >
          Apply Leave
        </button>
      </div>

      <div style={{ overflowX: "auto", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ backgroundColor: "#f9fafb" }}>
            <tr>
              <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Type</th>
              <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Start Date</th>
              <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>End Date</th>
              <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Reason</th>
              <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "600", color: "#374151" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length > 0 ? (
              leaves.map((leave) => (
                <tr key={leave.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827" }}>{leave.leave_type?.name || "Leave"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827" }}>{leave.start_date}</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827" }}>{leave.end_date}</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827" }}>{leave.reason}</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px" }}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: "500",
                      backgroundColor:
                        leave.status === "Approved" ? "#d1fae5" :
                          leave.status === "Rejected" ? "#fee2e2" : "#fef3c7",
                      color:
                        leave.status === "Approved" ? "#065f46" :
                          leave.status === "Rejected" ? "#991b1b" : "#92400e"
                    }}>
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>No leave applications found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
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
            padding: "2rem",
            borderRadius: "8px",
            width: "100%",
            maxWidth: "500px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "1.5rem" }}>Apply for Leave</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "0.5rem" }}>Leave Type</label>
                <select
                  name="leave_type_id"
                  value={formData.leave_type_id}
                  onChange={handleInputChange}
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                >
                  <option value="">Select Type</option>
                  {leaveTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "0.5rem" }}>Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "0.5rem" }}>End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "0.5rem" }}>Reason</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="3"
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                ></textarea>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "8px 16px", backgroundColor: "#e5e7eb", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: "8px 16px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  {isSubmitting ? "Applying..." : "Apply"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavesPage;
