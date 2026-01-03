import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import axios from '../../../api/axios';
import PayslipFilterBar from '../../../components/payslips/PayslipFilterBar';
import PayslipTable from '../../../components/payslips/PayslipTable';
import GeneratePayslipModal from '../../../components/payslips/GeneratePayslipModal';
import ViewPayslipModal from '../../../components/payslips/ViewPayslipModal';
import EditPayslipModal from '../../../components/payslips/EditPayslipModal';
import DeleteConfirmModal from '../../../components/payslips/DeleteConfirmModal';

import { useAuth } from '../../../context/AuthContext';

const PayslipsPage = () => {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        search: '',
        department: '',
        month: '',
        year: ''
    });
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);

    // Modals State
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [viewPayslip, setViewPayslip] = useState(null);
    const [editPayslip, setEditPayslip] = useState(null);
    const [deletePayslip, setDeletePayslip] = useState(null);

    const { user } = useAuth(); // Import useAuth
    const canViewPayslips = user?.role_id === 1 || user?.role_id === 2 || user?.role_id === 3 || user?.permissions?.includes("can_manage_payslips") || user?.permissions?.includes("can_view_payslips"); // Assuming view permission implies view

    useEffect(() => {
        if (canViewPayslips) {
            fetchInitialData();
            fetchPayslips();
        }
    }, [canViewPayslips]); // Add dependency

    useEffect(() => {
        if (canViewPayslips) {
            fetchPayslips();
        }
    }, [filters, canViewPayslips]);

    const fetchInitialData = async () => {
        try {
            const [deptRes, empRes] = await Promise.all([
                axios.get('/departments'),
                axios.get('/employees')
            ]);
            if (deptRes.data.success) setDepartments(deptRes.data.data);
            if (empRes.data.success) setEmployees(empRes.data.data);
        } catch (err) {
            console.error("Failed to fetch initial data", err);
        }
    };

    const fetchPayslips = async () => {
        setLoading(true);
        try {
            // Construct query params
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.department) params.append('department_id', filters.department);
            if (filters.month) params.append('month', filters.month);
            if (filters.year) params.append('year', filters.year);

            const response = await axios.get(`/payslips?${params.toString()}`);
            if (response.status === 200) {
                setPayslips(response.data);
            } else {
                setError('Failed to fetch payslips.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred while fetching payslips.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleDownload = async (payslip) => {
        try {
            // Assuming the backend returns a file stream or a download URL
            // For file stream:
            const response = await axios.get(`/payslips/${payslip.id}/download`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Payslip_${payslip.employee_code}_${payslip.month_year}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download failed", err);
            alert("Failed to download PDF. Please try again.");
        }
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payslip Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Generate, view, and manage employee payslips</p>
                </div>
                <button
                    onClick={() => setShowGenerateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors font-medium"
                >
                    <Plus size={20} />
                    Generate Payslip
                </button>
            </div>

            {/* Filter Bar */}
            <PayslipFilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                departments={departments}
            />

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-center border border-red-200 dark:border-red-800">
                    {error}
                </div>
            ) : (
                <PayslipTable
                    payslips={payslips}
                    onView={setViewPayslip}
                    onEdit={setEditPayslip}
                    onDelete={setDeletePayslip}
                    onDownload={handleDownload}
                />
            )}

            {/* Modals */}
            {showGenerateModal && (
                <GeneratePayslipModal
                    onClose={() => setShowGenerateModal(false)}
                    onSuccess={fetchPayslips}
                    employees={employees}
                />
            )}

            {viewPayslip && (
                <ViewPayslipModal
                    payslip={viewPayslip}
                    onClose={() => setViewPayslip(null)}
                    onDownload={handleDownload}
                />
            )}

            {editPayslip && (
                <EditPayslipModal
                    payslip={editPayslip}
                    onClose={() => setEditPayslip(null)}
                    onSuccess={fetchPayslips}
                />
            )}

            {deletePayslip && (
                <DeleteConfirmModal
                    payslip={deletePayslip}
                    onClose={() => setDeletePayslip(null)}
                    onSuccess={fetchPayslips}
                />
            )}
        </div>
    );
};

export default PayslipsPage;
