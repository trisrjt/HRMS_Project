import api from "./axios";

export const fetchAnnouncements = async (params) => {
    return await api.get("/announcements", { params });
};

export const fetchAnnouncement = async (id) => {
    return await api.get(`/announcements/${id}`);
};

export const createAnnouncement = async (data) => {
    return await api.post("/announcements", data);
};

export const updateAnnouncement = async (id, data) => {
    return await api.put(`/announcements/${id}`, data);
};

export const deleteAnnouncement = async (id) => {
    return await api.delete(`/announcements/${id}`);
};

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return await api.post("/announcements/upload-file", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const trackView = async (id) => {
    return await api.post(`/announcements/${id}/track-view`);
};
