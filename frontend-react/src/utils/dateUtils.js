/**
 * Formats a time string (HH:mm:ss) to 12-hour format with AM/PM.
 * Treats the input string as local time (no timezone conversion).
 * 
 * @param {string} timeString - The time string (e.g., "14:30:00")
 * @returns {string} - Formatted time (e.g., "02:30 PM")
 */
export const formatTime = (timeString) => {
    if (!timeString) return "--:--";

    // Check if it's already in 12-hour format or invalid
    if (!timeString.includes(":")) return timeString;

    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));

    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
};

/**
 * Formats a date string (YYYY-MM-DD) to a readable format.
 * Example: "2023-10-27" -> "Oct 27, 2023"
 * @param {string} dateString 
 * @returns {string}
 */
export const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
};
