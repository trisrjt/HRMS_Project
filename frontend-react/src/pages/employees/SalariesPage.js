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
        : variant === "info"
            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
            : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
        }`}>
        {children}
    </div>
);

// --- Main Page Component ---

const SalariesPage = () => {
    const navigate = useNavigate();
    const [salary, setSalary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSalary = async () => {
            try {
                // Using /my-salary as verified in backend (API logic: Route::get('/my-salary', ...))
                const { data } = await api.get("/my-salary");

                // If it returns a list (e.g. salary history), take the latest. 
                // Checks logic: $salary = Salary::where('employee_id', $employee->id)->latest()->first();
                // If backend returns object directly:
                if (data && data.salary === null) {
                    setSalary(null);
                } else if (data && data.id) {
                    setSalary(data); // Single object
                } else if (Array.isArray(data) && data.length > 0) {
                    setSalary(data[0]); // Take first if array
                } else {
                    setSalary(data);
                }

            } catch (err) {
                console.error("Salary fetch error:", err);
                if (err.response && err.response.status === 404) {
                    // Start treating 404 as "No salary found" not error if just missing record
                    setSalary(null);
                } else {
                    setError("Failed to load salary details.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchSalary();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 transition-colors">
                <div className="text-xl font-medium animate-pulse">Loading Salary...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1200px] mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">

            {/* Header */}
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Salary</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">View your current salary structure</p>
                </div>
                <div>
                    <Button variant="secondary" onClick={() => navigate("/employee/dashboard")}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>

            {/* Error Alert */}
            {error && <Alert variant="error">{error}</Alert>}

            {/* No Salary Message */}
            {!isLoading && !error && !salary && (
                <div className="flex justify-center">
                    <div className="max-w-md w-full">
                        <Alert variant="info">
                            Salary details not found. Please contact HR or Admin.
                        </Alert>
                    </div>
                </div>
            )}

            {/* Salary Details Card */}
            {salary && (
                <Card className="p-8 max-w-3xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                        {/* Earnings Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b-2 border-gray-100 dark:border-gray-700 pb-2">
                                Earnings
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800">
                                    <span className="text-gray-500 dark:text-gray-400">Basic Salary</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">₹{Number(salary.basic || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800">
                                    <span className="text-gray-500 dark:text-gray-400">HRA</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">₹{Number(salary.hra || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Deductions Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b-2 border-gray-100 dark:border-gray-700 pb-2">
                                Deductions
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800">
                                    <span className="text-gray-500 dark:text-gray-400">PF</span>
                                    <span className="font-semibold text-red-500 dark:text-red-400">-₹{Number(salary.pf || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800">
                                    <span className="text-gray-500 dark:text-gray-400">ESIC</span>
                                    <span className="font-semibold text-red-500 dark:text-red-400">-₹{Number(salary.esic || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800">
                                    <span className="text-gray-500 dark:text-gray-400">PTAX</span>
                                    <span className="font-semibold text-red-500 dark:text-red-400">-₹{Number(salary.ptax || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Total Deductions</span>
                                    <span className="font-bold text-red-600 dark:text-red-400">-₹{Number(salary.deductions || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gross Salary Section */}
                    {/* Gross Salary Section */}
                    <div className="mt-8 pt-6 border-t font-medium border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xl text-gray-900 dark:text-white">Gross Salary</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">₹{Number(salary.gross_salary || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xl text-emerald-600 dark:text-emerald-400">Net Pay</span>
                            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                ₹{Number((salary.gross_salary || 0) - (salary.deductions || 0)).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default SalariesPage;
