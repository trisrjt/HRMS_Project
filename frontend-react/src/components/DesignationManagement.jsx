import React, { useState, useEffect } from "react";
import {
    Plus,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    Search,
    AlertCircle,
    X,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

const DesignationManagement = () => {
    const { user } = useAuth();
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
    const [currentDesignation, setCurrentDesignation] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        // level: "",
        description: "",
        is_active: true,
    });
    const [errors, setErrors] = useState({});
    const [submitLoading, setSubmitLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    // Permission check
    // user.role_id: 1=SuperAdmin, 2=Admin, 3=HR
    const canManage = user?.role_id === 1 || user?.role_id === 2 || user?.role_id === 3 || user?.permissions?.includes("can_manage_designations") || user?.can_manage_designations;

    const fetchDesignations = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/designations");
            setDesignations(response.data);
        } catch (error) {
            console.error("Error fetching designations:", error);
            showNotification("error", "Failed to fetch designations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDesignations();
    }, []);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleOpenModal = (mode, designation = null) => {
        setModalMode(mode);
        setCurrentDesignation(designation);
        setFormData({
            name: designation ? designation.name : "",
            // level: designation ? designation.level : "", 
            description: designation?.description || "",
            is_active: designation ? designation.is_active : true,
        });
        setErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentDesignation(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setErrors({});

        try {
            if (modalMode === "create") {
                await axios.post("/designations", formData);
                showNotification("success", "Designation created successfully!");
            } else {
                await axios.put(`/designations/${currentDesignation.id}`, formData);
                showNotification("success", "Designation updated successfully!");
            }
            fetchDesignations();
            handleCloseModal();
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                showNotification("error", error.response?.data?.message || "Operation failed.");
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this designation?")) return;

        try {
            await axios.delete(`/designations/${id}`);
            showNotification("success", "Designation deleted successfully!");
            fetchDesignations();
        } catch (error) {
            showNotification("error", error.response?.data?.message || "Failed to delete.");
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        // Optimistic update
        const updatedList = designations.map(d =>
            d.id === id ? { ...d, is_active: !currentStatus } : d
        );
        setDesignations(updatedList);

        try {
            await axios.put(`/designations/${id}`, { ...designations.find(d => d.id === id), is_active: !currentStatus });
            showNotification("success", "Status updated.");
            fetchDesignations(); // Refresh to be sure
        } catch (error) {
            showNotification("error", "Failed to update status.");
            fetchDesignations(); // Revert
        }
    };

    const filteredDesignations = designations.filter((designation) =>
        designation.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Header matches AdminEmployeesPage */}
            <div className="flex justify-between items-center p-6 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Designations</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Define hierarchy and organizational titles</p>
                </div>
                {canManage && (
                    <button
                        onClick={() => handleOpenModal("create")}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow transition duration-150 ease-in-out"
                    >
                        <Plus size={18} />
                        Add Designation
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6">

                {/* Notification */}
                {notification && (
                    <div
                        className={`mb-4 p-4 rounded-lg flex items-center gap-2 shadow-sm ${notification.type === "success"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                            }`}
                    >
                        {notification.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {notification.message}
                    </div>
                )}

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center">
                        <div className="relative w-full max-w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <label htmlFor="search-designations" className="sr-only">Search Designations</label>
                            <input
                                type="text"
                                id="search-designations"
                                name="search"
                                autoComplete="off"
                                placeholder="Search designations..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                {/* <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Hierarchy Level
                                </th> */}
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                {canManage && (
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        Loading designations...
                                    </td>
                                </tr>
                            ) : filteredDesignations.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No designations found.
                                    </td>
                                </tr>
                            ) : (
                                filteredDesignations.map((designation) => (
                                    <tr key={designation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-200 dark:ring-blue-800">
                                                {designation.level}
                                            </span>
                                        </td> */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {designation.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                            {designation.description || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${designation.is_active
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                                    }`}
                                            >
                                                {designation.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        {canManage && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => handleToggleStatus(designation.id, designation.is_active)}
                                                        className={`text-xs ${designation.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                                    >
                                                        {designation.is_active ? 'Disable' : 'Enable'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal("edit", designation)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(designation.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {modalMode === "create" ? "Add Designation" : "Edit Designation"}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="designation_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Designation Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="designation_name"
                                    name="name"
                                    autoComplete="off"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                    placeholder="e.g. Senior Developer"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                            </div>

                            <div>
                                <label htmlFor="designation_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="designation_description"
                                    name="description"
                                    autoComplete="off"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors resize-none h-24"
                                    placeholder="Optional description..."
                                    value={formData.description || ""}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    name="is_active"
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                    Active Status
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    {submitLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Designation"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesignationManagement;
