import React, { useState, useEffect } from "react";
import { X, Upload, Check, AlertCircle } from "lucide-react";

const AnnouncementFormModal = ({ isOpen, onClose, onSubmit, initialData = null, isSubmitting }) => {
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        category: "General",
        target_audience: [],
        status: "Active",
        file: null,
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || "",
                message: initialData.message || "",
                category: initialData.category || "General",
                target_audience: Array.isArray(initialData.target_audience) ? initialData.target_audience : [],
                status: initialData.status || "Active",
                file: null, // Reset file on edit
            });
        } else {
            setFormData({
                title: "",
                message: "",
                category: "General",
                target_audience: [],
                status: "Active",
                file: null,
            });
        }
        setErrors({});
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleAudienceChange = (role) => {
        setFormData(prev => {
            const current = prev.target_audience;
            const updated = current.includes(role)
                ? current.filter(r => r !== role)
                : [...current, role];
            return { ...prev, target_audience: updated };
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, file }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.message.trim()) newErrors.message = "Message is required";
        if (formData.target_audience.length === 0) newErrors.target_audience = "Select at least one audience";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {initialData ? "Edit Announcement" : "Create Announcement"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label htmlFor="announcement_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                            id="announcement_title"
                            type="text"
                            name="title"
                            autoComplete="off"
                            value={formData.title}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.title ? "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800" : "border-gray-200 dark:border-gray-600"}`}
                            placeholder="Enter announcement title"
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>

                    {/* Category & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="announcement_category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select
                                id="announcement_category"
                                name="category"
                                autoComplete="off"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                            >
                                <option value="General">General</option>
                                <option value="HR">HR</option>
                                <option value="Payroll">Payroll</option>
                                <option value="Events">Events</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="announcement_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select
                                id="announcement_status"
                                name="status"
                                autoComplete="off"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Target Audience */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Audience</label>
                        <div className="flex flex-wrap gap-3">
                            {["Employee", "Admin", "HR", "SuperAdmin"].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => handleAudienceChange(role)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${formData.target_audience.includes(role)
                                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                                        : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                        {errors.target_audience && <p className="text-red-500 text-xs mt-1">{errors.target_audience}</p>}
                    </div>

                    {/* Message (Custom Textarea) */}
                    <div>
                        <label htmlFor="announcement_message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                        <textarea
                            id="announcement_message"
                            name="message"
                            autoComplete="off"
                            value={formData.message}
                            onChange={handleChange}
                            rows={6}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.message ? "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800" : "border-gray-200 dark:border-gray-600"}`}
                            placeholder="Write your announcement here..."
                        />
                        {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                    </div>

                    {/* Attachment */}
                    <div>
                        <label htmlFor="announcement_file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attachment (Optional)</label>
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer relative">
                            <input
                                id="announcement_file"
                                name="file"
                                type="file"
                                autoComplete="off"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                            />
                            <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                                <Upload size={24} />
                                <span className="text-sm">
                                    {formData.file ? formData.file.name : "Click to upload or drag and drop"}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">PDF, DOC, PNG, JPG (Max 5MB)</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? "Saving..." : (
                                <>
                                    <Check size={16} />
                                    {initialData ? "Update Announcement" : "Publish Announcement"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AnnouncementFormModal;
