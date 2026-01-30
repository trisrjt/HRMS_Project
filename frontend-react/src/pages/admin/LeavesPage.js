import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { formatDate } from "../../utils/dateUtils";
import { useAuth } from "../../context/AuthContext";

// --- Components ---

const StatusBadge = ({ status }) => {
    const getStatusStyle = (status) => {
        switch (status) {
            case "Approved": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "Partially Approved": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
            case "Rejected": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            case "Pending": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
            case "Withdrawn": return "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-400";
            default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        }
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyle(status)}`}>
            {status}
        </span>
    );
};

const ApprovalModal = ({ leave, isOpen, onClose, onAction }) => {
    const [action, setAction] = useState("approve");
    const [dates, setDates] = useState({ start: "", end: "" });
    const [days, setDays] = useState(0);

    useEffect(() => {
        if (leave) {
            setDates({ start: leave.start_date, end: leave.end_date });
            calculateDays(leave.start_date, leave.end_date);
        }
    }, [leave]);

    const calculateDays = (start, end) => {
        if (!start || !end) return 0;
        const diff = new Date(end) - new Date(start);
        const d = diff / (1000 * 60 * 60 * 24) + 1;
        setDays(Math.max(0, d));
    };

    const handleDateChange = (field, value) => {
        const newDates = { ...dates, [field]: value };
        setDates(newDates);
        calculateDays(newDates.start, newDates.end);
    };

    const handleSubmit = () => {
        onAction(action, dates);
    };

    if (!isOpen || !leave) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Review Leave Request</h3>
                <div className="space-y-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm dark:text-gray-300">
                        <p><strong>Employee:</strong> {leave.employee?.user?.name}</p>
                        <p><strong>Type:</strong> {leave.leave_type?.name}</p>
                        <p><strong>Reason:</strong> {leave.reason}</p>
                        <p><strong>Dates:</strong> {formatDate(leave.start_date)} to {formatDate(leave.end_date)}</p>
                    </div>

                    <div>
                        <label htmlFor="action-select" className="block text-sm font-medium mb-2 dark:text-gray-300">Action</label>
                        <select
                            id="action-select"
                            name="action"
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-white"
                        >
                            <option value="approve">Approve Full Leave</option>
                            <option value="partial">Approve Partial Leave</option>
                            <option value="reject">Reject Leave</option>
                        </select>
                    </div>

                    {action === "partial" && (
                        <div className="grid grid-cols-2 gap-3 p-3 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
                            <div>
                                <label htmlFor="start-date" className="text-xs font-bold text-blue-800 dark:text-blue-300">Start</label>
                                <input
                                    id="start-date"
                                    name="start_date"
                                    type="date"
                                    value={dates.start}
                                    min={leave.start_date}
                                    max={leave.end_date}
                                    onChange={(e) => handleDateChange("start", e.target.value)}
                                    className="w-full text-sm p-1 mt-1 rounded border dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label htmlFor="end-date" className="text-xs font-bold text-blue-800 dark:text-blue-300">End</label>
                                <input
                                    id="end-date"
                                    name="end_date"
                                    type="date"
                                    value={dates.end}
                                    min={dates.start}
                                    max={leave.end_date}
                                    onChange={(e) => handleDateChange("end", e.target.value)}
                                    className="w-full text-sm p-1 mt-1 rounded border dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                />
                            </div>
                            <div className="col-span-2 text-xs text-right font-medium text-blue-600 dark:text-blue-400">
                                Duration: {days} Days
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                        <button
                            onClick={handleSubmit}
                            className={`px-4 py-2 rounded-lg text-white font-medium ${action === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EmployeeSummaryCard = ({ group, isSelected, onClick }) => {
    const { employee, leaves } = group;
    const pendingCount = leaves.filter(l => l.status === 'Pending').length;

    // We can infer some info from the leaves present in the current page, 
    // but the backend 'approved_leaves_count' is the most reliable for 'Total Leaves Taken'.

    return (
        <div
            onClick={onClick}
            className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 mb-3 ${isSelected
                ? 'bg-blue-50 border-blue-500 shadow-md dark:bg-blue-900/20 dark:border-blue-500'
                : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                    {employee?.user?.name?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden">
                    <h4 className={`font-semibold truncate ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>
                        {employee?.user?.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {employee?.employee_code} • {employee?.department?.name}
                    </p>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="font-medium">{employee?.total_approved_days || 0}</span> Approved Days
                </div>

                {pendingCount > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-bold animate-pulse">
                        {pendingCount} Pending
                    </div>
                )}
            </div>
        </div>
    );
};

const EmployeeDetailPanel = ({ employeeId, onReview, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const canApprove = user?.role_id === 1 || user?.can_manage_leaves === true;

    useEffect(() => {
        if (employeeId) {
            fetchHistory();
        }
    }, [employeeId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Fetch ALL leaves for this employee (or paginated, but ideally a dedicated list)
            // Re-using the main endpoint with employee_id filter
            const response = await api.get("/leaves", {
                params: {
                    employee_id: employeeId,
                    per_page: 50 // Try to get more history
                }
            });
            // Ensure history is sorted by latest first (should be default from backend, but double check)
            // Backend sort is created_at desc. That's good.
            setHistory(response.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!employeeId) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                <p>Select an employee to view leave history</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-[calc(100vh-200px)] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white">Leave History</h3>
                <div className="flex items-center gap-1">
                    <button onClick={fetchHistory} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors" title="Refresh">
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                    <button onClick={onClose} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors" title="Close">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700/50 rounded-lg animate-pulse"></div>)}
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No leave history found.</div>
                ) : (
                    history.map(leave => (
                        <div key={leave.id} className="relative bg-white dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">

                            {/* Status Stripe */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${leave.status === 'Approved' ? 'bg-green-500' :
                                leave.status === 'Rejected' ? 'bg-red-500' :
                                    leave.status === 'Pending' ? 'bg-orange-500' :
                                        'bg-gray-300'
                                }`}></div>

                            <div className="pl-3">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{leave.leave_type?.name}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(leave.start_date)} - {formatDate(leave.end_date)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {leave.status === 'Partially Approved' && leave.approved_start_date && leave.approved_end_date && (
                                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                                                {Math.round((new Date(leave.approved_end_date) - new Date(leave.approved_start_date)) / (1000 * 60 * 60 * 24)) + 1} Days
                                            </span>
                                        )}
                                        <StatusBadge status={leave.status} />
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded mb-2">
                                    {leave.reason}
                                </p>

                                {leave.approver && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                                        <span className="font-medium">Approved by:</span>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">{leave.approver.name}</span>
                                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                            {leave.approver.role_id === 1 ? 'SuperAdmin' :
                                                leave.approver.role_id === 2 ? 'Admin' :
                                                    leave.approver.role_id === 3 ? 'HR' : 'Employee'}
                                        </span>
                                    </div>
                                )}

                                {leave.status === 'Pending' && canApprove && (
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => onReview(leave)}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors flex items-center gap-1"
                                        >
                                            Review Request
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- Main Page ---

const LeavesPage = () => {
    // State
    const [leaves, setLeaves] = useState([]);
    const [groupedLeaves, setGroupedLeaves] = useState({});
    const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [departments, setDepartments] = useState([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [pageInfo, setPageInfo] = useState({ current_page: 1, last_page: 1 });
    const [refreshKey, setRefreshKey] = useState(0); // To force panel refresh

    // Modal State
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filters
    const [search, setSearch] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [status, setStatus] = useState("");
    const [month, setMonth] = useState("");

    // Initial Load
    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        loadLeaves();
        loadSummary();
    }, [pageInfo.current_page]);

    // Reset page when filters change
    useEffect(() => {
        if (pageInfo.current_page !== 1) {
            setPageInfo(prev => ({ ...prev, current_page: 1 }));
        } else {
            loadLeaves();
            loadSummary();
        }
    }, [departmentId, status, month]);

    // Polling for automated updates (e.g. every 15 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            // Only poll if on first page and no active filters (optional constraint)
            if (pageInfo.current_page === 1 && !search && !departmentId && !status && !month) {
                loadLeaves(true); // silent fetch
                loadSummary();
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [pageInfo.current_page, search, departmentId, status, month]);

    // Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (pageInfo.current_page === 1) loadLeaves();
            else setPageInfo(prev => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/departments");
            setDepartments(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadLeaves = async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const params = {
                page: pageInfo.current_page,
                search,
                department_id: departmentId,
                status,
                month
            };
            const response = await api.get("/leaves", { params });
            const { data, current_page, last_page } = response.data;

            setLeaves(data);
            groupData(data);
            setPageInfo({ current_page, last_page });

            // Auto-select first employee if none selected and data exists
            if (data.length > 0 && !selectedEmployeeId) {
                // setSelectedEmployeeId(data[0].employee_id);
            }
        } catch (err) {
            console.error(err);
            if (!silent) setError("Failed to load leave applications.");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const groupData = (data) => {
        const groups = data.reduce((acc, leave) => {
            const empId = leave.employee_id;
            if (!acc[empId]) {
                acc[empId] = {
                    employee: leave.employee,
                    leaves: []
                };
            }
            acc[empId].leaves.push(leave);
            return acc;
        }, {});
        setGroupedLeaves(groups);
    };

    const loadSummary = async () => {
        try {
            const response = await api.get("/leaves/summary", { params: { month } });
            setSummary(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const forcePanelRefresh = () => setRefreshKey(k => k + 1);

    const handleAction = async (action, dates) => {
        if (!selectedLeave) return;
        const id = selectedLeave.id;

        try {
            if (action === "approve") {
                await api.put(`/leaves/${id}`, { status: 'Approved' });
            } else if (action === "reject") {
                await api.put(`/leaves/${id}`, { status: 'Rejected' });
            } else if (action === "partial") {
                await api.put(`/leaves/${id}/partial-approve`, {
                    approved_start_date: dates.start,
                    approved_end_date: dates.end
                });
            }
            setIsModalOpen(false);
            loadLeaves();
            loadSummary();
            forcePanelRefresh();
        } catch (err) {
            alert("Failed to update status.");
        }
    };

    return (
        <div className="p-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaves Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Grouped by Employee</p>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Total Leaves</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <div className="text-2xl font-bold text-orange-600">{summary.pending}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Pending</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <div className="text-2xl font-bold text-green-600">{summary.approved}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Approved</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <div className="text-2xl font-bold text-red-600">{summary.rejected}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Rejected</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-wrap gap-4">
                <label htmlFor="employee-search" className="sr-only">Search Employee</label>
                <input
                    id="employee-search"
                    name="employee_search"
                    placeholder="Search employee..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="p-2 border rounded-lg bg-transparent dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="department-filter" className="sr-only">Filter by Department</label>
                <select
                    id="department-filter"
                    name="department_filter"
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    className="p-2 border rounded-lg bg-transparent dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <label htmlFor="status-filter" className="sr-only">Filter by Status</label>
                <select
                    id="status-filter"
                    name="status_filter"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="p-2 border rounded-lg bg-transparent dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Column: List */}
                <div className="lg:col-span-4 space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : error ? (
                        <div className="text-red-500 text-center">{error}</div>
                    ) : Object.keys(groupedLeaves).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No records found.</div>
                    ) : (
                        // Force sort by most recent leave in group
                        Object.values(groupedLeaves)
                            .sort((a, b) => {
                                const dateA = new Date(a.leaves[0]?.created_at || 0);
                                const dateB = new Date(b.leaves[0]?.created_at || 0);
                                return dateB - dateA;
                            })
                            .map(group => (
                                <EmployeeSummaryCard
                                    key={group.employee.id}
                                    group={group}
                                    isSelected={selectedEmployeeId == group.employee.id}
                                    onClick={() => setSelectedEmployeeId(group.employee.id)}
                                />
                            ))
                    )}

                    {/* Pagination for List */}
                    {pageInfo.last_page > 1 && (
                        <div className="flex justify-center gap-2 pt-4">
                            <button
                                onClick={() => setPageInfo(p => ({ ...p, current_page: Math.max(1, p.current_page - 1) }))}
                                disabled={pageInfo.current_page === 1}
                                className="px-3 py-1 text-xs border rounded bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300">
                                {pageInfo.current_page} / {pageInfo.last_page}
                            </span>
                            <button
                                onClick={() => setPageInfo(p => ({ ...p, current_page: Math.min(pageInfo.last_page, p.current_page + 1) }))}
                                disabled={pageInfo.current_page === pageInfo.last_page}
                                className="px-3 py-1 text-xs border rounded bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column: Detail */}
                <div className="lg:col-span-8 sticky top-6">
                    <EmployeeDetailPanel
                        key={`${selectedEmployeeId}-${refreshKey}`}
                        employeeId={selectedEmployeeId}
                        onReview={(leave) => {
                            setSelectedLeave(leave);
                            setIsModalOpen(true);
                        }}
                        onClose={() => setSelectedEmployeeId(null)}
                    />
                </div>
            </div>

            <ApprovalModal
                leave={selectedLeave}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAction={handleAction}
            />
        </div>
    );
};

export default LeavesPage;
