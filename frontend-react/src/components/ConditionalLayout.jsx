import { useAuth } from "../context/AuthContext";
import ProtectedLayout from "../layouts/ProtectedLayout";
import EmployeeLayout from "./EmployeeLayout";
import Dashboard from "../pages/Dashboard";
import DashboardPage from "../pages/admin/DashboardPage";

// This component renders different layouts based on user role
const ConditionalLayout = ({ children }) => {
  const { user } = useAuth();
  const roleId = user?.role_id;

  // Role 4 = Employee → use EmployeeLayout
  if (roleId === 4) {
    return <EmployeeLayout>{children}</EmployeeLayout>;
  }

  // Role 1, 2, 3 = Admin/HR/SuperAdmin → use ProtectedLayout
  return <ProtectedLayout>{children}</ProtectedLayout>;
};

export default ConditionalLayout;

