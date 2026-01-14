import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useAuth } from "../context/AuthContext";

// AUTH
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
// Lazy load non-critical common pages if desired, but kept static for now
import NotificationsPage from "../pages/superadmin/communication/NotificationsPage";
import ChangePasswordPage from "../pages/ChangePasswordPage";

// LAYOUTS
import EmployeeLayout from "../layouts/EmployeeLayout";
import AdminLayout from "../layouts/AdminLayout";
import HRLayout from "../layouts/HRLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";

// ADMIN PAGES
// import AdminDashboard from "../pages/admin/DashboardPage";
import AdminEmployees from "../pages/admin/EmployeesPage";
import AdminDepartments from "../pages/admin/DepartmentsPage";
// import AdminDesignations from "../pages/admin/DesignationsPage"; // Converted to lazy

import AdminRecruitment from "../pages/admin/RecruitmentPage";
import AdminPerformanceReviews from "../pages/admin/PerformanceReviewsPage";
import AdminAnnouncements from "../pages/admin/AnnouncementsPage";
import AdminSettings from "../pages/admin/SettingsPage";
import AdminLeaves from "../pages/admin/LeavesPage";
// import AdminAttendance from "../pages/admin/AttendancePage";
import AdminSalaries from "../pages/superadmin/payroll/SalariesPage"; // Reuse robust component
import AdminPayslips from "../pages/admin/PayslipsPage";
import AdminCreateEmployee from "../pages/admin/CreateEmployeePage";

// HR PAGES (Using Wrapper Components)
import HRDashboard from "../pages/hr/DashboardPage";
import HREmployees from "../pages/hr/EmployeesPage";
import HRDepartments from "../pages/hr/DepartmentsPage";
// import HRDesignations from "../pages/hr/DesignationsPage"; // Lazy Loaded
import HRAttendance from "../pages/hr/AttendancePage";
import HRLeaves from "../pages/hr/LeavesPage";
import HRHolidays from "../pages/hr/HolidaysPage";
import HRLeavePolicies from "../pages/hr/LeavePoliciesPage";
import HRRecruitment from "../pages/hr/RecruitmentPage";
import HRAnnouncements from "../pages/hr/AnnouncementsPage";
import HRPayrollSettings from "../pages/hr/PayrollSettingsPage";
import HRSalaries from "../pages/hr/SalariesPage";
import HRPayslips from "../pages/hr/PayslipsPage";
import HRReports from "../pages/hr/ReportsPage";
import HRDocuments from "../pages/hr/DocumentsPage";
import HRPerformanceReviews from "../pages/hr/PerformanceReviewsPage";

// SUPERADMIN PAGES
import SuperAdminDashboard from "../pages/superadmin/dashboard/DashboardPage";
import SuperAdminSettings from "../pages/superadmin/system/SettingsPage";
import SuperAdminEmployees from "../pages/superadmin/employees/EmployeesPage";
import SuperAdminEmployeeAttendance from "../pages/superadmin/employees/EmployeeAttendancePage";
import SuperAdminDepartments from "../pages/superadmin/organization/DepartmentsPage";
import SuperAdminAttendance from "../pages/superadmin/attendance/AttendancePage";
import SuperAdminLeaves from "../pages/superadmin/attendance/LeavesPage";
import SuperAdminRecruitment from "../pages/superadmin/employees/RecruitmentPage";
// import SuperAdminDesignations from "../pages/superadmin/organization/DesignationsPage"; // Converted to lazy
// UNIFIED DOCUMENT PAGE (Using logic in SuperAdminDocuments)
import EmployeeDocumentsPage from "../pages/superadmin/organization/DocumentsPage";

// ... [Keep other imports]

import SuperAdminPayrollSettings from "../pages/admin/PayrollSettingsPage";
import SuperAdminReports from "../pages/superadmin/dashboard/ReportsPage";
import SuperAdminSystemControls from "../pages/superadmin/system/SystemControlsPage";
import SuperAdminCreateUser from "../pages/superadmin/employees/CreateEmployeePage";
import EmployeeProfilePage from "../pages/superadmin/employees/EmployeeProfilePage";
import SuperAdminHolidays from "../pages/superadmin/policies/HolidayPage";
import SuperAdminLeavePolicies from "../pages/superadmin/policies/LeavePoliciesPage";
import SuperAdminSalaries from "../pages/superadmin/payroll/SalariesPage";
import SuperAdminPayslips from "../pages/superadmin/payroll/PayslipsPage";
import SuperAdminPerformanceReviews from "../pages/superadmin/employees/PerformanceReviewsPage";
import SuperAdminAnnouncements from "../pages/superadmin/communication/AnnouncementsPage";
import SuperAdminActivityLog from "../pages/superadmin/system/ActivityLogPage";
import SuperAdminUserManagement from "../pages/superadmin/users/UserManagementPage";

// --- LAZY LOADED EMPLOYEE PAGES ---
const EmployeeDashboard = lazy(() => import("../pages/employees/DashboardPage"));
const EmployeeMyTeam = lazy(() => import("../pages/employees/MyTeamPage"));
const EmployeeAttendance = lazy(() => import("../pages/employees/AttendancePage"));
const EmployeeLeaves = lazy(() => import("../pages/employees/LeavesPage"));
const EmployeeSalaries = lazy(() => import("../pages/employees/SalariesPage"));
const EmployeePayslips = lazy(() => import("../pages/employees/PayslipsPage"));
const EmployeeProfile = lazy(() => import("../pages/employees/ProfilePage"));
const EmployeeAnnouncements = lazy(() => import("../pages/employees/AnnouncementsPage"));
const EmployeeEmailSettings = lazy(() => import("../pages/employees/EmailSettingsPage"));
const EmployeeHolidayCalendar = lazy(() => import("../pages/employees/HolidayCalendarPage"));

// ...


const AdminDesignations = lazy(() => import("../pages/admin/DesignationsPage"));
const HRDesignations = lazy(() => import("../pages/hr/DesignationsPage"));
const SuperAdminDesignations = lazy(() => import("../pages/superadmin/organization/DesignationsPage"));


// Loading Component
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading...</p>
    </div>
  </div>
);

// Role-based redirect component
const RoleBasedRedirect = () => {
  const { user, token, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <LoadingFallback />;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  switch (user.role_id) {
    case 4:
      return <Navigate to="/employee/dashboard" replace />;
    case 3:
      return <Navigate to="/hr/dashboard" replace />;
    case 2:
      return <Navigate to="/admin/dashboard" replace />;
    case 1:
      return <Navigate to="/superadmin/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* LOGIN */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* COMMON PROTECTED ROUTES */}
        {/* COMMON PROTECTED ROUTES */}
        {/* /notifications removed in favor of role-specific routes */}

        {/* EMPLOYEE PORTAL (Role 4) */}
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute roles={[4]}>
              <EmployeeLayout>
                <EmployeeDashboard />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/my-team"
          element={
            <ProtectedRoute roles={[4]}>
              <EmployeeLayout>
                <EmployeeMyTeam />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/profile"
          element={
            <ProtectedRoute roles={[4]}>
              <EmployeeLayout>
                <EmployeeProfile />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/documents"
          element={
            <ProtectedRoute roles={[4]}>
              <EmployeeLayout>
                <EmployeeDocumentsPage />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/attendance"
          element={
            <ProtectedRoute roles={[4]}>
              <EmployeeLayout>
                <EmployeeAttendance />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/leaves"
          element={
            <ProtectedRoute roles={[4]}>
              <EmployeeLayout>
                <EmployeeLeaves />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/salary"
          element={
            <ProtectedRoute roles={[4]}>
              <EmployeeLayout>
                <EmployeeSalaries />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/payslips"
          element={
            <ProtectedRoute roles={[4]}>
              <EmployeeLayout>
                <EmployeePayslips />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/announcements"
          element={
            <ProtectedRoute roles={[4]}>
              <EmployeeLayout>
                <EmployeeAnnouncements />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/email-settings"
          element={
            <ProtectedRoute roles={[4]}>
              <EmployeeLayout>
                <EmployeeEmailSettings />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/notifications"
          element={
            <ProtectedRoute roles={[4]}>
              <EmployeeLayout>
                <NotificationsPage />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/holidays"
          element={
            <ProtectedRoute roles={[4]}>
              <EmployeeLayout>
                <EmployeeHolidayCalendar />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />

        {/* ADMIN PORTAL (Role 2) */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <SuperAdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <SuperAdminEmployees />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees/create"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <SuperAdminCreateUser />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <SuperAdminDepartments />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/designations"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <SuperAdminDesignations />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <SuperAdminAttendance />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/leaves"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <SuperAdminLeaves />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/holidays"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <SuperAdminHolidays />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/leave-policies"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <SuperAdminLeavePolicies />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/salaries"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <SuperAdminSalaries />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payslips"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <SuperAdminPayslips />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <SuperAdminAnnouncements />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/documents"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <EmployeeDocumentsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reviews"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <SuperAdminPerformanceReviews />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <SuperAdminReports />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <NotificationsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* HR PORTAL (Role 3) */}
        <Route
          path="/hr/dashboard"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <HRDashboard />
              </HRLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/notifications"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <NotificationsPage />
              </HRLayout>
            </ProtectedRoute>
          }
        />

        {/* HR COMPONENTS (Using Wrappers) */}
        <Route
          path="/hr/employees"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <HREmployees />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/employees/:id"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <EmployeeProfilePage />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/attendance"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <HRAttendance />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/leaves"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <HRLeaves />
              </HRLayout>
            </ProtectedRoute>
          }
        />

        {/* Designations is lazy loaded */}
        <Route
          path="/hr/designations"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <HRDesignations />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/holidays"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <HRHolidays />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/leave-policies"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <HRLeavePolicies />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/announcements"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <HRAnnouncements />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/payroll-settings"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <HRPayrollSettings />
              </HRLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/salaries"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <HRSalaries />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/payslips"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <HRPayslips />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/reports"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <HRReports />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminDashboard />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/employees"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminEmployees />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/employees/:id"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <EmployeeProfilePage />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/employees/:id/attendance"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminEmployeeAttendance />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/departments"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminDepartments />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/attendance"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminAttendance />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        {/* Duplicate /hr/designations removed */}

        <Route
          path="/hr/departments"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <HRDepartments />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/documents"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <HRDocuments />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/reviews"
          element={
            <ProtectedRoute roles={[3]}>
              <HRLayout>
                <HRPerformanceReviews />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/leaves"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminLeaves />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/holidays"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminHolidays />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/leave-policies"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminLeavePolicies />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/superadmin/designations"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminDesignations />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/documents"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <EmployeeDocumentsPage />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/salaries"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminSalaries />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/payslips"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminPayslips />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/performance-reviews"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminPerformanceReviews />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/announcements"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminAnnouncements />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/notifications"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <NotificationsPage />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/activity-log"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminActivityLog />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/users"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminUserManagement />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/users/create"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminCreateUser />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/reports"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminReports />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/system-controls"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminSystemControls />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payroll-settings"
          element={
            <ProtectedRoute roles={[2]}>
              <AdminLayout>
                <SuperAdminPayrollSettings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/payroll-settings"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminPayrollSettings />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/settings"
          element={
            <ProtectedRoute roles={[1]}>
              <SuperAdminLayout>
                <SuperAdminSettings />
              </SuperAdminLayout>
            </ProtectedRoute>
          }
        />

        {/* ROOT - Redirect based on role */}
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* DEFAULT */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter >
);

export default AppRouter;
