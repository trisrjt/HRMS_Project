import { useState, useEffect } from "react";
import api from "../../api/axios";

const AdminSalariesPage = () => {
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSalaries();
    }, []);

    const fetchSalaries = async () => {
        try {
            const response = await api.get("/salaries");
            setSalaries(response.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch salaries", err);
            setError("Failed to load salary data.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Employee Salaries</h1>

            {loading ? (
                <div className="text-center p-8 text-gray-500">Loading salaries...</div>
            ) : error ? (
                <div className="text-center p-8 text-red-500">{error}</div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Basic</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Allowances</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Deductions</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Net Salary</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {salaries.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No salary records found.</td></tr>
                            ) : (
                                salaries.map((salary) => (
                                    <tr key={salary.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{salary.employee?.user?.name}</div>
                                            <div className="text-xs text-gray-500">{salary.employee?.department?.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">₹{parseFloat(salary.basic).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">₹{parseFloat(salary.allowances).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300 text-red-600">-₹{parseFloat(salary.deductions).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">₹{parseFloat(salary.net_salary).toLocaleString()}</td>
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

export default AdminSalariesPage;
