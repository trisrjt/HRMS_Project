import React, { useState, useEffect } from 'react';
import { X, Search, Shield, Save, CheckCircle } from 'lucide-react';
import axios from '../../api/axios';

const ManagePayslipAccessModal = ({ onClose }) => {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/employees');

            // Handle Employees Response (Array or { success, data })
            if (Array.isArray(response.data)) {
                setEmployees(response.data);
                setFilteredEmployees(response.data);
            } else if (response.data?.success && response.data?.data) {
                setEmployees(response.data.data);
                setFilteredEmployees(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch employees", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const lowerSearch = search.toLowerCase().trim();

        const filtered = employees.filter(emp =>
            (emp.user?.name || "").toLowerCase().includes(lowerSearch) ||
            (emp.employee_code || "").toLowerCase().includes(lowerSearch)
        );
        setFilteredEmployees(filtered);
    }, [search, employees]);

    const handleToggle = async (employeeId, currentStatus) => {
        setProcessingId(employeeId);
        try {
            const newStatus = !currentStatus;
            await axios.patch(`/employees/${employeeId}/payslip-access`, {
                payslip_access: newStatus
            });

            // Update local state
            setEmployees(prev => prev.map(emp =>
                emp.id === employeeId ? { ...emp, payslip_access: newStatus } : emp
            ));
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update access. Please try again.");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Manage Payslip Access
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Control which employees can download their payslips.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name or code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 p-0">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading employees...</div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No employees found.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-center w-32">Access</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-center w-24">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredEmployees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">{emp.user?.name}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{emp.employee_code} • {emp.designation?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={emp.payslip_access || false}
                                                    disabled={processingId === emp.id}
                                                    onChange={() => handleToggle(emp.id, emp.payslip_access)}
                                                />
                                                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 ${processingId === emp.id ? 'opacity-50 cursor-wait' : ''}`}></div>
                                            </label>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            {emp.payslip_access ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs font-medium">
                                                    Allowed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs font-medium">
                                                    Restricted
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManagePayslipAccessModal;
