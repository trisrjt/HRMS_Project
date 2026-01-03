import { useState, useEffect } from "react";
import api from "../../api/axios";

const AdminPayslipsPage = () => {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPayslips();
    }, []);

    const fetchPayslips = async () => {
        try {
            const response = await api.get("/payslips");
            setPayslips(response.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch payslips", err);
            setError("Failed to load payslips.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payslips</h1>

            {loading ? (
                <div className="text-center p-8 text-gray-500">Loading payslips...</div>
            ) : error ? (
                <div className="text-center p-8 text-red-500">{error}</div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Month</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Year</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Net Salary</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {payslips.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No payslips found.</td></tr>
                            ) : (
                                payslips.map((payslip) => (
                                    <tr key={payslip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{payslip.employee?.user?.name}</div>
                                            <div className="text-xs text-gray-500">{payslip.employee?.employee_code}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{payslip.month}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{payslip.year}</td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">₹{parseFloat(payslip.net_salary).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Generated</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminPayslipsPage;
