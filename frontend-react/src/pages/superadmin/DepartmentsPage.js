import React from 'react';

const DepartmentsPage = () => {
    return (
        <div style={{ padding: "2rem" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "1rem" }}>Departments</h1>
            <p>Manage company departments.</p>
            <div style={{ padding: "1rem", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e5e7eb", marginTop: "1rem" }}>
                <p style={{ color: "#6b7280" }}>Department list will be displayed here.</p>
            </div>
        </div>
    );
};

export default DepartmentsPage;
