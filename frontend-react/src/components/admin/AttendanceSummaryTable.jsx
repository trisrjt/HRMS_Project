import React, { useState } from 'react';

const AttendanceSummaryTable = ({ summary, loading, onEmployeeClick }) => {
    const formatDuration = (hours) => {
        if (!hours) return "-";
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        if (h === 0) return `${m}m`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
    };

    if (loading) {
        return <div className="text-center p-8 text-gray-500">Loading attendance summary...</div>;
    }

    if (summary.length === 0) {
        return <div className="text-center p-8 text-gray-500">No attendance records found for this month.</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Today's Status</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Working Days</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total Hours</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Issues</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {summary.map((employee) => (
                        <tr
                            key={employee.id}
                            onClick={() => onEmployeeClick(employee)}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                        >
                            <td className="px-6 py-4">
                                <div className="font-medium text-gray-900 dark:text-white">{employee.name}</div>
                                <div className="text-xs text-gray-500">{employee.code} • {employee.department}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                    ${employee.today_status === 'Present' || employee.today_status === 'Checked In' ? 'bg-green-100 text-green-800' :
                                        employee.today_status === 'Absent' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'}`}>
                                    {employee.today_status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                {employee.total_working_days} Days
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                {formatDuration(employee.total_hours)}
                            </td>
                            <td className="px-6 py-4">
                                {employee.missing_punches > 0 && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        {employee.missing_punches} Missing Punches
                                    </span>
                                )}
                                {employee.missing_punches === 0 && (
                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                        No Issues
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                    View History
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AttendanceSummaryTable;
