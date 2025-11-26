import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// AUTH
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "./ProtectedRoute";

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
import SuperAdminSystemControls from "../pages/superadmin/SystemControlsPage";

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      {/* LOGIN */}
      <Route path="/login" element={<LoginPage />} />

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

      {/* ADMIN PORTAL (Role 1 & 2) */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={[1, 2]}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <ProtectedRoute roles={[1, 2]}>
            <AdminLayout>
              <AdminEmployees />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute roles={[1, 2]}>
            <AdminLayout>
              <AdminDepartments />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/designations"
        element={
          <ProtectedRoute roles={[1, 2]}>
            <AdminLayout>
              <AdminDesignations />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/documents"
        element={
          <ProtectedRoute roles={[1, 2]}>
            <AdminLayout>
              <AdminDocuments />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/recruitment"
        element={
          <ProtectedRoute roles={[1, 2]}>
            <AdminLayout>
              <AdminRecruitment />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/performance-reviews"
        element={
          <ProtectedRoute roles={[1, 2]}>
            <AdminLayout>
              <AdminPerformanceReviews />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/announcements"
        element={
          <ProtectedRoute roles={[1, 2]}>
            <AdminLayout>
              <AdminAnnouncements />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute roles={[1, 2]}>
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/leaves"
        element={
          <ProtectedRoute roles={[1, 2]}>
            <AdminLayout>
              <AdminLeaves />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoute roles={[1, 2]}>
            <AdminLayout>
              <AdminAttendance />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/salaries"
        element={
          <ProtectedRoute roles={[1, 2]}>
            <AdminLayout>
              <AdminSalaries />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payslips"
        element={
          <ProtectedRoute roles={[1, 2]}>
            <AdminLayout>
              <AdminPayslips />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      {/* Admin Profile - Reusing EmployeeProfile or creating new? Using EmployeeProfile for now as generic profile */}
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute roles={[1, 2]}>
            <AdminLayout>
              <EmployeeProfile />
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
        path="/hr/leaves"
        element={
          <ProtectedRoute roles={[3]}>
            <HRLayout>
              <HRLeaves />
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
        path="/hr/recruitment"
        element={
          <ProtectedRoute roles={[3]}>
            <HRLayout>
              <HRRecruitment />
            </HRLayout>
          </ProtectedRoute>
        }
      />
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


      {/* SUPERADMIN PORTAL (Role 1 - assuming SuperAdmin is also Role 1 or has specific ID, using 1 for now based on request) */}
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
        path="/superadmin/settings"
        element={
          <ProtectedRoute roles={[1]}>
            <SuperAdminLayout>
              <SuperAdminSettings />
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

      {/* DEFAULT */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
