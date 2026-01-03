import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import axios from '../../api/axios';

const EditPayslipModal = ({ payslip, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        basic_salary: 0,
        hra: 0,
        allowances: 0,
        deductions: 0,
        remarks: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (payslip) {
            setFormData({
                basic_salary: payslip.basic_salary || 0,
                hra: payslip.hra || 0,
                allowances: payslip.allowances || 0,
                deductions: payslip.total_deductions || 0, // Assuming total_deductions is the editable field for simplicity, or map specific deduction fields
                remarks: payslip.remarks || ''
            });
        }
    }, [payslip]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'remarks' ? value : parseFloat(value) || 0
        }));
    };

    const calculateNetPay = () => {
        const { basic_salary, hra, allowances, deductions } = formData;
        return (parseFloat(basic_salary) + parseFloat(hra) + parseFloat(allowances) - parseFloat(deductions)).toFixed(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.put(`/payslips/${payslip.id}`, formData);
            if (response.status === 200) {
                onSuccess();
                onClose();
            } else {
                setError(response.data.message || 'Failed to update payslip.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while updating payslip.');
        } finally {
            setLoading(false);
        }
    };

    if (!payslip) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Save size={20} className="text-blue-600 dark:text-blue-400" />
                        Edit Payslip
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

                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Employee</p>
                                <p className="text-lg font-bold text-blue-800 dark:text-blue-200">{payslip.employee_name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Period</p>
                                <p className="text-lg font-bold text-blue-800 dark:text-blue-200">{payslip.month_year}</p>
                            </div>
                        </div>
                    </div>

                    <form id="edit-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="edit_basic_salary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Basic Salary</label>
                                <input
                                    id="edit_basic_salary"
                                    type="number"
                                    name="basic_salary"
                                    value={formData.basic_salary}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit_hra" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HRA</label>
                                <input
                                    id="edit_hra"
                                    type="number"
                                    name="hra"
                                    value={formData.hra}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit_allowances" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allowances</label>
                                <input
                                    id="edit_allowances"
                                    type="number"
                                    name="allowances"
                                    value={formData.allowances}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit_deductions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Deductions</label>
                                <input
                                    id="edit_deductions"
                                    type="number"
                                    name="deductions"
                                    value={formData.deductions}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="edit_remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks</label>
                            <textarea
                                id="edit_remarks"
                                name="remarks"
                                value={formData.remarks}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Optional remarks..."
                            ></textarea>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg flex justify-between items-center border border-gray-200 dark:border-gray-700">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Net Pay (Calculated):</span>
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{calculateNetPay()}</span>
                        </div>
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
                        form="edit-form"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPayslipModal;
