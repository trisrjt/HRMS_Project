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
});
};

/**
 * Calculates the difference between two time strings (HH:mm:ss) in hours and minutes.
 * @param {string} checkIn - Check-in time (HH:mm:ss)
 * @param {string} checkOut - Check-out time (HH:mm:ss)
 * @returns {string} - Duration (e.g., "8h 30m") or "—"
 */
export const calculateHours = (checkIn, checkOut) => {
    if (!checkIn) return "—";
    if (!checkOut) return "Working...";

    const start = new Date(`1970-01-01T${checkIn}`);
    const end = new Date(`1970-01-01T${checkOut}`);
    const diffMs = end - start;

    if (diffMs < 0) return "—"; // Handle cases where checkout might be before checkin (e.g. overnight, though not expected per requirements)

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

    return `${hours}h ${minutes}m`;
};
