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

/**
 * Checks if a date string (YYYY-MM-DD) is in the current week (Mon-Sun).
 * @param {string} dateString
 * @returns {boolean}
 */
export const isDateInCurrentWeek = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const currentDay = today.getDay(); // 0 (Sun) - 6 (Sat)
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;

    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const [y, m, d] = dateString.split('-').map(Number);
    const checkDate = new Date(y, m - 1, d); // Local midnight

    return checkDate >= monday && checkDate <= sunday;
};

/**
 * Calculates weekly total hours and days worked.
 * @param {Array} attendanceList - List of attendance records
 * @returns {Object} - { hours, minutes, daysWorked, formatted, average }
 */
export const calculateWeeklyStats = (attendanceList) => {
    let totalMs = 0;
    let daysWorked = 0;

    if (!Array.isArray(attendanceList)) return { hours: 0, minutes: 0, daysWorked: 0, formatted: "0h 0m", average: "0h 0m" };

    attendanceList.forEach(a => {
        if (isDateInCurrentWeek(a.date) && a.check_in && a.check_out) {
            const start = new Date(`1970-01-01T${a.check_in}`);
            const end = new Date(`1970-01-01T${a.check_out}`);
            totalMs += (end - start);
            daysWorked++;
        }
    });

    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs / (1000 * 60)) % 60);

    // Average
    let avgHours = 0;
    let avgMinutes = 0;
    if (daysWorked > 0) {
        const avgMs = totalMs / daysWorked;
        avgHours = Math.floor(avgMs / (1000 * 60 * 60));
        avgMinutes = Math.floor((avgMs / (1000 * 60)) % 60);
    }

    return {
        hours,
        minutes,
        daysWorked,
        formatted: `${hours}h ${minutes}m`,
        average: `${avgHours}h ${avgMinutes}m`
    };
};

/**
 * Calculates monthly total hours and days worked.
 * @param {Array} attendanceList - List of attendance records
 * @param {string} month - Month string (YYYY-MM)
 * @returns {Object} - { hours, minutes, daysWorked, formatted, average }
 */
export const calculateMonthlyStats = (attendanceList, month) => {
    let totalMs = 0;
    let daysWorked = 0;

    if (!Array.isArray(attendanceList) || !month) return { hours: 0, minutes: 0, daysWorked: 0, formatted: "0h 0m", average: "0h 0m" };

    attendanceList.forEach(a => {
        if (a.date.startsWith(month) && a.check_in && a.check_out) {
            const start = new Date(`1970-01-01T${a.check_in}`);
            const end = new Date(`1970-01-01T${a.check_out}`);
            totalMs += (end - start);
            daysWorked++;
        }
    });

    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs / (1000 * 60)) % 60);

    // Average
    let avgHours = 0;
    let avgMinutes = 0;
    if (daysWorked > 0) {
        const avgMs = totalMs / daysWorked;
        avgHours = Math.floor(avgMs / (1000 * 60 * 60));
        avgMinutes = Math.floor((avgMs / (1000 * 60)) % 60);
    }

    return {
        hours,
        minutes,
        daysWorked,
        formatted: `${hours}h ${minutes}m`,
        average: `${avgHours}h ${avgMinutes}m`
    };
};
