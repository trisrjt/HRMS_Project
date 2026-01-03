import React from "react";
import { Eye, Edit2, Trash2, ChevronLeft, ChevronRight, Users, Calendar, BarChart2 } from "lucide-react";

const AnnouncementTable = ({ announcements = [], loading, pagination, onPageChange, onView, onEdit, onDelete }) => {
    const getStatusBadge = (status) => {
        const styles = status === "Active"
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles}`}>
                {status}
            </span>
        );
    };

    const getCategoryBadge = (category) => {
        const colors = {
            General: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
            HR: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
            Payroll: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
            Events: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
            Urgent: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
        };
        return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${colors[category] || "bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                {category}
            </span>
        );
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading announcements...</div>;
    }



    const safeAnnouncements = Array.isArray(announcements) ? announcements : [];

    if (safeAnnouncements.length === 0) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">No announcements found.</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Audience</th>
                            <th className="px-6 py-4">Posted By</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Views</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {safeAnnouncements.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{(item.message || "").replace(/<[^>]+>/g, '')}</div>
                                </td>
                                <td className="px-6 py-4">{getCategoryBadge(item.category)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                                        <Users size={14} className="text-gray-400 dark:text-gray-500" />
                                        {Array.isArray(item.target_audience) ? item.target_audience.join(", ") : item.target_audience}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                    {item.user?.name || "Unknown"}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">{getStatusBadge(item.status)}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                                        <BarChart2 size={14} className="text-gray-400 dark:text-gray-500" />
                                        {item.views_count || 0}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onView(item)}
                                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                            title="View"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(item.id)}
                                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
                    <button
                        onClick={() => onPageChange(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} /> Previous
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Page {pagination.current_page} of {pagination.last_page}
                    </span>
                    <button
                        onClick={() => onPageChange(pagination.current_page + 1)}
                        disabled={pagination.current_page === pagination.last_page}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AnnouncementTable;
