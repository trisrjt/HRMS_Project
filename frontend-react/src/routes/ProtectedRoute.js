import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const routeRoleMap = {
  // Employee routes (role 4)
  "/dashboard": [4],
  "/profile": [4],
  "/attendance": [4],
  "/leaves": [4],
  "/salary": [4],
  "/payslips": [4],
  "/announcements": [4],

  // Admin routes (roles 1, 2)
  "/admin/dashboard": [1, 2],
  "/admin/employees": [1, 2],
  "/admin/leaves": [1, 2],
  "/admin/attendance": [1, 2],
  "/admin/payslips": [1, 2],
  "/admin/salaries": [1, 2],
  "/admin/departments": [1, 2],
  "/admin/designations": [1, 2],
  "/admin/announcements": [1, 2],
  "/admin/settings": [1],
  "/admin/documents": [1, 2],
  "/admin/recruitment": [1, 2],
  "/admin/performance-reviews": [1, 2],
  "/admin/profile": [1, 2],

  // HR routes (role 3)
  "/hr/dashboard": [3],
  "/hr/leaves": [3],
  "/hr/attendance": [3],
  "/hr/recruitment": [3],
  "/hr/employees": [3],

  // SuperAdmin routes (role 1)
  "/superadmin/dashboard": [1],
  "/superadmin/settings": [1],
  "/superadmin/system-controls": [1],
};

const ProtectedRoute = ({ children, roles }) => {
  const location = useLocation();
  const { user, token, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <div>Loading...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 1. Check if the route is explicitly restricted via props (legacy support or extra safety)
  if (roles && !roles.includes(user.role_id)) {
    return <Navigate to={getRedirectPath(user.role_id)} replace />;
  }

  // 2. Check routeRoleMap for the current path
  // Find longest matching prefix
  const currentPath = location.pathname;
  const matchedRoute = Object.keys(routeRoleMap).find((route) => {
    // Exact match or prefix match with slash boundary
    return currentPath === route || currentPath.startsWith(`${route}/`);
  });

  if (matchedRoute) {
    const allowedRoles = routeRoleMap[matchedRoute];
    if (!allowedRoles.includes(user.role_id)) {
      return <Navigate to={getRedirectPath(user.role_id)} replace />;
    }
  }

  return children;
};

const getRedirectPath = (roleId) => {
  switch (roleId) {
    case 4:
      return "/dashboard";
    case 3:
      return "/hr/dashboard";
    case 2:
      return "/admin/dashboard";
    case 1:
      return "/superadmin/dashboard"; // Or admin dashboard if preferred, but superadmin specific requested
    default:
      return "/login";
  }
};

export default ProtectedRoute;
