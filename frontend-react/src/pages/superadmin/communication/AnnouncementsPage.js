import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import {
    fetchAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    uploadFile,
    trackView
} from "../../../api/announcements";
import FilterBar from "../../../components/announcements/FilterBar";
import AnnouncementTable from "../../../components/announcements/AnnouncementTable";
import AnnouncementFormModal from "../../../components/announcements/AnnouncementFormModal";
import AnnouncementViewer from "../../../components/announcements/AnnouncementViewer";

const AnnouncementsPage = () => {
    // State
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [filters, setFilters] = useState({
        search: "",
        category: "",
        status: "",
        audience: "",
        startDate: "",
        endDate: "",
    });

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Fetch
    useEffect(() => {
        loadAnnouncements();
    }, [pagination.current_page, filters]);

    const loadAnnouncements = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current_page,
                ...filters
            };
            const response = await fetchAnnouncements(params);
            setAnnouncements(response.data.data || []);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
            });
        } catch (error) {
            console.error("Failed to load announcements", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPagination(prev => ({ ...prev, current_page: 1 })); // Reset to page 1
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }));
    };

    const handleCreate = () => {
        setSelectedAnnouncement(null);
        setIsFormOpen(true);
    };

    const handleEdit = (announcement) => {
        setSelectedAnnouncement(announcement);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;
        try {
            await deleteAnnouncement(id);
            loadAnnouncements();
        } catch (error) {
            console.error("Failed to delete announcement", error);
            alert("Failed to delete announcement.");
        }
    };

    const handleView = async (announcement) => {
        setSelectedAnnouncement(announcement);
        setIsViewerOpen(true);
        try {
            await trackView(announcement.id);
            // Update local view count to reflect immediate change
            setAnnouncements(prev => prev.map(a =>
                a.id === announcement.id ? { ...a, views_count: (a.views_count || 0) + 1 } : a
            ));
        } catch (error) {
            console.error("Failed to track view", error);
        }
    };

    const handleFormSubmit = async (formData) => {
        setIsSubmitting(true);

        try {
            let attachmentUrl = selectedAnnouncement?.attachment_url;

            // Upload file if present
            if (formData.file) {

                const uploadResponse = await uploadFile(formData.file);

                attachmentUrl = uploadResponse.data.url;
            }

            const payload = {
                ...formData,
                attachment_url: attachmentUrl,
            };



            if (selectedAnnouncement) {
                await updateAnnouncement(selectedAnnouncement.id, payload);
            } else {
                await createAnnouncement(payload);
            }

            setIsFormOpen(false);
            loadAnnouncements();
        } catch (error) {
            console.error("Failed to save announcement", error);
            console.error("Error response:", error.response?.data);
            alert(`Failed to save announcement: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage system-wide announcements</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                    <Plus size={20} />
                    Create Announcement
                </button>
            </div>

            {/* Filters */}
            <FilterBar filters={filters} onFilterChange={handleFilterChange} />

            {/* Table */}
            <AnnouncementTable
                announcements={announcements}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Modals */}
            <AnnouncementFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={selectedAnnouncement}
                isSubmitting={isSubmitting}
            />

            <AnnouncementViewer
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                announcement={selectedAnnouncement}
            />
        </div>
    );
};

export default AnnouncementsPage;
