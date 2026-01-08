import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

// --- UI Components ---

const Button = ({ children, onClick, disabled, variant = "primary", className, type = "button" }) => {
    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg disabled:bg-blue-300 disabled:shadow-none",
        secondary: "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50",
        destructive: "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg disabled:bg-red-300 disabled:shadow-none",
        success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg disabled:bg-emerald-300 disabled:shadow-none"
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

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl shadow-2xl transform transition-all border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
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

// --- Helper Functions ---

const getMonthName = (monthNumber) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('default', { month: 'long' });
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
};

// --- Main Page Component ---

const PayslipsPage = () => {
    const navigate = useNavigate();
    const [payslips, setPayslips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPayslip, setSelectedPayslip] = useState(null);

    useEffect(() => {
        const fetchPayslips = async () => {
            try {
                // Using /my-payslips as verified in backend
                const { data } = await api.get("/my-payslips");
                const list = data.data || data; // Handle pagination
                setPayslips(Array.isArray(list) ? list : []);
            } catch (err) {
                if (err.response && err.response.status === 403) {
                    // Access denied is expected for restricted employees, just show the message
                    setError("You do not have permission to view or download payslips. Please contact your administrator.");
                } else {
                    console.error("Fetch payslips error:", err);
                    setError("Failed to load payslips.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchPayslips();
    }, []);

    const handleView = (payslip) => {
        setSelectedPayslip(payslip);
    };

    const handleDownload = async (id) => {
        // Placeholder for download logic
        // Ideally: window.open(api.defaults.baseURL + `/payslips/${id}/download`, '_blank');
        // Since we don't have a confirmed download route, we'll alert or print.
        alert("Download functionality coming soon. Please use the Print option in View.");
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 transition-colors">
                <div className="text-xl font-medium animate-pulse">Loading payslips...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1200px] mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">

            {/* Header */}
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Payslips</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">View and download your salary statements</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={() => navigate("/employee/dashboard")}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>

            {/* Error Alert */}
            {error && <Alert variant="error">{error}</Alert>}

            {/* Payslips List */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month</th>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Year</th>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Pay</th>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Generated On</th>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {payslips.length > 0 ? (
                                payslips.map((payslip) => (
                                    <tr key={payslip.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {getMonthName(payslip.month)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                            {payslip.year}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            ₹{Number(payslip.net_pay).toFixed(2)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(payslip.created_at)}
                                        </td>
                                        <td className="p-4 text-sm text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => handleView(payslip)}>
                                                    View
                                                </Button>
                                                {/* Optional Download Button */}
                                                {/* <Button variant="primary" className="px-3 py-1.5 text-xs" onClick={() => handleDownload(payslip.id)}>
                                                    Download
                                                </Button> */}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        No payslips found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* View Payslip Modal */}
            <Modal
                isOpen={!!selectedPayslip}
                onClose={() => setSelectedPayslip(null)}
                title={`Payslip: ${selectedPayslip ? getMonthName(selectedPayslip.month) + ' ' + selectedPayslip.year : ''}`}
            >
                {selectedPayslip && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Pay</h4>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{Number(selectedPayslip.net_pay).toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h4>
                                <span className="inline-block px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-semibold mt-1">Paid</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-100 dark:border-gray-700 pb-1">Earnings</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                        <span>Basic Salary</span>
                                        <span>₹{Number(selectedPayslip.basic).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                        <span>HRA</span>
                                        <span>₹{Number(selectedPayslip.hra).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium pt-2 border-t border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white">
                                        <span>Total Earnings</span>
                                        <span>₹{Number(selectedPayslip.total_earnings).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-100 dark:border-gray-700 pb-1">Deductions</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                        <span>PF</span>
                                        <span>₹{Number(selectedPayslip.pf).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                        <span>ESIC</span>
                                        <span>₹{Number(selectedPayslip.esic).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                        <span>PTAX</span>
                                        <span>₹{Number(selectedPayslip.ptax).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium pt-2 border-t border-gray-100 dark:border-gray-700 text-red-600 dark:text-red-400">
                                        <span>Total Deductions</span>
                                        <span>-₹{Number(selectedPayslip.total_deductions).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setSelectedPayslip(null)}>Close</Button>
                            <Button variant="primary" onClick={() => window.print()}>Print / Download PDF</Button>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
};

export default PayslipsPage;
