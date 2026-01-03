import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import axios from '../../api/axios';

const DeleteConfirmModal = ({ payslip, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.delete(`/payslips/${payslip.id}`);
            if (response.status === 200) {
                onSuccess();
                onClose();
            } else {
                setError(response.data.message || 'Failed to delete payslip.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while deleting payslip.');
        } finally {
            setLoading(false);
        }
    };

    if (!payslip) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Payslip?</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Are you sure you want to delete the payslip for <span className="font-semibold text-gray-700 dark:text-gray-300">{payslip.employee_name}</span> for <span className="font-semibold text-gray-700 dark:text-gray-300">{payslip.month_year}</span>? This action cannot be undone.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
