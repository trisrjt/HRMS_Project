import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// AUTH
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import NotificationsPage from "../pages/common/NotificationsPage";
import ChangePasswordPage from "../pages/ChangePasswordPage";

// LAYOUTS
import EmployeeLayout from "../layouts/EmployeeLayout";
import AdminLayout from "../layouts/AdminLayout";
import HRLayout from "../layouts/HRLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";

// EMPLOYEE PAGES
import EmployeeDashboard from "../pages/employees/DashboardPage";
import EmployeeAttendance from "../pages/employees/AttendancePage";
import EmployeeLeaves from "../pages/employees/LeavesPage";
import EmployeeSalaries from "../pages/employees/SalariesPage";
import EmployeePayslips from "../pages/employees/PayslipsPage";
import EmployeeProfile from "../pages/employees/ProfilePage";
import EmployeeAnnouncements from "../pages/employees/AnnouncementsPage";

// ADMIN PAGES
import AdminDashboard from "../pages/admin/DashboardPage";
import AdminEmployees from "../pages/admin/EmployeesPage";
import AdminDepartments from "../pages/admin/DepartmentsPage";
import AdminDesignations from "../pages/admin/DesignationsPage";
import AdminDocuments from "../pages/admin/DocumentsPage";
import AdminRecruitment from "../pages/admin/RecruitmentPage";
import AdminPerformanceReviews from "../pages/admin/PerformanceReviewsPage";
import AdminAnnouncements from "../pages/admin/AnnouncementsPage";
import AdminSettings from "../pages/admin/SettingsPage";
import AdminLeaves from "../pages/admin/LeavesPage";
import AdminAttendance from "../pages/admin/AttendancePage";
import AdminSalaries from "../pages/admin/SalariesPage";
import AdminPayslips from "../pages/admin/PayslipsPage";

// HR PAGES
import HRDashboard from "../pages/hr/DashboardPage";
import HRLeaves from "../pages/hr/LeavesPage";
import HRAttendance from "../pages/hr/AttendancePage";
import HRRecruitment from "../pages/hr/RecruitmentPage";
import HREmployees from "../pages/hr/EmployeesPage";

// SUPERADMIN PAGES
import SuperAdminDashboard from "../pages/superadmin/DashboardPage";
import SuperAdminSettings from "../pages/superadmin/SettingsPage";
import SuperAdminEmployees from "../pages/superadmin/EmployeesPage";
import SuperAdminEmployeeAttendance from "../pages/superadmin/EmployeeAttendancePage";
import SuperAdminDepartments from "../pages/superadmin/DepartmentsPage";
import SuperAdminAttendance from "../pages/superadmin/AttendancePage";
import SuperAdminLeaves from "../pages/superadmin/LeavesPage";
import SuperAdminRecruitment from "../pages/superadmin/RecruitmentPage";
import SuperAdminDesignations from "../pages/superadmin/DesignationsPage";
import SuperAdminDocuments from "../pages/superadmin/DocumentsPage";
import SuperAdminSalaries from "../pages/superadmin/SalariesPage";
import SuperAdminPayslips from "../pages/superadmin/PayslipsPage";
import SuperAdminPerformanceReviews from "../pages/superadmin/PerformanceReviewsPage";
import SuperAdminAnnouncements from "../pages/superadmin/AnnouncementsPage";
import SuperAdminActivityLog from "../pages/superadmin/ActivityLogPage";
import SuperAdminUserManagement from "../pages/superadmin/UserManagementPage";
import SuperAdminReports from "../pages/superadmin/ReportsPage";
import SuperAdminSystemControls from "../pages/superadmin/SystemControlsPage";

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      {/* LOGIN */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* COMMON PROTECTED ROUTES */}
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

      {/* EMPLOYEE PORTAL (Role 4) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={[4]}>
            <EmployeeLayout>
              <EmployeeDashboard />
            </EmployeeLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute roles={[4]}>
            <EmployeeLayout>
              <EmployeeProfile />
            </EmployeeLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute roles={[4]}>
            <EmployeeLayout>
              <EmployeeAttendance />
            </EmployeeLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaves"
        element={
          <ProtectedRoute roles={[4]}>
            <EmployeeLayout>
              <EmployeeLeaves />
            </EmployeeLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/salary"
        element={
          <ProtectedRoute roles={[4]}>
            <EmployeeLayout>
              <EmployeeSalaries />
            </EmployeeLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payslips"
        element={
          <ProtectedRoute roles={[4]}>
            <EmployeeLayout>
              <EmployeePayslips />
            </EmployeeLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/announcements"
        element={
          <ProtectedRoute roles={[4]}>
            <EmployeeLayout>
              <EmployeeAnnouncements />
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
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <ProtectedRoute roles={[2]}>
            <AdminLayout>
              <AdminEmployees />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute roles={[2]}>
            <AdminLayout>
              <AdminDepartments />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoute roles={[2]}>
            <AdminLayout>
              <AdminAttendance />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/leaves"
        element={
          <ProtectedRoute roles={[2]}>
            <AdminLayout>
              <AdminLeaves />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payslips"
        element={
          <ProtectedRoute roles={[2]}>
            <AdminLayout>
              <AdminPayslips />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/recruitment"
        element={
          <ProtectedRoute roles={[2]}>
            <AdminLayout>
              <AdminRecruitment />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute roles={[2]}>
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* SUPERADMIN PORTAL (Role 1) */}
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
        path="/superadmin/recruitment"
        element={
          <ProtectedRoute roles={[1]}>
            <SuperAdminLayout>
              <SuperAdminRecruitment />
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
              <SuperAdminDocuments />
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
        path="/superadmin/settings"
        element={
          <ProtectedRoute roles={[1]}>
            <SuperAdminLayout>
              <SuperAdminSettings />
            </SuperAdminLayout>
          </ProtectedRoute>
        }
      />

      {/* DEFAULT */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
