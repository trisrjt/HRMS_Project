import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Eye, UserX, X, CheckCircle, AlertCircle, Shield } from "lucide-react";
import api from "../../../api/axios";
import PermissionModal from "../../../components/PermissionModal";

const UserManagementPage = () => {
    // State
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    // Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role_id: 4, // Default to Employee
        temp_password: "", // Optional
    });

    // Fetch Users (Real Data Only)
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            // Create a timeout promise that rejects after 15 seconds
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out - Server took too long')), 15000)
            );

            // Attempt to fetch from API with race against timeout
            const response = await Promise.race([
                api.get("/users"),
                timeoutPromise
            ]);

            if (Array.isArray(response.data)) {
                setUsers(response.data);
            } else {
                throw new Error("Invalid response format: Expected array of users");
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
            setError(err.message || "Failed to load users from server");
            // Do NOT set dummy users.
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const [isEditing, setIsEditing] = useState(false);

    // Success Modal State
    const [successModal, setSuccessModal] = useState({ show: false, message: "" });

    // ... (fetchUsers remains same) ...

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleEdit = (user) => {
        setIsEditing(true);
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            role_id: user.role_id,
            temp_password: "", // Leave blank if not changing
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            await api.delete(`/users/${userId}`);
            fetchUsers();
            setSuccessModal({ show: true, message: "User deleted successfully" });
        } catch (err) {
            console.error("Failed to delete user", err);
            alert("Failed to delete user");
        }
    };


    const generatePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let pass = "";
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return pass;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEditing && selectedUser) {
                // Update
                const payload = { ...formData };
                if (!payload.temp_password) delete payload.temp_password; // Don't send empty password on update
                await api.put(`/users/${selectedUser.id}`, payload);
                setSuccessModal({ show: true, message: "User updated successfully" });
            } else {
                // Create
                const payload = { ...formData };
                if (!payload.temp_password) {
                    payload.temp_password = generatePassword(); // Auto-generate if blank
                }
                await api.post("/users", payload);
                setSuccessModal({ show: true, message: "User created successfully. Password: " + payload.temp_password });
            }
            fetchUsers();
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            console.error("Failed to save user", err);
            alert("Failed to save user: " + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: "", email: "", role_id: 4, temp_password: "" });
        setIsEditing(false);
        setSelectedUser(null);
    };

    const getRoleName = (roleId) => {
        switch (roleId) {
            case 1: return "Super Admin";
            case 2: return "Admin";
            case 3: return "HR";
            case 4: return "Employee";
            default: return "Unknown";
        }
    };

    const getRoleBadgeColor = (roleId) => {
        switch (roleId) {
            case 1: return "bg-purple-100 text-purple-800";
            case 2: return "bg-blue-100 text-blue-800";
            case 3: return "bg-pink-100 text-pink-800";
            case 4: return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    // Derived State
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter ? user.role_id === parseInt(roleFilter) : true;

        let matchesStatus = true;
        if (statusFilter === "active") matchesStatus = user.is_active;
        if (statusFilter === "inactive") matchesStatus = !user.is_active;

        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage system users, roles, and permissions.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors shadow-sm font-medium"
                >
                    <Plus size={20} />
                    Create User
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        id="user_search"
                        name="search"
                        aria-label="Search users"
                        autoComplete="off"
                        placeholder="Search users by name or email..."
                        className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    id="role_filter"
                    name="role"
                    aria-label="Filter by Role"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="">All Roles</option>
                    <option value="1">Super Admin</option>
                    <option value="2">Admin</option>
                    <option value="3">HR</option>
                    <option value="4">Employee</option>
                </select>
                <select
                    id="status_filter"
                    name="status"
                    aria-label="Filter by Status"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                    // Empty State
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                            <UserX size={48} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No users found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    // User Table
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-5 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Face Enrollment</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-sm mr-3">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role_id)}`}>
                                                {user.role?.name || getRoleName(user.role_id)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(() => {
                                                const hasFaceData = user.face_descriptor || user.employee?.face_descriptor;
                                                const isEnrolled = hasFaceData && hasFaceData !== 'null' && hasFaceData.trim() !== '';
                                                return isEnrolled ? (
                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        ✅ Face Enrolled
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                                        ⏳ Enrollment Pending
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                {(user.role_id === 2 || user.role_id === 3) && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setIsPermissionModalOpen(true);
                                                        }}
                                                        className="p-1 text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                                                        title="Manage Permissions"
                                                    >
                                                        <Shield size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                    title="View"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Crud Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {isEditing ? "Edit User" : "Create New User"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="user_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    id="user_name"
                                    name="name"
                                    autoComplete="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="user_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    id="user_email"
                                    name="email"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="user_role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                <select
                                    id="user_role"
                                    name="role_id"
                                    autoComplete="off"
                                    value={formData.role_id}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value={1}>Super Admin</option>
                                    <option value={2}>Admin</option>
                                    <option value={3}>HR</option>
                                    <option value={4}>Employee</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="user_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Password <span className="text-gray-400 dark:text-gray-500 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="password"
                                    id="user_password"
                                    name="temp_password"
                                    autoComplete="new-password"
                                    value={formData.temp_password}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder={isEditing ? "Leave blank to keep current" : "Auto-generated if blank"}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Permission Modal */}
            {isPermissionModalOpen && selectedUser && (
                <PermissionModal
                    user={selectedUser}
                    onClose={() => {
                        setIsPermissionModalOpen(false);
                        setSelectedUser(null);
                    }}
                    onUpdate={(updatedUser) => {
                        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
                    }}
                />
            )}

            {/* Success Modal */}
            {successModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 text-center transform transition-all duration-200 scale-100">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Success!</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-mono select-all bg-gray-50 dark:bg-gray-900 p-2 rounded break-all">{successModal.message}</p>
                        <button
                            onClick={() => setSuccessModal({ show: false, message: "" })}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;
