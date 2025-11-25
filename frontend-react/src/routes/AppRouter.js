import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import Dashboard from "../pages/Dashboard";
import EmployeesPage from "../pages/EmployeesPage";
import DepartmentsPage from "../pages/DepartmentsPage";
import DesignationsPage from "../pages/DesignationsPage";
import AttendancePage from "../pages/AttendancePage";
import LeavesPage from "../pages/LeavesPage";
import SalariesPage from "../pages/SalariesPage";
import PayslipsPage from "../pages/PayslipsPage";
import DocumentsPage from "../pages/DocumentsPage";
import RecruitmentPage from "../pages/RecruitmentPage";
import PerformanceReviewsPage from "../pages/PerformanceReviewsPage";
import AnnouncementsPage from "../pages/AnnouncementsPage";
import SettingsPage from "../pages/SettingsPage";
import ProfilePage from "../pages/ProfilePage";
import ProtectedRoute from "./ProtectedRoute";
import ProtectedLayout from "../layouts/ProtectedLayout";
import EmployeeLayout from "../components/EmployeeLayout";
import DashboardWrapper from "../components/DashboardWrapper";

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardWrapper />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <EmployeesPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <DepartmentsPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/designations"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <DesignationsPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <AttendancePage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leaves"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <LeavesPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/salaries"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <SalariesPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payslips"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <PayslipsPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <DocumentsPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/recruitment"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <RecruitmentPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/performance-reviews"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <PerformanceReviewsPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/announcements"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <AnnouncementsPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <SettingsPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <ProfilePage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;

