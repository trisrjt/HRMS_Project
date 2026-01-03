import React from 'react';
import { Eye, Edit2, Trash2, Download } from 'lucide-react';

const PayslipTable = ({ payslips, onView, onEdit, onDelete, onDownload }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold whitespace-nowrap">
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-6 py-4">Month</th>
                            <th className="px-4 py-4 text-right">Basic</th>
                            <th className="px-4 py-4 text-right">HRA</th>
                            <th className="px-4 py-4 text-right">PF</th>
                            <th className="px-4 py-4 text-right">ESIC</th>
                            <th className="px-4 py-4 text-right">PTAX</th>
                            <th className="px-6 py-4 text-right bg-gray-50 dark:bg-gray-800">Net Pay</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {payslips.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No payslips found.
                                </td>
                            </tr>
                        ) : (
                            payslips.map((payslip) => (
                                <tr
                                    key={payslip.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150 group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 dark:text-white">{payslip.employee_name}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{payslip.employee_code}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                        {payslip.month_year}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm text-gray-600 dark:text-gray-300">
                                        {payslip.basic || '0.00'}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm text-gray-600 dark:text-gray-300">
                                        {payslip.hra || '0.00'}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm text-red-500 dark:text-red-400">
                                        {payslip.pf || '0.00'}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm text-red-500 dark:text-red-400">
                                        {payslip.esic || '0.00'}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm text-red-500 dark:text-red-400">
                                        {payslip.ptax || '0.00'}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50">
                                        {payslip.net_pay}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <button
                                                onClick={() => onView(payslip)}
                                                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => onEdit(payslip)}
                                                className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                                title="Edit Payslip"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => onDownload(payslip)}
                                                className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                                title="Download PDF"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(payslip)}
                                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PayslipTable;
