import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formValues.email || !formValues.password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setIsLoading(true);
      const { data } = await api.post("/login", {
        email: formValues.email,
        password: formValues.password,
      });

      // Backend returns: { message, token, user, force_password_change }
      // OR: { message, token, user_id, force_password_change: true }
      if (data?.token) {
        // Save token to localStorage
        localStorage.setItem("token", data.token);

        // Handle forced password change if needed
        if (data?.force_password_change) {
          // Save user_id temporarily if user object not provided
          if (data.user_id) {
            localStorage.setItem("temp_user_id", data.user_id);
          }
          // Redirect to password change page (to be implemented)
          navigate("/change-password", { replace: true });
          return;
        }

        // Normal login flow
        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          // Update AuthContext state
          login(data.token, data.user);
          // Redirect based on role
          const roleId = data.user.role_id;
          let targetPath = "/dashboard"; // Default for Employee (Role 4)

          if (roleId === 1) targetPath = "/superadmin/dashboard";
          else if (roleId === 2) targetPath = "/admin/dashboard";
          else if (roleId === 3) targetPath = "/hr/dashboard";

          navigate(targetPath, { replace: true });
        } else {
          setError("Invalid response from server.");
        }
      } else {
        setError("Invalid response from server.");
      }
    } catch (err) {
      // Show "Invalid email or password" on any error
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          padding: "32px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "600",
            marginBottom: "8px",
            textAlign: "center",
            color: "#1f2937",
          }}
        >
          Login
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          Enter your credentials to access your account
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formValues.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formValues.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                color: "#dc2626",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              fontWeight: "500",
              color: "white",
              backgroundColor: isLoading ? "#9ca3af" : "#3b82f6",
              border: "none",
              borderRadius: "6px",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.target.style.backgroundColor = "#2563eb";
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.target.style.backgroundColor = "#3b82f6";
            }}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

