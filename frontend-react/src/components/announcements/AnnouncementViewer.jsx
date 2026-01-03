import React from "react";
import { X, Calendar, User, FileText, Download, Eye } from "lucide-react";

const AnnouncementViewer = ({ isOpen, onClose, announcement }) => {
    if (!isOpen || !announcement) return null;

    const getCategoryColor = (category) => {
        const colors = {
            General: "bg-blue-50 text-blue-600",
            HR: "bg-purple-50 text-purple-600",
            Payroll: "bg-green-50 text-green-600",
            Events: "bg-yellow-50 text-yellow-600",
            Urgent: "bg-red-50 text-red-600",
        };
        return colors[category] || "bg-gray-50 text-gray-600";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors duration-200">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <div className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium mb-3 ${getCategoryColor(announcement.category)}`}>
                            {announcement.category}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                            {announcement.title}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-6 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400 dark:text-gray-500" />
                        <span>{announcement.posted_by?.name || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400 dark:text-gray-500" />
                        <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Eye size={16} className="text-gray-400 dark:text-gray-500" />
                        <span>{announcement.views_count || 0} Views</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="prose prose-blue dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {announcement.message}
                    </div>

                    {/* Attachment */}
                    {announcement.attachment_url && (
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <FileText size={16} className="text-gray-500 dark:text-gray-400" />
                                Attachment
                            </h4>
                            <a
                                href={announcement.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-white dark:group-hover:bg-gray-600 transition-colors">
                                        <FileText size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                        View Attachment
                                    </span>
                                </div>
                                <Download size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementViewer;
