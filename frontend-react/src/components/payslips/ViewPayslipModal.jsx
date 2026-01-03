import React from 'react';
import { X, Download, Printer } from 'lucide-react';

const ViewPayslipModal = ({ payslip, onClose, onDownload }) => {
    if (!payslip) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payslip Details</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onDownload(payslip)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Download PDF"
                        >
                            <Download size={20} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-800">
                    {/* Payslip Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">COMPANY NAME</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">123 Business Street, Tech City, TC 90210</p>
                        <div className="mt-4 inline-block px-4 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                            Payslip for {payslip.month_year}
                        </div>
                    </div>

                    {/* Employee Info */}
                    <div className="grid grid-cols-2 gap-6 mb-8 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Employee Name</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{payslip.employee?.user?.name || payslip.employee_name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Employee Code</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{payslip.employee?.employee_code || payslip.employee_code}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Department</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{payslip.employee?.department?.name || payslip.department_name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Designation</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{payslip.employee?.designation?.name || payslip.designation_name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Days Worked</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{payslip.days_worked || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Generated On</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{new Date(payslip.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Salary Details Table */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-8">
                        <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                            {/* Earnings */}
                            <div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase">
                                    Earnings
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Basic Salary</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{payslip.basic || payslip.basic_salary || '0.00'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">HRA</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{payslip.hra || '0.00'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Allowances</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{payslip.allowances || '0.00'}</span>
                                    </div>
                                    {/* Bonus? Overtime? */}
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between font-bold text-gray-900 dark:text-white">
                                    <span>Total Earnings</span>
                                    <span>{payslip.total_earnings}</span>
                                </div>
                            </div>

                            {/* Deductions */}
                            <div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase">
                                    Deductions
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">PF</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{payslip.pf || '0.00'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">ESIC</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{payslip.esic || '0.00'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Professional Tax</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{payslip.ptax || '0.00'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Tax / TDS</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{payslip.tds || '0.00'}</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between font-bold text-gray-900 dark:text-white">
                                    <span>Total Deductions</span>
                                    <span>{payslip.total_deductions}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net Pay */}
                    <div className="flex justify-end">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg px-6 py-4 text-center min-w-[200px]">
                            <p className="text-sm text-blue-600 dark:text-blue-400 uppercase font-semibold mb-1">Net Pay</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{payslip.net_pay}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewPayslipModal;
