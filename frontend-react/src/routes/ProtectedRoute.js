import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const routeRoleMap = {
  "/dashboard": [1, 2, 3],
  "/employees": [1, 2, 3],
  "/departments": [1],
  "/designations": [1],
  "/attendance": [1, 2, 3],
  "/leaves": [1, 2, 3],
  "/salaries": [1, 2],
  "/payslips": [1, 2],
  "/documents": [1, 2, 3],
  "/recruitment": [1, 2, 3],
  "/performance-reviews": [1, 2],
  "/announcements": [1],
  "/settings": [1],
};

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { user, token, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <div>Loading...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = routeRoleMap[location.pathname];
  if (allowedRoles && !allowedRoles.includes(user.role_id)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

