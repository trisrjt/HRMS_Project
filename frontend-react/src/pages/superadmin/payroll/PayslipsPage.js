import React, { useState, useEffect } from 'react';
import { Plus, Loader2, Download as DownloadIcon } from 'lucide-react';
import axios from '../../../api/axios';
import PayslipFilterBar from '../../../components/payslips/PayslipFilterBar';
import PayslipTable from '../../../components/payslips/PayslipTable';
import GeneratePayslipModal from '../../../components/payslips/GeneratePayslipModal';
import ViewPayslipModal from '../../../components/payslips/ViewPayslipModal';
import EditPayslipModal from '../../../components/payslips/EditPayslipModal';
import DeleteConfirmModal from '../../../components/payslips/DeleteConfirmModal';
import DownloadPayslipModal from '../../../components/payslips/DownloadPayslipModal';
import ManagePayslipAccessModal from '../../../components/payslips/ManagePayslipAccessModal';

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
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [showAccessModal, setShowAccessModal] = useState(false); // New State
    const [viewPayslip, setViewPayslip] = useState(null);
    const [editPayslip, setEditPayslip] = useState(null);
    const [deletePayslip, setDeletePayslip] = useState(null);

    const { user } = useAuth(); // Import useAuth
    const canViewPayslips = user?.role_id === 1 || user?.role_id === 2 || user?.role_id === 3 || user?.permissions?.includes("can_manage_payslips") || user?.permissions?.includes("can_view_payslips"); // Assuming view permission implies view
    const isSuperAdmin = user?.role_id === 1; // Only SuperAdmin or maybe Admin can manage access?

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

            // Handle Departments Response (Array or { success, data })
            if (Array.isArray(deptRes.data)) {
                setDepartments(deptRes.data);
            } else if (deptRes.data?.success && deptRes.data?.data) {
                setDepartments(deptRes.data.data);
            }

            // Handle Employees Response (Array or { success, data })
            if (Array.isArray(empRes.data)) {
                setEmployees(empRes.data);
            } else if (empRes.data?.success && empRes.data?.data) {
                setEmployees(empRes.data.data);
            }
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
            // Single Download (Row Action)
            const response = await axios.get(`/payslips/download`, {
                params: {
                    employee_id: payslip.employee_id,
                    year: payslip.year,
                    start_month: payslip.month,
                    end_month: payslip.month
                },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Payslip_${payslip.employee_code}_${payslip.year}_${payslip.month}.pdf`);
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
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAccessModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow-sm transition-colors font-medium"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Permissions
                    </button>
                    <button
                        onClick={() => setShowDownloadModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow-sm transition-colors font-medium"
                    >
                        <DownloadIcon size={20} />
                        Export
                    </button>
                    {/* Hiding Generate Button per req, but keeping in code commented or permission gated if needed later. But req says Remove. */}
                    {/* 
                    <button
                        onClick={() => setShowGenerateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors font-medium"
                    >
                        <Plus size={20} />
                        Generate Payslip
                    </button> 
                    */}
                </div>
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

            {showDownloadModal && (
                <DownloadPayslipModal
                    onClose={() => setShowDownloadModal(false)}
                    employees={employees}
                />
            )}

            {showAccessModal && (
                <ManagePayslipAccessModal
                    onClose={() => setShowAccessModal(false)}
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
