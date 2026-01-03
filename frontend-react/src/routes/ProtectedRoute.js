import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const routeRoleMap = {
  // Employee routes (role 4)
  "/employee/dashboard": [4],
  "/employee/profile": [4],
  "/employee/attendance": [4],
  "/employee/leaves": [4],
  "/employee/salary": [4],
  "/employee/payslips": [4],
  "/employee/announcements": [4],
  "/employee/notifications": [4],

  // Admin routes (roles 2 ONLY)
  "/admin": [2],
  "/admin/dashboard": [2],
  "/admin/employees": [2],
  "/admin/leaves": [2],
  "/admin/attendance": [2],
  "/admin/payslips": [2],
  "/admin/salaries": [2],
  "/admin/departments": [2],
  "/admin/designations": [2],
  "/admin/announcements": [2],
  "/admin/settings": [2],
  "/admin/documents": [2],
  "/admin/recruitment": [2],
  "/admin/performance-reviews": [2],
  "/admin/profile": [2],
  "/admin/notifications": [2],

  // HR routes (role 3)
  "/hr": [3], // Catch-all for /hr/*
  "/hr/dashboard": [3],
  "/hr/leaves": [3],
  "/hr/attendance": [3],
  "/hr/recruitment": [3],
  "/hr/employees": [3],

  // SuperAdmin routes (role 1)
  "/superadmin": [1], // Catch-all for /superadmin/*
  "/superadmin/dashboard": [1],
  "/superadmin/employees": [1],
  "/superadmin/departments": [1],
  "/superadmin/designations": [1],
  "/superadmin/attendance": [1],
  "/superadmin/leaves": [1],
  "/superadmin/salaries": [1],
  "/superadmin/payslips": [1],
  "/superadmin/documents": [1],
  "/superadmin/recruitment": [1],
  "/superadmin/performance-reviews": [1],
  "/superadmin/announcements": [1],
  "/superadmin/settings": [1],
  "/superadmin/system-controls": [1],
  "/superadmin/notifications": [1],
  "/superadmin/activity-log": [1],
  "/superadmin/users": [1],
  "/superadmin/reports": [1],
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
      return "/employee/dashboard";
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
