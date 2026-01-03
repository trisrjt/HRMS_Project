import React, { useState } from "react";
import { X, Check, Shield } from "lucide-react";
import api from "../api/axios";

const PermissionModal = ({ user, onClose, onUpdate }) => {
    const [permissions, setPermissions] = useState({
        can_manage_employees: user.can_manage_employees || false,
        can_view_employees: user.can_view_employees || false,
        can_manage_salaries: user.can_manage_salaries || false,
        can_view_salaries: user.can_view_salaries || false,
        can_manage_attendance: user.can_manage_attendance || false,
        can_view_attendance: user.can_view_attendance || false,
        can_manage_leaves: user.can_manage_leaves || false,
        can_view_leaves: user.can_view_leaves || false,
        can_manage_departments: user.can_manage_departments || false,
        can_manage_payslips: user.can_manage_payslips || false,
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (key) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await api.put(`/superadmin/users/${user.id}/permissions`, permissions);
            if (onUpdate) onUpdate(response.data.user);
            onClose();
            alert("Permissions updated successfully!");
        } catch (error) {
            console.error("Failed to update permissions", error);
            alert("Failed to update permissions");
        } finally {
            setSaving(false);
        }
    };

    const toggleGroups = [
        {
            title: "Employee Management",
            items: [
                { key: "can_view_employees", label: "View Employees" },
                { key: "can_manage_employees", label: "Manage Employees (Create/Edit/Delete)" }
            ]
        },
        {
            title: "Salary Management",
            items: [
                { key: "can_view_salaries", label: "View Salaries" },
                { key: "can_manage_salaries", label: "Manage Salaries" }
            ]
        },
        {
            title: "Attendance Management",
            items: [
                { key: "can_view_attendance", label: "View Attendance" },
                { key: "can_manage_attendance", label: "Manage Attendance" }
            ]
        },
        {
            title: "Leave Management",
            items: [
                { key: "can_view_leaves", label: "View Leaves" },
                { key: "can_manage_leaves", label: "Manage Leaves (Approve/Reject)" }
            ]
        },
        {
            title: "Other",
            items: [
                { key: "can_manage_departments", label: "Manage Departments" },
                { key: "can_manage_payslips", label: "Manage Payslips" }
            ]
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden transform transition-all">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">User Permissions</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Managing permissions for <span className="font-medium text-gray-900 dark:text-gray-200">{user.name}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {toggleGroups.map((group, idx) => (
                                <div key={idx} className="space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-1 mb-2">
                                        {group.title}
                                    </h4>
                                    {group.items.map((item) => (
                                        <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={permissions[item.key]}
                                                onClick={() => handleChange(item.key)}
                                                className={`
                                                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                                    ${permissions[item.key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}
                                                `}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`
                                                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                                        ${permissions[item.key] ? 'translate-x-5' : 'translate-x-0'}
                                                    `}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {saving && <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PermissionModal;
