import React from 'react';

const LeavesPage = () => {
    return (
        <div style={{ padding: "2rem" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "1rem" }}>Leave Requests</h1>
            <p>Manage leave requests from all employees.</p>
            <div style={{ padding: "1rem", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e5e7eb", marginTop: "1rem" }}>
                <p style={{ color: "#6b7280" }}>Leave requests will be displayed here.</p>
            </div>
        </div>
    );
};

export default LeavesPage;
