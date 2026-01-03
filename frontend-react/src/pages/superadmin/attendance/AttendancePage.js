import { useState, useEffect } from "react";
import api from "../../../api/axios";
import AttendanceSummaryTable from "../../../components/admin/AttendanceSummaryTable";
import AttendanceHistoryDrawer from "../../../components/admin/AttendanceHistoryDrawer";

const SuperAdminAttendancePage = () => {
    const [summary, setSummary] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [searchTerm, setSearchTerm] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [statusFilter, setStatusFilter] = useState(""); // Today's Status: Present/Absent
    const [page, setPage] = useState(1);

    // Drawer state
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Pagination state
    const [pagination, setPagination] = useState({});

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        fetchSummary();

        // Poll every 5 seconds for real-time updates
        const intervalId = setInterval(() => {
            fetchSummary(true); // silent fetch
        }, 5000);

        return () => clearInterval(intervalId);
    }, [page, monthFilter, searchTerm, departmentId, statusFilter]);

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/departments");
            setDepartments(response.data);
        } catch (err) {
            console.error("Failed to fetch departments", err);
        }
    };

    const fetchSummary = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await api.get(`/attendance/summary`, {
                params: {
                    page: page,
                    month: monthFilter,
                    search: searchTerm,
                    department_id: departmentId,
                    status: statusFilter
                }
            });
            setSummary(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
            setError(null);
        } catch (err) {
            console.error("Failed to fetch attendance summary", err);
            if (!silent) setError("Failed to load attendance records.");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const handleDepartmentChange = (e) => {
        setDepartmentId(e.target.value);
        setPage(1);
    };

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
        setPage(1);
    };

    const handleMonthChange = (e) => {
        setMonthFilter(e.target.value);
        setPage(1);
    };

    const handleEmployeeClick = (employee) => {
        setSelectedEmployee(employee);
        setIsDrawerOpen(true);
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Overview of employee attendance for {new Date(monthFilter).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <label htmlFor="search_employee" className="sr-only">Search Employee</label>
                    <input
                        id="search_employee"
                        name="search"
                        aria-label="Search Employee"
                        autoComplete="off"
                        type="text"
                        placeholder="Search employee..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                    />

                    <label htmlFor="filter_department" className="sr-only">Filter by Department</label>
                    <select
                        id="filter_department"
                        name="department_id"
                        aria-label="Filter by Department"
                        value={departmentId}
                        onChange={handleDepartmentChange}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Departments</option>
                        {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                    </select>

                    <label htmlFor="filter_status" className="sr-only">Filter by Status</label>
                    <select
                        id="filter_status"
                        name="status"
                        aria-label="Filter by Status"
                        value={statusFilter}
                        onChange={handleStatusChange}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status (Today)</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </select>
                    <label htmlFor="month_filter" className="sr-only">Filter by Month</label>
                    <input
                        id="month_filter"
                        name="month"
                        aria-label="Filter by Month"
                        type="month"
                        value={monthFilter}
                        onChange={handleMonthChange}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {error ? (
                <div className="text-center p-8 bg-red-50 text-red-600 rounded-lg border border-red-200">
                    {error}
                    <button
                        onClick={() => fetchSummary()}
                        className="ml-4 text-blue-600 hover:underline"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <AttendanceSummaryTable
                    summary={summary}
                    loading={loading}
                    onEmployeeClick={handleEmployeeClick}
                />
            )}

            {!loading && summary.length > 0 && (
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} employees
                    </p>
                    {pagination.last_page > 1 && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md">
                                Page {page} of {pagination.last_page}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                                disabled={page === pagination.last_page}
                                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            <AttendanceHistoryDrawer
                employee={selectedEmployee}
                isOpen={isDrawerOpen}
                month={monthFilter}
                onClose={() => setIsDrawerOpen(false)}
            />
        </div>
    );
};

export default SuperAdminAttendancePage;

