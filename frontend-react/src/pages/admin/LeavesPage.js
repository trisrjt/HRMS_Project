import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const ApprovalModal = ({ leave, isOpen, onClose, onAction }) => {
    const [action, setAction] = useState("approve"); // approve, reject, partial
    const [dates, setDates] = useState({
        start: leave?.start_date,
        end: leave?.end_date
    });
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
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                        <p><strong>Employee:</strong> {leave.employee?.user?.name}</p>
                        <p><strong>Reason:</strong> {leave.reason}</p>
                        <p><strong>Original Dates:</strong> {leave.start_date} to {leave.end_date}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-300">Action</label>
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="approve">Approve Full Leave</option>
                            <option value="partial">Approve Partial Leave</option>
                            <option value="reject">Reject Leave</option>
                        </select>
                    </div>

                    {action === "partial" && (
                        <div className="grid grid-cols-2 gap-3 p-3 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
                            <div>
                                <label className="text-xs font-bold text-blue-800 dark:text-blue-300">Approved Start</label>
                                <input
                                    type="date"
                                    value={dates.start}
                                    min={leave.start_date}
                                    max={leave.end_date}
                                    onChange={(e) => handleDateChange("start", e.target.value)}
                                    className="w-full text-sm p-1 mt-1 rounded border dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-800 dark:text-blue-300">Approved End</label>
                                <input
                                    type="date"
                                    value={dates.end}
                                    min={dates.start}
                                    max={leave.end_date}
                                    onChange={(e) => handleDateChange("end", e.target.value)}
                                    className="w-full text-sm p-1 mt-1 rounded border dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="col-span-2 text-xs text-right font-medium text-blue-600 dark:text-blue-400">
                                Approved Duration: {days} Days
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                        <button
                            onClick={handleSubmit}
                            className={`px-4 py-2 rounded-lg text-white font-medium ${action === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            Confirm {action === 'partial' ? 'Partial Approval' : action.charAt(0).toUpperCase() + action.slice(1)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminLeavesPage = () => {
    const { user } = useAuth();
    const canManage = user?.role_id === 1 || user?.can_manage_leaves;

    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const response = await api.get("/leaves");
            setLeaves(response.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch leaves", err);
            setError("Failed to load leave requests.");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action, dates) => {
        if (!selectedLeave) return;
        const id = selectedLeave.id;

        try {
            if (action === "approve") {
                await api.put(`/leaves/${id}`, { status: "Approved" });
            } else if (action === "reject") {
                await api.put(`/leaves/${id}`, { status: "Rejected" });
            } else if (action === "partial") {
                await api.put(`/leaves/${id}/partial-approve`, {
                    approved_start_date: dates.start,
                    approved_end_date: dates.end
                });
            }
            setIsModalOpen(false);
            fetchLeaves();
        } catch (err) {
            console.error("Action failed", err);
            alert("Failed to update leave status: " + (err.response?.data?.message || err.message));
        }
    };

    const openReviewModal = (leave) => {
        setSelectedLeave(leave);
        setIsModalOpen(true);
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Leave Requests</h1>

            {loading ? (
                <div className="text-center p-8 text-gray-500">Loading leaves...</div>
            ) : error ? (
                <div className="text-center p-8 text-red-500">{error}</div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Dates</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Reason</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {leaves.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No leave requests found.</td></tr>
                            ) : (
                                leaves.map((leave) => (
                                    <tr key={leave.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{leave.employee?.user?.name}</div>
                                            <div className="text-xs text-gray-500">{leave.employee?.department?.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{leave.leave_type?.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {leave.start_date} to {leave.end_date}
                                            <div className="text-xs text-gray-500">{leave.days} days</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">{leave.reason}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                                ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                    leave.status === 'Partially Approved' ? 'bg-blue-100 text-blue-800' :
                                                        leave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                            leave.status === 'Withdrawn' ? 'bg-gray-100 text-gray-800' :
                                                                'bg-yellow-100 text-yellow-800'}`}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {leave.status === 'Pending' && canManage && (
                                                <button
                                                    onClick={() => openReviewModal(leave)}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                                >
                                                    Review
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <ApprovalModal
                leave={selectedLeave}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAction={handleAction}
            />
        </div>
    );
};

export default AdminLeavesPage;
