import React from 'react';

const AttendancePage = () => {
    return (
        <div style={{ padding: "2rem" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "1rem" }}>System Attendance</h1>
            <p>View attendance records for all users.</p>
            <div style={{ padding: "1rem", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e5e7eb", marginTop: "1rem" }}>
                <p style={{ color: "#6b7280" }}>Attendance records will be displayed here.</p>
            </div>
        </div>
    );
};

export default AttendancePage;
