import React, { useState, useEffect } from 'react';
import { X, Calculator, Loader2 } from 'lucide-react';
import axios from '../../api/axios';

const GeneratePayslipModal = ({ onClose, onSuccess, employees }) => {
    const [formData, setFormData] = useState({
        employee_id: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });
    const [salaryData, setSalaryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingSalary, setFetchingSalary] = useState(false);
    const [error, setError] = useState('');

    const months = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
        { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
        { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    useEffect(() => {
        if (formData.employee_id) {
            fetchSalaryStructure(formData.employee_id);
        } else {
            setSalaryData(null);
        }
    }, [formData.employee_id]);

    const fetchSalaryStructure = async (employeeId) => {
        setFetchingSalary(true);
        setError('');
        try {
            const response = await axios.get(`/salaries/employee/${employeeId}`);
            if (response.status === 200) {
                setSalaryData(response.data);
            } else {
                setError('Failed to fetch salary structure.');
                setSalaryData(null);
            }
        } catch (err) {
            setError('Salary structure not found for this employee.');
            setSalaryData(null);
        } finally {
            setFetchingSalary(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!salaryData) return;

        setLoading(true);
        setError('');
        try {
            const response = await axios.post('/payslips', formData);
            if (response.status === 201) {
                onSuccess();
                onClose();
            } else {
                setError(response.data.message || 'Failed to generate payslip.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while generating payslip.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calculator size={20} className="text-blue-600 dark:text-blue-400" />
                        Generate Payslip
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form id="generate-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-3">
                                <label htmlFor="employee_select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee</label>
                                <select
                                    id="employee_select"
                                    required
                                    value={formData.employee_id}
                                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.employee_code})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="month_select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
                                <select
                                    id="month_select"
                                    required
                                    value={formData.month}
                                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    {months.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="year_select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                                <select
                                    id="year_select"
                                    required
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Salary Preview */}
                        {fetchingSalary ? (
                            <div className="py-8 flex justify-center text-gray-500 dark:text-gray-400">
                                <Loader2 className="animate-spin mr-2" /> Fetching salary details...
                            </div>
                        ) : salaryData ? (
                            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">Payslip Preview</h4>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Basic Salary:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{salaryData.basic_salary}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">HRA:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{salaryData.hra}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Allowances:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{salaryData.allowances}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Deductions:</span>
                                        <span className="font-medium text-red-600 dark:text-red-400">-{salaryData.deductions}</span>
                                    </div>
                                    <div className="col-span-2 border-t border-gray-200 dark:border-gray-700 my-2"></div>
                                    <div className="flex justify-between text-base font-bold">
                                        <span className="text-gray-800 dark:text-gray-200">Net Salary:</span>
                                        <span className="text-blue-600 dark:text-blue-400">
                                            {(parseFloat(salaryData.basic_salary) + parseFloat(salaryData.hra) + parseFloat(salaryData.allowances) - parseFloat(salaryData.deductions)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                Select an employee to view salary structure preview.
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="generate-form"
                        disabled={loading || !salaryData}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Generate Payslip
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeneratePayslipModal;
