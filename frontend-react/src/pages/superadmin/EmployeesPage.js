import React from 'react';

const EmployeesPage = () => {
    return (
        <div style={{ padding: "2rem" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "1rem" }}>All Employees</h1>
            <p>Manage all employees in the system.</p>
            {/* Placeholder for employee management table */}
            <div style={{ padding: "1rem", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e5e7eb", marginTop: "1rem" }}>
                <p style={{ color: "#6b7280" }}>Employee list will be displayed here.</p>
            </div>
        </div>
    );
};

export default EmployeesPage;
