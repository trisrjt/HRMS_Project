import React, { useState, useEffect, useCallback } from "react";
import api from "../../../api/axios";

// Toggle Switch Component
const ToggleSwitch = ({ enabled, onChange, disabled = false }) => {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!enabled)}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
            role="switch"
            aria-checked={enabled}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
            />
        </button>
    );
};

// Permission Card Component
const PermissionCard = ({ permission, enabled, onChange, disabled }) => {
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Leaves':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                );
            case 'Attendance':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'Employees':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                );
            case 'Payroll':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'Organization':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                );
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'Leaves': return 'text-orange-500 bg-orange-100 dark:bg-orange-900/30';
            case 'Attendance': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
            case 'Employees': return 'text-green-500 bg-green-100 dark:bg-green-900/30';
            case 'Payroll': return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
            case 'Organization': return 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30';
            default: return 'text-gray-500 bg-gray-100 dark:bg-gray-700';
        }
    };

    return (
        <div className={`p-4 rounded-xl border transition-all duration-200 ${enabled
                ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
            }`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(permission.category)}`}>
                        {getCategoryIcon(permission.category)}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{permission.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{permission.description}</p>
                    </div>
                </div>
                <ToggleSwitch enabled={enabled} onChange={onChange} disabled={disabled} />
            </div>
        </div>
    );
};

// Role Tab Component
const RoleTab = ({ role, isActive, onClick }) => {
    const getRoleIcon = (roleId) => {
        if (roleId === 2) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            );
        }
        return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        );
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
        >
            {getRoleIcon(role.id)}
            <span>{role.name}</span>
        </button>
    );
};

// Notification Toast Component
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-slide-in ${type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
            {type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            )}
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-75">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

// Main Settings Page
const SettingsPage = () => {
    const [roles, setRoles] = useState([
        { id: 2, name: 'Admin', permissions: {} },
        { id: 3, name: 'HR', permissions: {} }
    ]);
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [activeRoleId, setActiveRoleId] = useState(2);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permissionsRes] = await Promise.all([
                api.get('/role-permissions'),
                api.get('/permissions/available')
            ]);
            setRoles(rolesRes.data);
            setAvailablePermissions(permissionsRes.data);
        } catch (err) {
            console.error('Failed to fetch permissions:', err);
            setToast({ message: 'Failed to load permissions', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionChange = useCallback((permissionKey, value) => {
        setRoles(prevRoles =>
            prevRoles.map(role =>
                role.id === activeRoleId
                    ? { ...role, permissions: { ...role.permissions, [permissionKey]: value } }
                    : role
            )
        );
        setHasChanges(true);
    }, [activeRoleId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const activeRole = roles.find(r => r.id === activeRoleId);
            await api.put(`/role-permissions/${activeRoleId}`, activeRole.permissions);
            setToast({ message: `${activeRole.name} permissions updated successfully!`, type: 'success' });
            setHasChanges(false);
        } catch (err) {
            console.error('Failed to save permissions:', err);
            setToast({ message: 'Failed to save permissions', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleEnableAll = () => {
        const allEnabled = {};
        availablePermissions.forEach(p => {
            allEnabled[p.key] = true;
        });
        setRoles(prevRoles =>
            prevRoles.map(role =>
                role.id === activeRoleId
                    ? { ...role, permissions: allEnabled }
                    : role
            )
        );
        setHasChanges(true);
    };

    const handleDisableAll = () => {
        const allDisabled = {};
        availablePermissions.forEach(p => {
            allDisabled[p.key] = false;
        });
        setRoles(prevRoles =>
            prevRoles.map(role =>
                role.id === activeRoleId
                    ? { ...role, permissions: allDisabled }
                    : role
            )
        );
        setHasChanges(true);
    };

    const activeRole = roles.find(r => r.id === activeRoleId);
    const groupedPermissions = availablePermissions.reduce((acc, perm) => {
        if (!acc[perm.category]) acc[perm.category] = [];
        acc[perm.category].push(perm);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading permissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">System Settings</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage role-based permissions for Admin and HR users
                </p>
            </div>

            {/* Role Tabs */}
            <div className="flex gap-4 mb-8">
                {roles.map(role => (
                    <RoleTab
                        key={role.id}
                        role={role}
                        isActive={activeRoleId === role.id}
                        onClick={() => setActiveRoleId(role.id)}
                    />
                ))}
            </div>

            {/* Permissions Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Section Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {activeRole?.name} Permissions
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Toggle permissions to grant or revoke access for all {activeRole?.name} users
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleEnableAll}
                            className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                        >
                            Enable All
                        </button>
                        <button
                            onClick={handleDisableAll}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                        >
                            Disable All
                        </button>
                    </div>
                </div>

                {/* Permissions Grid */}
                <div className="p-6 space-y-8">
                    {Object.entries(groupedPermissions).map(([category, permissions]) => (
                        <div key={category}>
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                                {category}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {permissions.map(permission => (
                                    <PermissionCard
                                        key={permission.key}
                                        permission={permission}
                                        enabled={activeRole?.permissions?.[permission.key] || false}
                                        onChange={(value) => handlePermissionChange(permission.key, value)}
                                        disabled={saving}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Save Button */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {hasChanges && (
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                                You have unsaved changes
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${saving || !hasChanges
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40'
                            }`}
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Info Card */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">How Permissions Work</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            When you toggle a permission, it applies to <strong>all users</strong> of the selected role.
                            For example, enabling "Manage Leaves" for HR will allow all HR users to approve or reject leave requests.
                        </p>
                    </div>
                </div>
            </div>

            {/* Add animation styles */}
            <style>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default SettingsPage;
