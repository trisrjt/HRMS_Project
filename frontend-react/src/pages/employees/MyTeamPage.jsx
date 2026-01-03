import React, { useState, useEffect } from "react";
import axios from "../../api/axios";

const MyTeamPage = () => {
    const [activeTab, setActiveTab] = useState("members");
    const [loading, setLoading] = useState(false);

    // Data States
    const [members, setMembers] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);

    // Filters
    const [search, setSearch] = useState("");
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]); // Default Today
    const [attendanceFilterEmployeeId, setAttendanceFilterEmployeeId] = useState(""); // For Attendance Tab
    const [leaveFilterEmployeeId, setLeaveFilterEmployeeId] = useState(""); // For Leaves Tab

    // Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        fetchData();
        if (activeTab === "attendance" && attendanceFilterEmployeeId) {
            fetchHistory(attendanceFilterEmployeeId, historyMonth);
        }
    }, [activeTab, attendanceDate, attendanceFilterEmployeeId, leaveFilterEmployeeId, historyMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === "members") {
                const response = await axios.get("/my-team");
                setMembers(response.data);
            } else if (activeTab === "attendance") {
                // Only fetch daily team data if NO filter is selected
                if (!attendanceFilterEmployeeId) {
                    const response = await axios.get(`/my-team/attendance?date=${attendanceDate}`);
                    setAttendance(response.data.data || []);
                } else {
                    // Start Loading for history if filter is selected (handled by fetchHistory but let's clear main table)
                    setAttendance([]);
                }
            } else if (activeTab === "leaves") {
                let url = "/my-team/leaves";
                if (leaveFilterEmployeeId) {
                    url += `?employee_id=${leaveFilterEmployeeId}`;
                }
                const response = await axios.get(url);
                setLeaves(response.data.data || []); // Paginated, safeguard with empty array
            }
        } catch (error) {
            console.error("Error fetching team data", error);
        } finally {
            setLoading(false);
        }
    };

    // Action Handlers
    const handleViewAttendanceHistory = async (employee) => {
        setSelectedEmployee(employee);
        setShowHistoryModal(true);
        fetchHistory(employee.id, historyMonth);
    };

    const fetchHistory = async (empId, month) => {
        setHistoryLoading(true);
        try {
            const response = await axios.get(`/attendance/employee/${empId}?month=${month}`);
            setHistoryData(response.data);
        } catch (error) {
            console.error("Error fetching history", error);
            setHistoryData([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleViewLeaveHistory = (employeeId) => {
        setLeaveFilterEmployeeId(employeeId);
        setActiveTab("leaves");
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">My Team</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                {["members", "attendance", "leaves"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium capitalize focus:outline-none ${activeTab === tab
                            ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-10 dark:text-gray-400">Loading...</div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">

                    {/* MEMBERS TAB */}
                    {activeTab === "members" && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Designation</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {members && members.length > 0 ? (
                                        members.map((emp) => (
                                            <tr key={emp.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="ml-0">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{emp.user?.name}</div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">{emp.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{emp.department?.name || "-"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{emp.designation?.name || emp.designation || "-"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{emp.user?.email}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No team members found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ATTENDANCE TAB */}
                    {activeTab === "attendance" && (
                        <div className="overflow-x-auto">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-4">
                                {/* Left Side: Filter Dropdown */}
                                <div>
                                    <label htmlFor="attendance-filter-employee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Employee</label>
                                    <select
                                        id="attendance-filter-employee"
                                        name="attendance_filter_employee"
                                        value={attendanceFilterEmployeeId}
                                        onChange={(e) => setAttendanceFilterEmployeeId(e.target.value)}
                                        className="px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                    >
                                        <option value="">All Employees (Daily View)</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.user?.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Right Side: Date/Month Picker */}
                                <div>
                                    {!attendanceFilterEmployeeId ? (
                                        <>
                                            <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Date</label>
                                            <input
                                                id="attendance-date"
                                                name="attendance_date"
                                                type="date"
                                                value={attendanceDate}
                                                onChange={(e) => setAttendanceDate(e.target.value)}
                                                className="px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <label htmlFor="history-month" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Month</label>
                                            <input
                                                id="history-month"
                                                name="history_month"
                                                type="month"
                                                value={historyMonth}
                                                onChange={(e) => setHistoryMonth(e.target.value)}
                                                className="px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Render Table based on Mode */}
                            {!attendanceFilterEmployeeId ? (
                                // DAILY VIEW TABLE
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check In</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check Out</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {attendance && attendance.length > 0 ? (
                                            attendance.map((record) => (
                                                <tr key={record.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{record.employee?.user?.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{record.date || attendanceDate}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{record.check_in}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{record.check_out}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${record.status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                                record.status === 'Absent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No attendance records found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            ) : (
                                // HISTORY VIEW TABLE (Filtered)
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check In</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check Out</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Hrs</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {historyLoading ? (
                                            <tr><td colSpan="5" className="px-6 py-4 text-center">Loading history...</td></tr>
                                        ) : historyData && historyData.length > 0 ? (
                                            historyData.map((record) => (
                                                <tr key={record.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{record.date}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{record.check_in || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{record.check_out || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{record.total_hours}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${record.status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                                record.status === 'Weekend' ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200' :
                                                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No history found for this month.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* LEAVES TAB */}
                    {activeTab === "leaves" && (
                        <div className="overflow-x-auto">
                            {/* Filter Bar for Leaves */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <label htmlFor="leave-filter-employee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Employee ID</label>
                                        <select
                                            id="leave-filter-employee"
                                            name="leave_filter_employee"
                                            value={leaveFilterEmployeeId}
                                            onChange={(e) => setLeaveFilterEmployeeId(e.target.value)}
                                            className="px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                        >
                                            <option value="">All Employees</option>
                                            {members.map(m => (
                                                <option key={m.id} value={m.id}>{m.user?.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Leave Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dates</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reason</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Approved By</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {leaves && leaves.length > 0 ? (
                                        leaves.map((leave) => (
                                            <tr key={leave.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{leave.employee?.user?.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{leave.leave_type?.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {leave.start_date} to {leave.end_date}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={leave.reason}>
                                                    {leave.reason || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {leave.approver ? leave.approver.name : "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${leave.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                            leave.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                                                        {leave.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No leave requests found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}


            {/* ATTENDANCE HISTORY MODAL */}
            {
                showHistoryModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowHistoryModal(false)}></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                                                Attendance History: {selectedEmployee?.user?.name}
                                            </h3>
                                            <div className="mt-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <label htmlFor="modal-history-month" className="sr-only">Select Month</label>
                                                    <input
                                                        id="modal-history-month"
                                                        name="modal_history_month"
                                                        type="month"
                                                        value={historyMonth}
                                                        onChange={(e) => {
                                                            setHistoryMonth(e.target.value);
                                                            fetchHistory(selectedEmployee.id, e.target.value);
                                                        }}
                                                        className="px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                                    />
                                                </div>
                                                {historyLoading ? (
                                                    <div className="text-center py-4">Loading...</div>
                                                ) : (
                                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                                            <tr>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check In</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check Out</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Hrs</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto block">
                                                            {historyData.map((record) => (
                                                                <tr key={record.id} className="table-row w-full display-table">
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{record.date}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{record.check_in || '-'}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{record.check_out || '-'}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{record.total_hours}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                        ${record.status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                                                record.status === 'Weekend' ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200' :
                                                                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                                                            {record.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={() => setShowHistoryModal(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 dark:hover:bg-gray-500"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default MyTeamPage;
