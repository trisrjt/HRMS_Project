import { useAuth } from "../context/AuthContext";
import Dashboard from "../pages/Dashboard";
import DashboardPage from "../pages/DashboardPage";
import ProtectedLayout from "../layouts/ProtectedLayout";
import EmployeeLayout from "./EmployeeLayout";

// Renders the appropriate dashboard with correct layout based on user role
const DashboardWrapper = () => {
  const { user } = useAuth();
  const roleId = user?.role_id;

  // Role 4 = Employee → use Employee Dashboard with Employee Layout
  if (roleId === 4) {
    return (
      <EmployeeLayout>
        <Dashboard />
      </EmployeeLayout>
    );
  }

  // Role 1, 2, 3 = Admin/HR/SuperAdmin → use Admin Dashboard with Protected Layout
  return (
    <ProtectedLayout>
      <DashboardPage />
    </ProtectedLayout>
  );
};

export default DashboardWrapper;

