import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { formatDate } from "../../utils/dateUtils";
import { useAuth } from "../../context/AuthContext";
import FaceEnrollment from "../../components/FaceEnrollment";

const HREmployeesPage = () => {
    const { user } = useAuth();
    // HR usually has manage permissions, but verify role_id 3
    const canManage = user?.role_id === 3 || user?.can_manage_employees;

    // Data States
    const [employees, setEmployees] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter & Search States
    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Form States
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        department_id: "",
        designation_name: "",
        date_of_joining: "",
        dob: "",
        aadhar_number: "",
        pan_number: "",
        emergency_contact: "",
        gender: "",
        marital_status: "",
        profile_photo: null,
        basic: "",
        hra: "",
        da: "",
        allowances: "",
        deductions: "",
        gross_salary: "",
        phone: "",
        address: "",
        status: "Active",
        reports_to: ""
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Password Modal State
    const [createdPassword, setCreatedPassword] = useState(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    // Face Enrollment States
    const [showFaceEnrollment, setShowFaceEnrollment] = useState(false);
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [faceImage, setFaceImage] = useState(null);
    const [pendingEmployeeData, setPendingEmployeeData] = useState(null);

    // Initial Data Fetch
    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
        fetchDesignations();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            // Using common /employees endpoint accessible to HR (Role 3)
            const response = await api.get("/employees");
            setEmployees(response.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch employees", err);
            setError("Failed to load employees.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/departments");
            setDepartments(response.data);
        } catch (err) {
            console.error("Failed to fetch departments", err);
        }
    };

    const fetchDesignations = async () => {
        try {
            const response = await api.get("/designations");
            setDesignations(response.data);
        } catch (err) {
            console.error("Failed to fetch designations", err);
        }
    };

    // Filtering & Sorting Logic
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch =
            emp.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            emp.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            emp.employee_code?.toLowerCase().includes(search.toLowerCase());

        const matchesDept = departmentFilter ? emp.department_id === parseInt(departmentFilter) : true;
        const matchesStatus = statusFilter ? (statusFilter === "Active" ? emp.user?.is_active : !emp.user?.is_active) : true;

        return matchesSearch && matchesDept && matchesStatus;
    }).sort((a, b) => {
        if (sortConfig.key === "name") {
            return sortConfig.direction === "asc"
                ? a.user?.name.localeCompare(b.user?.name)
                : b.user?.name.localeCompare(a.user?.name);
        }
        if (sortConfig.key === "department") {
            return sortConfig.direction === "asc"
                ? (a.department?.name || "").localeCompare(b.department?.name || "")
                : (b.department?.name || "").localeCompare(a.department?.name || "");
        }
        if (sortConfig.key === "date_of_joining") {
            return sortConfig.direction === "asc"
                ? new Date(a.date_of_joining) - new Date(b.date_of_joining)
                : new Date(b.date_of_joining) - new Date(a.date_of_joining);
        }
        return 0;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredEmployees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
        }));
    };

    // Modal Handlers
    const openAddModal = () => {
        setFormData({
            name: "",
            email: "",
            department_id: "",
            designation_name: "",
            date_of_joining: "",
            dob: "",
            aadhar_number: "",
            pan_number: "",
            emergency_contact: "",
            gender: "",
            marital_status: "",
            profile_photo: null,
            basic: "",
            hra: "",
            da: "",
            allowances: "",
            deductions: "",
            gross_salary: "",
            phone: "",
            address: "",
            status: "Active",
            reports_to: ""
        });
        setFormErrors({});
        setIsAddModalOpen(true);
    };

    const openEditModal = (emp) => {
        setSelectedEmployee(emp);
        setFormData({
            name: emp.user?.name || "",
            email: emp.user?.email || "",
            department_id: emp.department_id || "",
            designation_name: emp.designation?.name || "",
            date_of_joining: emp.date_of_joining || "",
            dob: emp.dob || "",
            aadhar_number: emp.aadhar_number || "",
            pan_number: emp.pan_number || "",
            emergency_contact: emp.emergency_contact || "",
            gender: emp.gender || "",
            marital_status: emp.marital_status || "",
            profile_photo: null,
            basic: emp.current_salary?.basic || "",
            hra: emp.current_salary?.hra || "",
            da: emp.current_salary?.da || "",
            allowances: emp.current_salary?.allowances || "",
            deductions: emp.current_salary?.deductions || "",
            gross_salary: emp.current_salary?.gross_salary || "",
            phone: emp.phone || "",
            address: emp.address || "",
            status: emp.user?.is_active ? "Active" : "Inactive",
            reports_to: emp.reports_to || ""
        });
        setFormErrors({});
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (emp) => {
        setSelectedEmployee(emp);
        setIsDeleteModalOpen(true);
    };

    const openViewModal = (emp) => {
        setSelectedEmployee(emp);
        setIsViewModalOpen(true);
    };

    const closeModals = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsViewModalOpen(false);
        setSelectedEmployee(null);
    };

    // Form Submission
    const validateForm = () => {
        const errors = {};
        if (!formData.name) errors.name = "Name is required";
        if (!formData.email) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Invalid email format";
        }
        if (!formData.department_id) errors.department_id = "Department is required";
        if (!formData.designation_name) errors.designation_name = "Designation is required";
        if (!formData.date_of_joining) errors.date_of_joining = "Joining Date is required";
        if (!formData.dob) errors.dob = "Date of Birth is required";
        if (!formData.aadhar_number) {
            errors.aadhar_number = "Aadhar Number is required";
        } else if (!/^\d{12}$/.test(formData.aadhar_number)) {
            errors.aadhar_number = "Aadhar must be 12 digits";
        }
        if (formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.pan_number)) {
            errors.pan_number = "Invalid PAN format";
        }
        if (!formData.phone) {
            errors.phone = "Phone is required";
        } else if (!/^\d{10}$/.test(formData.phone)) {
            errors.phone = "Phone number must be exactly 10 digits";
        }
        if (formData.emergency_contact && !/^\d{10}$/.test(formData.emergency_contact)) {
            errors.emergency_contact = "Emergency contact must be 10 digits";
        }
        return errors;
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        // Store form data and open face enrollment
        setPendingEmployeeData(formData);
        setShowFaceEnrollment(true);
    };

    const handleFaceEnrolled = async (descriptor, imageBlob) => {
        setFaceDescriptor(descriptor);
        setFaceImage(imageBlob);
        setShowFaceEnrollment(false);

        // Now create the employee with face data
        setIsSubmitting(true);
        try {
            const data = new FormData();
            Object.keys(pendingEmployeeData).forEach(key => {
                if (pendingEmployeeData[key] !== null && pendingEmployeeData[key] !== "") {
                    data.append(key, pendingEmployeeData[key]);
                }
            });

            // Add face data
            data.append('face_descriptor', JSON.stringify(descriptor));
            data.append('face_image', imageBlob, 'face.jpg');

            // Using /employees endpoint
            const response = await api.post("/employees", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            fetchEmployees();
            closeModals();

            // Reset face enrollment state
            setFaceDescriptor(null);
            setFaceImage(null);
            setPendingEmployeeData(null);

            if (response.data.plain_password) {
                setCreatedPassword(response.data.plain_password);
                setIsPasswordModalOpen(true);
            }
        } catch (err) {
            console.error("Failed to create employee", err);
            setFormErrors({ api: err.response?.data?.message || "Failed to create employee" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        if (!selectedEmployee?.id) {
            setFormErrors({ api: "Invalid employee selected." });
            return;
        }

        setIsSubmitting(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== "") {
                    data.append(key, formData[key]);
                }
            });
            data.append("_method", "PUT");

            // Using /employees/{id} endpoint
            await api.post(`/employees/${selectedEmployee.id}`, data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            await fetchEmployees();
            closeModals();
        } catch (err) {
            console.error("Failed to update employee", err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to update employee";
            setFormErrors({ api: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Using /employees/{id} endpoint
            await api.delete(`/employees/${selectedEmployee.id}`);
            fetchEmployees();
            closeModals();
        } catch (err) {
            console.error("Failed to delete employee", err);
            alert("Failed to delete employee");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getProfilePhotoUrl = (path) => {
        if (!path) return null;
        return `http://localhost:8000/storage/${path}`;
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center p-6 border-b bg-white dark:bg-gray-800 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">HR Employees</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage workforce</p>
                </div>
                {canManage && (
                    <button
                        onClick={openAddModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow transition duration-150 ease-in-out"
                    >
                        + Add Employee
                    </button>
                )}
            </div>

            <div className="p-6 pb-0">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center">
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full max-w-[300px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full max-w-[200px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full max-w-[150px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {loading ? (
                    <div className="text-center p-8 text-gray-500">Loading employees...</div>
                ) : error ? (
                    <div className="text-center p-8 text-red-500">{error}</div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th onClick={() => handleSort("name")} className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer">Employee</th>
                                    <th onClick={() => handleSort("department")} className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer">Department</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Contact</th>
                                    <th onClick={() => handleSort("date_of_joining")} className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer">Joined</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedEmployees.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No employees found.</td></tr>
                                ) : (
                                    paginatedEmployees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900 dark:text-white">{emp.user?.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{emp.designation?.name || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{emp.department?.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-700 dark:text-gray-300">{emp.user?.email}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{emp.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDate(emp.date_of_joining)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${emp.user?.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                    {emp.user?.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-3">
                                                    <button onClick={() => openViewModal(emp)} className="text-blue-600 hover:text-blue-900">View</button>
                                                    {canManage && (
                                                        <>
                                                            <button onClick={() => openEditModal(emp)} className="text-amber-600 hover:text-amber-900">Edit</button>
                                                            <button onClick={() => openDeleteModal(emp)} className="text-red-600 hover:text-red-900">Delete</button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {/* Pagination controls simplified */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="px-4 py-2 border rounded disabled:opacity-50">Previous</button>
                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} className="px-4 py-2 border rounded disabled:opacity-50">Next</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Render Modals - Simplified for brevity but functional */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 transition-colors duration-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Employee</h2>
                        {formErrors.api && <div className="text-red-500 mb-4">{formErrors.api}</div>}
                        <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label htmlFor="add_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
                                <input id="add_name" name="name" type="text" autoComplete="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                                {formErrors.name && <p className="text-red-500 text-xs">{formErrors.name}</p>}
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="add_email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email *</label>
                                <input id="add_email" name="email" type="email" autoComplete="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="add_department" className="text-sm font-medium text-gray-700 dark:text-gray-300">Department *</label>
                                <select id="add_department" name="department_id" autoComplete="off" value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="add_designation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Designation *</label>
                                <input id="add_designation" name="designation_name" list="designation_options" autoComplete="off" placeholder="Select or Type Designation" value={formData.designation_name} onChange={(e) => setFormData({ ...formData, designation_name: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                                <datalist id="designation_options">
                                    {designations.map(d => (
                                        <option key={d.id} value={d.name} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="add_reports_to" className="text-sm font-medium text-gray-700 dark:text-gray-300">Reports To</label>
                                <select id="add_reports_to" name="reports_to" autoComplete="off" value={formData.reports_to} onChange={(e) => setFormData({ ...formData, reports_to: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">No Manager</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>{e.user?.name} ({e.designation?.name || 'N/A'})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="add_date_of_joining" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Joining *</label>
                                <input id="add_date_of_joining" name="date_of_joining" type="date" autoComplete="off" value={formData.date_of_joining} onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="add_dob" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth *</label>
                                <input id="add_dob" name="dob" type="date" autoComplete="bday" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="add_aadhar" className="text-sm font-medium text-gray-700 dark:text-gray-300">Aadhar *</label>
                                <input id="add_aadhar" name="aadhar_number" type="text" autoComplete="off" value={formData.aadhar_number} onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" maxLength={12} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="add_pan" className="text-sm font-medium text-gray-700 dark:text-gray-300">PAN</label>
                                <input id="add_pan" name="pan_number" type="text" autoComplete="off" value={formData.pan_number} onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" maxLength={10} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="add_phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone *</label>
                                <input id="add_phone" name="phone" type="text" autoComplete="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" maxLength={10} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="add_emergency" className="text-sm font-medium text-gray-700 dark:text-gray-300">Emergency</label>
                                <input id="add_emergency" name="emergency_contact" type="text" autoComplete="tel" value={formData.emergency_contact} onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" maxLength={10} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="add_gender" className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                                <select id="add_gender" name="gender" autoComplete="off" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="add_marital" className="text-sm font-medium text-gray-700 dark:text-gray-300">Marital Status</label>
                                <select id="add_marital" name="marital_status" autoComplete="off" value={formData.marital_status} onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Select Status</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                <label htmlFor="add_address" className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                                <textarea id="add_address" name="address" autoComplete="street-address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" rows="2"></textarea>
                            </div>
                            <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                <label htmlFor="add_profile_photo" className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</label>
                                <input id="add_profile_photo" name="profile_photo" type="file" autoComplete="off" onChange={(e) => setFormData({ ...formData, profile_photo: e.target.files[0] })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>

                            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
                                <button type="button" onClick={closeModals} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow">
                                    {isSubmitting ? "Creating..." : "Create Employee"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 transition-colors duration-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Employee</h2>
                        {formErrors.api && <div className="text-red-500 mb-4">{formErrors.api}</div>}
                        <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Reusing styled inputs for Edit form */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="edit_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
                                <input id="edit_name" name="name" type="text" autoComplete="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="edit_email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email *</label>
                                <input id="edit_email" name="email" type="email" autoComplete="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="edit_department" className="text-sm font-medium text-gray-700 dark:text-gray-300">Department *</label>
                                <select id="edit_department" name="department_id" autoComplete="off" value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="edit_designation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Designation *</label>
                                <input id="edit_designation" name="designation_name" list="designation_options_edit" autoComplete="off" placeholder="Select or Type Designation" value={formData.designation_name} onChange={(e) => setFormData({ ...formData, designation_name: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                                <datalist id="designation_options_edit">
                                    {designations.map(d => (
                                        <option key={d.id} value={d.name} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="edit_reports_to" className="text-sm font-medium text-gray-700 dark:text-gray-300">Reports To</label>
                                <select id="edit_reports_to" name="reports_to" autoComplete="off" value={formData.reports_to} onChange={(e) => setFormData({ ...formData, reports_to: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">No Manager</option>
                                    {employees.filter(e => {
                                        if (e.id === selectedEmployee?.id) return false;
                                        return true; // Show all employees
                                    }).map(e => (
                                        <option key={e.id} value={e.id}>{e.user?.name} ({e.designation?.name || 'N/A'})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="edit_status" className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                <select id="edit_status" name="status" autoComplete="off" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
                                <button type="button" onClick={closeModals} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow">
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full transition-colors duration-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Delete Employee</h2>
                        <p className="mb-6 text-gray-600 dark:text-gray-300">Are you sure you want to delete <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedEmployee?.user?.name}</span>?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={closeModals} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                            <button onClick={handleDeleteSubmit} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">
                                {isSubmitting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full text-center transition-colors duration-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Temporary Password</h2>
                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-4 rounded mb-4">
                            <p className="text-2xl font-mono font-bold text-blue-700 dark:text-blue-400">{createdPassword}</p>
                        </div>
                        <p className="text-red-500 dark:text-red-400 text-sm mb-4">Please copy this password. It will not be shown again.</p>
                        <button onClick={() => { setIsPasswordModalOpen(false); setCreatedPassword(null); }} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">Close</button>
                    </div>
                </div>
            )}

            {/* Face Enrollment Modal */}
            {showFaceEnrollment && pendingEmployeeData && (
                <FaceEnrollment
                    email={pendingEmployeeData.email}
                    onFaceEnrolled={handleFaceEnrolled}
                    onClose={() => {
                        setShowFaceEnrollment(false);
                        setPendingEmployeeData(null);
                    }}
                />
            )}
        </div>
    );
};

export default HREmployeesPage;
