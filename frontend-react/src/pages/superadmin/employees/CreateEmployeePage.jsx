import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";

const CreateUserPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSuperAdmin = user?.role_id === 1;
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role_id: 4, // Default to Employee
        joining_category: "New Joinee",
        temp_password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [files, setFiles] = useState({
        aadhar_file: null,
        pan_file: null
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (files.aadhar_file) data.append('aadhar_file', files.aadhar_file);
        if (files.pan_file) data.append('pan_file', files.pan_file);

        try {
            await api.post("/users", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setSuccess("User created successfully!");
            setTimeout(() => {
                navigate("/superadmin/users");
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create user.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Create New User</h1>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-lg mb-6">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                <div className="mb-6">
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="role_id" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Role
                    </label>
                    <select
                        id="role_id"
                        name="role_id"
                        value={formData.role_id}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                    >
                        {isSuperAdmin && <option value={2}>Admin</option>}
                        {isSuperAdmin && <option value={3}>HR</option>}
                        <option value={4}>Employee</option>
                    </select>
                </div>

                {parseInt(formData.role_id) === 4 && (
                    <>
                        <div className="mb-6">
                            <label htmlFor="joining_category" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Joining Category
                            </label>
                            <select
                                id="joining_category"
                                name="joining_category"
                                value={formData.joining_category}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                            >
                                <option value="New Joinee">New Joinee</option>
                                <option value="Intern">Intern</option>
                                <option value="Permanent">Permanent</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label htmlFor="aadhar_file" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Aadhar Card (PDF/Image)
                                </label>
                                <input
                                    type="file"
                                    id="aadhar_file"
                                    name="aadhar_file"
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="pan_file" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    PAN Card (PDF/Image)
                                </label>
                                <input
                                    type="file"
                                    id="pan_file"
                                    name="pan_file"
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-sm"
                                />
                            </div>
                        </div>
                    </>
                )}

                <div className="mb-8">
                    <label htmlFor="temp_password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Temporary Password
                    </label>
                    <input
                        type="text"
                        id="temp_password"
                        name="temp_password"
                        value={formData.temp_password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                        required
                        minLength={4}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating..." : "Create User"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/superadmin/users")}
                        className="px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form >
        </div >
    );
};

export default CreateUserPage;
