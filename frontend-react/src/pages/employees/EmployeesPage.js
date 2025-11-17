import { useEffect, useState } from "react";
import api from "../../api/axios";

// Minimal toast helper using window.alert for now
const toast = {
  success: (msg) => window.alert(msg),
  error: (msg) => window.alert(msg),
};

const defaultFormState = {
  user_id: "",
  employee_code: "",
  department_id: "",
  role_id: "",
  designation: "",
  salary: "",
  date_of_joining: "",
  phone: "",
  address: "",
};

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.get("/employees");
      const data = Array.isArray(response.data) ? response.data : [];
      setEmployees(data);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to load employees. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenModal = () => {
    setFormValues(defaultFormState);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateEmployee = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post("/employees", {
        user_id: formValues.user_id || null,
        employee_code: formValues.employee_code || "",
        department_id: formValues.department_id || null,
        role_id: formValues.role_id || null,
        designation: formValues.designation || "",
        salary: formValues.salary || null,
        date_of_joining: formValues.date_of_joining || null,
        phone: formValues.phone || "",
        address: formValues.address || "",
      });

      toast.success("Employee created successfully.");
      setIsModalOpen(false);
      setFormValues(defaultFormState);
      await fetchEmployees();
    } catch (err) {
      let message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to create employee.";

      // Handle typical Laravel 422 validation errors
      if (err?.response?.status === 422 && err.response.data?.errors) {
        const firstErrorKey = Object.keys(err.response.data.errors)[0];
        if (firstErrorKey) {
          message = err.response.data.errors[firstErrorKey][0];
        }
      }

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h1>Employees</h1>
        <button
          type="button"
          onClick={handleOpenModal}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            border: "1px solid #2563eb",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          New Employee
        </button>
      </div>

      {isLoading && <p>Loading employees...</p>}

      {!isLoading && error && <p style={{ color: "red" }}>{error}</p>}

      {!isLoading && !error && employees.length === 0 && <p>No employees found.</p>}

      {!isLoading && !error && employees.length > 0 && (
        <div style={{ overflowX: "auto", marginTop: "1rem" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "700px",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Employee Code</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Designation</th>
                <th style={thStyle}>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td style={tdStyle}>{emp.user?.name || "-"}</td>
                  <td style={tdStyle}>{emp.user?.email || "-"}</td>
                  <td style={tdStyle}>{emp.employee_code || "-"}</td>
                  <td style={tdStyle}>{emp.department?.name || "-"}</td>
                  <td style={tdStyle}>{emp.designation || "-"}</td>
                  <td style={tdStyle}>{emp.date_of_joining || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              width: "100%",
              maxWidth: "480px",
              boxSizing: "border-box",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>Create Employee</h2>
            <form
              onSubmit={handleCreateEmployee}
              style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              <label style={labelStyle}>
                User ID
                <input
                  type="number"
                  name="user_id"
                  value={formValues.user_id}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Employee Code
                <input
                  type="text"
                  name="employee_code"
                  value={formValues.employee_code}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Department ID
                <input
                  type="number"
                  name="department_id"
                  value={formValues.department_id}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Role ID
                <input
                  type="number"
                  name="role_id"
                  value={formValues.role_id}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Designation
                <input
                  type="text"
                  name="designation"
                  value={formValues.designation}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Salary
                <input
                  type="number"
                  name="salary"
                  value={formValues.salary}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Date of Joining
                <input
                  type="date"
                  name="date_of_joining"
                  value={formValues.date_of_joining}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Phone
                <input
                  type="text"
                  name="phone"
                  value={formValues.phone}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Address
                <input
                  type="text"
                  name="address"
                  value={formValues.address}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </label>

              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  style={{
                    padding: "0.4rem 0.9rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "0.4rem 0.9rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #2563eb",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  {isSubmitting ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: "0.5rem",
  fontSize: "0.875rem",
  fontWeight: 600,
};

const tdStyle = {
  borderBottom: "1px solid #f3f4f6",
  padding: "0.5rem",
  fontSize: "0.875rem",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  fontSize: "0.85rem",
  gap: "0.25rem",
};

const inputStyle = {
  padding: "0.4rem 0.5rem",
  borderRadius: "0.375rem",
  border: "1px solid #e5e7eb",
  fontSize: "0.85rem",
};

export default EmployeesPage;


