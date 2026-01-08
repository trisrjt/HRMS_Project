import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

// --- UI Components ---

const Button = ({ children, onClick, disabled, variant = "primary", className, type = "button" }) => {
    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg disabled:bg-blue-300 disabled:shadow-none",
        secondary: "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50",
        destructive: "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg disabled:bg-red-300 disabled:shadow-none"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center ${variants[variant]} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        >
            {children}
        </button>
    );
};

const Card = ({ children, className }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200 ${className}`}>
        {children}
    </div>
);

const Alert = ({ children, variant = "error" }) => (
    <div className={`p-4 rounded-lg mb-4 text-sm border ${variant === "error"
        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
        : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
        }`}>
        {children}
    </div>
);

const Badge = ({ children, variant = "default" }) => {
    const styles = {
        default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        Approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        Rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        Pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        Withdrawn: "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300",
        "Partially Approved": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    };

    const current = styles[variant] || styles.default;

    return (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${current}`}>
            {children}
        </span>
    );
};

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl transform transition-all border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-transparent border-none cursor-pointer text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---

const LeavesPage = () => {
    const navigate = useNavigate();
    const [leaves, setLeaves] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [formData, setFormData] = useState({
        leave_type_id: "",
        start_date: "",
        end_date: "",
        reason: "",
    });

    const [balances, setBalances] = useState([]);

    // Fetch Data
    const fetchBalances = async () => {
        try {
            const response = await api.get("/my-leaves/balances");
            setBalances(response.data || []);
        } catch (err) {
            console.error("Fetch balances error:", err);
        }
    };

    const fetchLeaves = async () => {
        try {
            // Using /my-leaves as verified in backend
            const response = await api.get("/my-leaves");
            const data = response.data.data || response.data;
            setLeaves(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch leaves error:", err);
            setError("Failed to load leave history.");
        }
    };

    const fetchLeaveTypes = async () => {
        try {
            const response = await api.get("/my-leaves/types");
            setLeaveTypes(response.data || []);
        } catch (err) {
            console.error("Fetch leave types error:", err);
            // Fallback only if API fails completely, but API should work now.
            // setLeaveTypes([]); 
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([fetchLeaves(), fetchBalances(), fetchLeaveTypes()]);
            setIsLoading(false);
        };
        loadData();

        // Poll for updates every 10 seconds
        const interval = setInterval(() => {
            fetchLeaves();
            fetchBalances();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // Form Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleWithdraw = async (id) => {
        if (!window.confirm("Are you sure you want to withdraw this leave request?")) return;

        try {
            await api.put(`/leaves/${id}/withdraw`);
            setSuccessMessage("Leave withdrawn successfully.");
            fetchLeaves();
            fetchBalances(); // Refresh balance
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Withdraw error:", err);
            setError(err?.response?.data?.message || "Failed to withdraw leave.");
            setTimeout(() => setError(null), 3000);
        }
    };

    const validateForm = () => {
        if (!formData.leave_type_id) return "Please select a leave type.";
        if (!formData.start_date) return "Start date is required.";
        if (!formData.end_date) return "End date is required.";
        if (new Date(formData.end_date) < new Date(formData.start_date)) {
            return "End date cannot be before start date.";
        }
        if (!formData.reason.trim()) return "Please provide a reason.";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        const validationError = validateForm();
        if (validationError) {
            setFormError(validationError);
            return;
        }

        setIsSubmitting(true);

        try {
            // Updated to use /leaves (standard store endpoint) or /employee/apply-leave if alias exists
            // Using /leaves to be safe with standard REST
            await api.post("/leaves", formData);

            setSuccessMessage("Leave application submitted successfully!");
            setIsModalOpen(false);
            setFormData({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
            await fetchLeaves(); // Reload list
            await fetchBalances(); // Reload balances

            // Clear success message after 3s
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Apply leave error:", err);
            setFormError(err?.response?.data?.message || "Failed to submit leave application.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 transition-colors">
                <div className="text-xl font-medium animate-pulse">Loading leaves...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1200px] mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">

            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Leaves</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your leave applications</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={() => navigate("/employee/dashboard")}>
                        Back to Dashboard
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)}>
                        Apply Leave
                    </Button>
                </div>
            </div>

            {/* Balances Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {balances.map((balance) => (
                    <div key={balance.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
                            {balance.leave_type?.name || "Leave"}
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className={`text-2xl font-bold ${balance.remaining_days > 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                                {balance.remaining_days}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">days available</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs flex justify-between text-gray-400 dark:text-gray-500">
                            <span>Allocated: {balance.allocated_days}</span>
                            <span>Used: {balance.used_days}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Messages */}
            {error && <Alert variant="error">{error}</Alert>}
            {successMessage && <Alert variant="success"><strong>Success:</strong> {successMessage}</Alert>}

            {/* Leaves List */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dates & Duration</th>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Approved By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {leaves.length > 0 ? (
                                leaves.map((leave) => {
                                    const start = new Date(leave.start_date);
                                    const end = new Date(leave.end_date);
                                    const days = (end - start) / (1000 * 60 * 60 * 24) + 1;
                                    const returnedDays = leave.approved_days ? days - leave.approved_days : 0;

                                    return (
                                        <tr key={leave.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {leave.leave_type?.name || "Leave"}
                                            </td>
                                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                        Requested: {days} days
                                                    </span>

                                                    {leave.status === 'Partially Approved' && leave.approved_days && (
                                                        <div className="flex flex-col gap-0.5 mt-1 border-l-2 border-blue-200 pl-2">
                                                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                                Approved: {leave.approved_days} days
                                                            </span>
                                                            <span className="text-xs text-blue-600 dark:text-blue-400">
                                                                Returned: {returnedDays} days
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                                {leave.reason}
                                            </td>
                                            <td className="p-4 text-sm">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={leave.status}>
                                                        {leave.status}
                                                    </Badge>
                                                    {leave.status === 'Pending' && leave.start_date >= new Date().toISOString().split('T')[0] && (
                                                        <button
                                                            onClick={() => handleWithdraw(leave.id)}
                                                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors shadow-sm font-medium"
                                                        >
                                                            Withdraw
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                                {leave.approver ? (
                                                    <div>
                                                        <div className="font-medium">{leave.approver.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {leave.approver.role_id === 1 ? 'SuperAdmin' :
                                                                leave.approver.role_id === 2 ? 'Admin' :
                                                                    leave.approver.role_id === 3 ? 'HR' : 'Employee'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        No leave applications found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Apply Leave Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Apply for Leave"
            >
                {formError && <Alert variant="error">{formError}</Alert>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="leave_type_id" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Leave Type</label>
                        <select
                            id="leave_type_id"
                            name="leave_type_id"
                            value={formData.leave_type_id}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Type</option>
                            {leaveTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="start_date" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Start Date</label>
                            <input
                                type="date"
                                id="start_date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="end_date" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">End Date</label>
                            <input
                                type="date"
                                id="end_date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Reason</label>
                        <textarea
                            id="reason"
                            name="reason"
                            value={formData.reason}
                            onChange={handleInputChange}
                            rows="3"
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Please provide a reason for your leave..."
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Applying..." : "Apply Leave"}
                        </Button>
                    </div>
                </form>
            </Modal>

        </div>
    );
};

export default LeavesPage;
