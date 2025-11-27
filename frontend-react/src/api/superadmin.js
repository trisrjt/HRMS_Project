import api from "./axios";

export const getStats = async () => {
    const response = await api.get("/superadmin/stats");
    return response.data;
};

export const getActivityLog = async () => {
    const response = await api.get("/superadmin/activity-log");
    return response.data;
};

export const getSystemHealth = async () => {
    const response = await api.get("/superadmin/system-health");
    return response.data;
};
