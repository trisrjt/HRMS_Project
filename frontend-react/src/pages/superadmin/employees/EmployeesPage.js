import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext"; // Add AuthContext
import FaceEnrollment from "../../../components/FaceEnrollment";

import { formatDate } from "../../../utils/dateUtils";

const EmployeesPage = () => {
    const { user } = useAuth();
    // Unified API Endpoint
    const apiEndpoint = "/employees";

    // User Roles & Permissions
    const isSuperAdmin = user?.role_id === 1;
    const canManage = isSuperAdmin || user?.role_id === 2 || user?.role_id === 3 || user?.permissions?.includes("can_manage_employees");
    const canDelete = isSuperAdmin || (user?.role_id === 2 && user?.permissions?.includes("can_delete_employees")) || user?.permissions?.includes("can_delete_employees");
    const canManageSalary = isSuperAdmin || user?.role_id === 2 || user?.permissions?.includes("can_manage_salaries");
    const canViewSalary = isSuperAdmin || user?.role_id === 2 || user?.role_id === 3 || user?.permissions?.includes("can_view_salaries") || canManageSalary;

    // Data States
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
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
        reports_to: "",
        joining_category: "New Joinee",
        pf_opt_out: false,
        esic_opt_out: false,
        ptax_opt_out: false,
        aadhar_file: null,
        pan_file: null
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [payrollConfig, setPayrollConfig] = useState({ basic_percentage: 50 }); // Default 50%

    // Initial Data Fetch
    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
        fetchDesignations();
        if (canViewSalary || canManageSalary) {
            fetchPayrollPolicy();
        }
    }, []);

    const fetchPayrollPolicy = async () => {
        try {
            const res = await api.get('/payroll-policy');
            if (res.data) {
                const config = { ...res.data };

                // Helper for robust boolean parsing
                const isTrue = (val) => String(val) === '1' || String(val).toLowerCase() === 'true';

                // Parse strings to appropriate types
                config.basic_percentage = parseFloat(config.basic_percentage) || 0;
                config.pf_enabled = isTrue(config.pf_enabled);
                config.esic_enabled = isTrue(config.esic_enabled);
                config.ptax_enabled = isTrue(config.ptax_enabled);

                if (typeof config.ptax_slabs === 'string') {
                    try {
                        config.ptax_slabs = JSON.parse(config.ptax_slabs);
                    } catch (e) {
                        config.ptax_slabs = [];
                        console.error("Failed to parse ptax_slabs", e);
                    }
                }

                // Ensure array
                if (!Array.isArray(config.ptax_slabs)) {
                    config.ptax_slabs = [];
                }
                setPayrollConfig(config);
            }
        } catch (err) {
            console.error("Failed to fetch payroll policy", err);
        }
    };

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await api.get(apiEndpoint);
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
            password: "",
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
            reports_to: "",
            joining_category: "New Joinee",
            pf_opt_out: false,
            esic_opt_out: false,
            ptax_opt_out: false,
            aadhar_file: null,
            pan_file: null
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
            profile_photo: null, // Don't pre-fill file input
            basic: emp.current_salary?.basic || "",
            hra: emp.current_salary?.hra || "",
            da: emp.current_salary?.da || "",
            allowances: emp.current_salary?.allowances || "",
            deductions: emp.current_salary?.deductions || "",
            gross_salary: emp.current_salary?.gross_salary || "",
            phone: emp.phone || "",
            address: emp.address || "",
            status: emp.user?.is_active ? "Active" : "Inactive",
            reports_to: emp.reports_to || "",
            joining_category: emp.joining_category || "New Joinee",
            pf_opt_out: Boolean(emp.pf_opt_out),
            esic_opt_out: Boolean(emp.esic_opt_out),
            ptax_opt_out: Boolean(emp.ptax_opt_out)
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

    // Salary Calculation Logic
    const handleBasicChange = (e) => {
        const basic = parseFloat(e.target.value) || 0;
        const hra = basic * 0.40; // 40% of Basic
        const da = basic * 0.10;  // 10% of Basic
        const allowances = basic * 0.05; // 5% of Basic
        const deductions = basic * 0.02; // 2% of Basic
        const gross = basic + hra + da + allowances - deductions;

        setFormData(prev => ({
            ...prev,
            basic: e.target.value,
            hra: hra.toFixed(2),
            da: da.toFixed(2),
            allowances: allowances.toFixed(2),
            deductions: deductions.toFixed(2),
            gross_salary: gross.toFixed(2)
        }));
    };

    const recalculateSalary = () => {
        const basic = parseFloat(formData.basic) || 0;
        const hra = basic * 0.40;
        const da = basic * 0.10;
        const allowances = basic * 0.05;
        const deductions = basic * 0.02;
        const gross = basic + hra + da + allowances - deductions;

        setFormData(prev => ({
            ...prev,
            hra: hra.toFixed(2),
            da: da.toFixed(2),
            allowances: allowances.toFixed(2),
            deductions: deductions.toFixed(2),
            gross_salary: gross.toFixed(2)
        }));
    };

    const handleSalaryComponentChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            const basic = parseFloat(updated.basic) || 0;
            const hra = parseFloat(updated.hra) || 0;
            const da = parseFloat(updated.da) || 0;
            const allowances = parseFloat(updated.allowances) || 0;
            const deductions = parseFloat(updated.deductions) || 0;
            const gross = basic + hra + da + allowances - deductions;
            return { ...updated, gross_salary: gross.toFixed(2) };
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        });
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setFormData({ ...formData, [name]: files[0] });
        }
    };

    // Password Modal State
    const [createdPassword, setCreatedPassword] = useState(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    // Face Enrollment States
    const [showFaceEnrollment, setShowFaceEnrollment] = useState(false);
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [faceImage, setFaceImage] = useState(null);
    const [pendingEmployeeData, setPendingEmployeeData] = useState(null);

    // Form Submission
    const validateForm = () => {
        const errors = {};
        if (!formData.name) errors.name = "Name is required";
        if (!formData.email) errors.email = "Email is required";
        if (!formData.password && isAddModalOpen) errors.password = "Password is required"; // Only for add
        // Department is optional in some logic, but usually required
        // if (!formData.department_id) errors.department_id = "Department is required";

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Invalid email format";
        }

        if (formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.pan_number)) {
            errors.pan_number = "Invalid PAN format";
        }

        if (formData.aadhar_number && !/^\d{12}$/.test(formData.aadhar_number)) {
            errors.aadhar_number = "Aadhar must be 12 digits";
        }

        if (!formData.phone) {
            // errors.phone = "Phone is required"; 
        } else if (!/^\d{10}$/.test(formData.phone)) {
            errors.phone = "Phone number must be exactly 10 digits";
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
                if (pendingEmployeeData[key] !== null && pendingEmployeeData[key] !== undefined) {
                    if (key === 'pf_opt_out' || key === 'esic_opt_out' || key === 'ptax_opt_out') {
                        data.append(key, pendingEmployeeData[key] ? '1' : '0');
                    } else {
                        data.append(key, pendingEmployeeData[key]);
                    }
                }
            });
            // Append password as temp_password for backend
            if (pendingEmployeeData.password) {
                data.append('temp_password', pendingEmployeeData.password);
            }

            // Add face data
            data.append('face_descriptor', JSON.stringify(descriptor));
            data.append('face_image', imageBlob, 'face.jpg');

            const response = await api.post(apiEndpoint, data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            fetchEmployees();
            closeModals();
            setPendingEmployeeData(null);

            // Show password modal if plain_password is returned
            if (response.data.plain_password) {
                setCreatedPassword(response.data.plain_password);
                setIsPasswordModalOpen(true);
            }
        } catch (err) {
            console.error("Failed to create employee", err);
            if (err.response && err.response.status === 422 && err.response.data.errors) {
                // Map backend validation errors to form errors
                const apiErrors = {};
                Object.keys(err.response.data.errors).forEach(key => {
                    apiErrors[key] = err.response.data.errors[key][0];
                });
                setFormErrors(apiErrors);
            } else {
                setFormErrors({ api: err.response?.data?.message || "Failed to create employee" });
            }
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
                // Ensure booleans are sent as 1/0
                if (key === 'pf_opt_out' || key === 'esic_opt_out' || key === 'ptax_opt_out') {
                    data.append(key, formData[key] ? '1' : '0');
                } else if (formData[key] !== null && formData[key] !== undefined) {
                    // Skip profile_photo if it's not a File (e.g., existing URL string)
                    if (key === 'profile_photo' && !(formData[key] instanceof File)) {
                        return;
                    }
                    data.append(key, formData[key]);
                }
            });
            // Laravel requires POST with _method=PUT for multipart/form-data updates
            data.append("_method", "PUT");

            await api.post(`${apiEndpoint}/${selectedEmployee.id}`, data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            await fetchEmployees();
            closeModals();
        } catch (err) {
            console.error("Failed to update employee", err);
            if (err.response && err.response.status === 422 && err.response.data.errors) {
                const apiErrors = {};
                Object.keys(err.response.data.errors).forEach(key => {
                    apiErrors[key] = err.response.data.errors[key][0];
                });
                setFormErrors(apiErrors);
            } else {
                const errorMessage = err.response?.data?.message || err.message || "Failed to update employee";
                setFormErrors({ api: errorMessage });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        setIsSubmitting(true);
        try {
            await api.delete(`${apiEndpoint}/${selectedEmployee.id}`);
            fetchEmployees();
            closeModals();
        } catch (err) {
            console.error("Failed to delete employee", err);
            const errorMessage = err.response?.data?.message || "Failed to delete employee. Please try again.";
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <>
            <div className="p-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Employees</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your organization's workforce</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={openAddModal} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">+ Add Employee</button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-wrap gap-4 items-center transition-colors duration-200">
                    <label htmlFor="search_employees" className="sr-only">Search Employees</label>
                    <input
                        id="search_employees"
                        name="search"
                        autoComplete="off"
                        type="text"
                        placeholder="Search employees..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full max-w-[300px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                    <label htmlFor="filter_department" className="sr-only">Filter by Department</label>
                    <select
                        id="filter_department"
                        name="department_filter"
                        autoComplete="off"
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full max-w-[200px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <label htmlFor="filter_status" className="sr-only">Filter by Status</label>
                    <select
                        id="filter_status"
                        name="status_filter"
                        autoComplete="off"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full max-w-[150px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                {loading ? (
                    <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading employees...</div>
                ) : error ? (
                    <div className="text-center p-8 text-red-500 dark:text-red-400">{error}</div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th onClick={() => handleSort("name")} className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                                        Employee {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th onClick={() => handleSort("department")} className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                                        Department {sortConfig.key === "department" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                                    <th onClick={() => handleSort("date_of_joining")} className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                                        Joined {sortConfig.key === "date_of_joining" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No employees found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedEmployees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${emp.user?.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                                                    {emp.user?.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-3">
                                                    <button onClick={() => openViewModal(emp)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300">View</button>
                                                    <button onClick={() => openEditModal(emp)} className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300">Edit</button>
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => openDeleteModal(emp)}
                                                            className="px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 rounded transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredEmployees.length)}</span> of <span className="font-medium">{filteredEmployees.length}</span> results
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm font-medium ${currentPage === 1 ? "text-gray-400 dark:text-gray-500 cursor-not-allowed" : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm font-medium ${currentPage === totalPages ? "text-gray-400 dark:text-gray-500 cursor-not-allowed" : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ADD MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl shadow-xl relative mx-auto transition-colors duration-200 flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add New Employee</h2>
                            <button onClick={closeModals} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {formErrors.api && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">{formErrors.api}</div>}

                            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
                                    <input id="add_name" name="name" type="text" autoComplete="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" />
                                    {formErrors.name && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.name}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email *</label>
                                    <input id="add_email" name="email" type="email" autoComplete="off" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" />
                                    {formErrors.email && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.email}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password *</label>
                                    <input
                                        id="add_password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={formData.password || ""}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                                    />
                                    {formErrors.password && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.password}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_department" className="text-sm font-medium text-gray-700 dark:text-gray-300">Department *</label>
                                    <select id="add_department" name="department_id" autoComplete="off" value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm">
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    {formErrors.department_id && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.department_id}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_joining_category" className="text-sm font-medium text-gray-700 dark:text-gray-300">Joining Category *</label>
                                    <select id="add_joining_category" name="joining_category" value={formData.joining_category} onChange={(e) => setFormData({ ...formData, joining_category: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm">
                                        <option value="New Joinee">New Joinee</option>
                                        <option value="Intern">Intern</option>
                                        <option value="Permanent">Permanent</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_designation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Designation *</label>
                                    <input
                                        id="add_designation"
                                        name="designation_name"
                                        list="designation_options"
                                        autoComplete="off"
                                        placeholder="Select or Type Designation"
                                        value={formData.designation_name}
                                        onChange={(e) => setFormData({ ...formData, designation_name: e.target.value })}
                                        className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                                    />
                                    <datalist id="designation_options">
                                        {designations.map(d => (
                                            <option key={d.id} value={d.name} />
                                        ))}
                                    </datalist>
                                    {formErrors.designation_name && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.designation_name}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_reports_to" className="text-sm font-medium text-gray-700 dark:text-gray-300">Reports To (Manager)</label>
                                    <select id="add_reports_to" name="reports_to" autoComplete="off" value={formData.reports_to} onChange={(e) => setFormData({ ...formData, reports_to: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm">
                                        <option value="">No Manager (Top Hierarchy)</option>
                                        {employees.map(e => (
                                            <option key={e.id} value={e.id}>{e.user?.name} ({e.designation?.name || 'N/A'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_date_of_joining" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Joining *</label>
                                    <input id="add_date_of_joining" name="date_of_joining" type="date" autoComplete="off" value={formData.date_of_joining} onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" />
                                    {formErrors.date_of_joining && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.date_of_joining}</p>}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_aadhar_file" className="text-sm font-medium text-gray-700 dark:text-gray-300">Aadhar File</label>
                                    <input id="add_aadhar_file" name="aadhar_file" type="file" onChange={handleFileChange} className="border border-gray-300 dark:border-gray-600 rounded p-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm w-full" accept=".pdf,.jpg,.jpeg,.png" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_pan_file" className="text-sm font-medium text-gray-700 dark:text-gray-300">PAN File</label>
                                    <input id="add_pan_file" name="pan_file" type="file" onChange={handleFileChange} className="border border-gray-300 dark:border-gray-600 rounded p-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm w-full" accept=".pdf,.jpg,.jpeg,.png" />
                                </div>

                                <div className="col-span-1 md:col-span-2 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-2 bg-gray-50 dark:bg-gray-800/50">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payroll Configuration</h3>

                                    <div className="flex flex-col gap-1 mb-4">
                                        <label htmlFor="add_gross_salary" className="text-sm font-medium text-gray-700 dark:text-gray-300">Gross Salary (Monthly) *</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                            <input
                                                id="add_gross_salary"
                                                name="gross_salary"
                                                type="number"
                                                autoComplete="off"
                                                value={formData.gross_salary}
                                                onChange={(e) => setFormData({ ...formData, gross_salary: e.target.value })}
                                                className="h-9 pl-7 pr-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm font-medium"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Basic, HRA, and other components will be auto-calculated based on Payroll Policy.</p>

                                        {/* Salary Preview Component */}
                                        {(() => {
                                            const gross = parseFloat(formData.gross_salary) || 0;
                                            const basicPercent = payrollConfig.basic_percentage || 70;
                                            const basic = Math.round((gross * basicPercent) / 100);
                                            const hra = gross - basic;

                                            // Deductions
                                            let pf = 0;
                                            let pfText = "0.00";
                                            if (!payrollConfig.pf_enabled) {
                                                pfText = "Disabled";
                                            } else if (formData.pf_opt_out) {
                                                pfText = "Opted Out";
                                            } else {
                                                pf = Math.round(basic * 0.12);
                                                pfText = `-₹${pf.toFixed(2)}`;
                                            }

                                            let esic = 0;
                                            let esicText = "0.00";
                                            if (!payrollConfig.esic_enabled) {
                                                esicText = "Disabled";
                                            } else if (formData.esic_opt_out) {
                                                esicText = "Opted Out";
                                            } else {
                                                esic = Math.ceil(gross * 0.0075);
                                                esicText = `-₹${esic.toFixed(2)}`;
                                            }

                                            let ptax = 0;
                                            let ptaxText = "0.00";
                                            if (!payrollConfig.ptax_enabled) {
                                                ptaxText = "Disabled";
                                            } else if (formData.ptax_opt_out) {
                                                ptaxText = "Opted Out";
                                            } else {
                                                if (Array.isArray(payrollConfig.ptax_slabs)) {
                                                    const slab = payrollConfig.ptax_slabs.find(s => {
                                                        const min = parseFloat(s.min_salary || 0);
                                                        const max = s.max_salary === null || s.max_salary === "" ? Infinity : parseFloat(s.max_salary);
                                                        return gross >= min && gross <= max;
                                                    });
                                                    if (slab) {
                                                        ptax = parseFloat(slab.tax_amount || 0);
                                                        ptaxText = `-₹${ptax.toFixed(2)}`;
                                                    }
                                                }
                                            }

                                            const totalDeductions = pf + esic + ptax;
                                            const netPay = gross - totalDeductions;

                                            return (
                                                <div className="mt-3 bg-white dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600 space-y-2">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Basic Salary ({basicPercent}%)</p>
                                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">₹{basic.toFixed(2)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">HRA ({100 - basicPercent}%)</p>
                                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">₹{hra.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2 grid grid-cols-3 gap-2">
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">PF (12%)</p>
                                                            <p className={`text-sm font-medium ${pf > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                                                                {pfText}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">ESIC (0.75%)</p>
                                                            <p className={`text-sm font-medium ${esic > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                                                                {esicText}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">PTAX</p>
                                                            <p className={`text-sm font-medium ${ptax > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                                                                {ptaxText}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between items-center">
                                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Estimated Net Pay</p>
                                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{netPay.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}


                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <label htmlFor="add_pf_opt_out" className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
                                            <input
                                                id="add_pf_opt_out"
                                                name="pf_opt_out"
                                                type="checkbox"
                                                checked={formData.pf_opt_out}
                                                onChange={(e) => setFormData({ ...formData, pf_opt_out: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 select-none">Opt-out PF</span>
                                        </label>

                                        <label htmlFor="add_esic_opt_out" className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
                                            <input
                                                id="add_esic_opt_out"
                                                name="esic_opt_out"
                                                type="checkbox"
                                                checked={formData.esic_opt_out}
                                                onChange={(e) => setFormData({ ...formData, esic_opt_out: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 select-none">Opt-out ESIC</span>
                                        </label>

                                        <label htmlFor="add_ptax_opt_out" className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
                                            <input
                                                id="add_ptax_opt_out"
                                                name="ptax_opt_out"
                                                type="checkbox"
                                                checked={formData.ptax_opt_out}
                                                onChange={(e) => setFormData({ ...formData, ptax_opt_out: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 select-none">Opt-out PTAX</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_dob" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth *</label>
                                    <input id="add_dob" name="dob" type="date" autoComplete="off" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" />
                                    {formErrors.dob && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.dob}</p>}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_aadhar" className="text-sm font-medium text-gray-700 dark:text-gray-300">Aadhar Number</label>
                                    <input id="add_aadhar" name="aadhar_number" type="text" autoComplete="off" value={formData.aadhar_number} onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" maxLength={12} />
                                    {formErrors.aadhar_number && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.aadhar_number}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_pan" className="text-sm font-medium text-gray-700 dark:text-gray-300">PAN Number</label>
                                    <input id="add_pan" name="pan_number" type="text" autoComplete="off" value={formData.pan_number} onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" maxLength={10} />
                                    {formErrors.pan_number && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.pan_number}</p>}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone *</label>
                                    <input id="add_phone" name="phone" type="text" autoComplete="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" maxLength={10} />
                                    {formErrors.phone && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.phone}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_emergency" className="text-sm font-medium text-gray-700 dark:text-gray-300">Emergency Contact</label>
                                    <input id="add_emergency" name="emergency_contact" type="text" autoComplete="tel" value={formData.emergency_contact} onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" maxLength={10} />
                                    {formErrors.emergency_contact && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.emergency_contact}</p>}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_gender" className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                                    <select id="add_gender" name="gender" autoComplete="off" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm">
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_marital" className="text-sm font-medium text-gray-700 dark:text-gray-300">Marital Status</label>
                                    <select id="add_marital" name="marital_status" autoComplete="off" value={formData.marital_status} onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm">
                                        <option value="">Select Status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                    <label htmlFor="add_address" className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                                    <textarea id="add_address" name="address" autoComplete="street-address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" rows="2"></textarea>
                                </div>

                                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                    <label htmlFor="add_profile_photo" className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</label>
                                    <input id="add_profile_photo" name="profile_photo" type="file" onChange={(e) => setFormData({ ...formData, profile_photo: e.target.files[0] })} className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" accept="image/*" />
                                </div>
                                <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button type="button" onClick={closeModals} className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                                    <button type="submit" disabled={isSubmitting} className={`px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        {isSubmitting ? "Creating..." : "Create Employee"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl shadow-xl relative mx-auto transition-colors duration-200 flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Employee</h2>
                            <button onClick={closeModals} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {formErrors.api && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">{formErrors.api}</div>}

                            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="edit_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
                                    <input id="edit_name" name="name" type="text" autoComplete="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" />
                                    {formErrors.name && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.name}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="edit_email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email *</label>
                                    <input id="edit_email" name="email" type="email" autoComplete="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" />
                                    {formErrors.email && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.email}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="edit_department" className="text-sm font-medium text-gray-700 dark:text-gray-300">Department *</label>
                                    <select id="edit_department" name="department_id" autoComplete="off" value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm">
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    {formErrors.department_id && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.department_id}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="edit_joining_category" className="text-sm font-medium text-gray-700 dark:text-gray-300">Joining Category *</label>
                                    <select id="edit_joining_category" name="joining_category" value={formData.joining_category} onChange={(e) => setFormData({ ...formData, joining_category: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm">
                                        <option value="New Joinee">New Joinee</option>
                                        <option value="Intern">Intern</option>
                                        <option value="Permanent">Permanent</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="edit_designation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Designation *</label>
                                    <input
                                        id="edit_designation"
                                        name="designation_name"
                                        list="designation_options_edit"
                                        autoComplete="off"
                                        placeholder="Select or Type Designation"
                                        value={formData.designation_name}
                                        onChange={(e) => setFormData({ ...formData, designation_name: e.target.value })}
                                        className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                                    />
                                    <datalist id="designation_options_edit">
                                        {designations.map(d => (
                                            <option key={d.id} value={d.name} />
                                        ))}
                                    </datalist>
                                    {formErrors.designation_name && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.designation_name}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="edit_reports_to" className="text-sm font-medium text-gray-700 dark:text-gray-300">Reports To (Manager)</label>
                                    <select id="edit_reports_to" name="reports_to" autoComplete="off" value={formData.reports_to} onChange={(e) => setFormData({ ...formData, reports_to: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm">
                                        <option value="">No Manager (Top Hierarchy)</option>
                                        {employees.filter(e => {
                                            if (e.id === selectedEmployee?.id) return false;
                                            return true; // Show all employees
                                        }).map(e => (
                                            <option key={e.id} value={e.id}>{e.user?.name} ({e.designation?.name || 'N/A'})</option>
                                        ))}
                                    </select>
                                    {formErrors.reports_to && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.reports_to}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="edit_date_of_joining" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Joining *</label>
                                    <input id="edit_date_of_joining" name="date_of_joining" type="date" autoComplete="off" value={formData.date_of_joining} onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" />
                                    {formErrors.date_of_joining && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.date_of_joining}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="edit_dob" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth *</label>
                                    <input id="edit_dob" name="dob" type="date" autoComplete="off" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" />
                                    {formErrors.dob && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.dob}</p>}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="edit_aadhar" className="text-sm font-medium text-gray-700 dark:text-gray-300">Aadhar Number</label>
                                    <input id="edit_aadhar" name="aadhar_number" type="text" autoComplete="off" value={formData.aadhar_number} onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" maxLength={12} />
                                    {formErrors.aadhar_number && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.aadhar_number}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="edit_pan" className="text-sm font-medium text-gray-700 dark:text-gray-300">PAN Number</label>
                                    <input id="edit_pan" name="pan_number" type="text" autoComplete="off" value={formData.pan_number} onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" maxLength={10} />
                                    {formErrors.pan_number && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.pan_number}</p>}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="edit_phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone *</label>
                                    <input id="edit_phone" name="phone" type="text" autoComplete="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" maxLength={10} />
                                    {formErrors.phone && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.phone}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="edit_emergency" className="text-sm font-medium text-gray-700 dark:text-gray-300">Emergency Contact</label>
                                    <input id="edit_emergency" name="emergency_contact" type="text" autoComplete="tel" value={formData.emergency_contact} onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" maxLength={10} />
                                    {formErrors.emergency_contact && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.emergency_contact}</p>}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="edit_gender" className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                                    <select id="edit_gender" name="gender" autoComplete="off" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm">
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {formErrors.gender && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.gender}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="edit_marital" className="text-sm font-medium text-gray-700 dark:text-gray-300">Marital Status</label>
                                    <select id="edit_marital" name="marital_status" autoComplete="off" value={formData.marital_status} onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })} className="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm">
                                        <option value="">Select Status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {formErrors.marital_status && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.marital_status}</p>}
                                </div>

                                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                    <label htmlFor="edit_address" className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                                    <textarea id="edit_address" name="address" autoComplete="street-address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm" rows="2"></textarea>
                                    {formErrors.address && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.address}</p>}
                                </div>

                                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                    <label htmlFor="edit_profile_photo" className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</label>
                                    <input id="edit_profile_photo" name="profile_photo" type="file" onChange={(e) => setFormData({ ...formData, profile_photo: e.target.files[0] })} className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" accept="image/*" />
                                    {formErrors.profile_photo && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.profile_photo}</p>}
                                </div>

                                {canManageSalary && (
                                    <div className="col-span-1 md:col-span-2 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-2 bg-gray-50 dark:bg-gray-800/50">
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payroll Configuration</h3>

                                        <div className="flex flex-col gap-1 mb-4">
                                            <label htmlFor="edit_gross_salary" className="text-sm font-medium text-gray-700 dark:text-gray-300">Gross Salary (Monthly) *</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                                <input
                                                    id="edit_gross_salary"
                                                    name="gross_salary"
                                                    type="number"
                                                    autoComplete="off"
                                                    value={formData.gross_salary}
                                                    onChange={(e) => setFormData({ ...formData, gross_salary: e.target.value })}
                                                    className="h-9 pl-7 pr-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm font-medium"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {formErrors.gross_salary && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{formErrors.gross_salary}</p>}
                                            <p className="text-xs text-gray-500 mt-1">Basic, HRA, and other components will be auto-calculated based on Payroll Policy.</p>

                                            {/* Salary Preview Component */}
                                            {(() => {
                                                const gross = parseFloat(formData.gross_salary) || 0;
                                                const basicPercent = payrollConfig.basic_percentage || 70;
                                                const basic = Math.round((gross * basicPercent) / 100);
                                                const hra = gross - basic;

                                                // Deductions
                                                let pf = 0;
                                                let pfText = "0.00";
                                                if (!payrollConfig.pf_enabled) {
                                                    pfText = "Disabled";
                                                } else if (formData.pf_opt_out) {
                                                    pfText = "Opted Out";
                                                } else {
                                                    pf = Math.round(basic * 0.12);
                                                    pfText = `-₹${pf.toFixed(2)}`;
                                                }

                                                let esic = 0;
                                                let esicText = "0.00";
                                                if (!payrollConfig.esic_enabled) {
                                                    esicText = "Disabled";
                                                } else if (formData.esic_opt_out) {
                                                    esicText = "Opted Out";
                                                } else {
                                                    esic = Math.ceil(gross * 0.0075);
                                                    esicText = `-₹${esic.toFixed(2)}`;
                                                }

                                                let ptax = 0;
                                                let ptaxText = "0.00";
                                                if (!payrollConfig.ptax_enabled) {
                                                    ptaxText = "Disabled";
                                                } else if (formData.ptax_opt_out) {
                                                    ptaxText = "Opted Out";
                                                } else {
                                                    if (Array.isArray(payrollConfig.ptax_slabs)) {
                                                        const slab = payrollConfig.ptax_slabs.find(s => {
                                                            const min = parseFloat(s.min_salary || 0);
                                                            const max = s.max_salary === null || s.max_salary === "" ? Infinity : parseFloat(s.max_salary);
                                                            return gross >= min && gross <= max;
                                                        });
                                                        if (slab) {
                                                            ptax = parseFloat(slab.tax_amount || 0);
                                                            ptaxText = `-₹${ptax.toFixed(2)}`;
                                                        }
                                                    }
                                                }

                                                const totalDeductions = pf + esic + ptax;
                                                const netPay = gross - totalDeductions;

                                                return (
                                                    <div className="mt-3 bg-white dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600 space-y-2">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">Basic Salary ({basicPercent}%)</p>
                                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">₹{basic.toFixed(2)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">HRA ({100 - basicPercent}%)</p>
                                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">₹{hra.toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 grid grid-cols-3 gap-2">
                                                            <div>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">PF (12%)</p>
                                                                <p className={`text-sm font-medium ${pf > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                                                                    {pfText}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">ESIC (0.75%)</p>
                                                                <p className={`text-sm font-medium ${esic > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                                                                    {esicText}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">PTAX</p>
                                                                <p className={`text-sm font-medium ${ptax > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                                                                    {ptaxText}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between items-center">
                                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Estimated Net Pay</p>
                                                            <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{netPay.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })()}


                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <label htmlFor="edit_pf_opt_out" className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
                                                <input
                                                    id="edit_pf_opt_out"
                                                    name="pf_opt_out"
                                                    type="checkbox"
                                                    checked={formData.pf_opt_out}
                                                    onChange={(e) => setFormData({ ...formData, pf_opt_out: e.target.checked })}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300 select-none">Opt-out PF</span>
                                            </label>

                                            <label htmlFor="edit_esic_opt_out" className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
                                                <input
                                                    id="edit_esic_opt_out"
                                                    name="esic_opt_out"
                                                    type="checkbox"
                                                    checked={formData.esic_opt_out}
                                                    onChange={(e) => setFormData({ ...formData, esic_opt_out: e.target.checked })}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300 select-none">Opt-out ESIC</span>
                                            </label>

                                            <label htmlFor="edit_ptax_opt_out" className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
                                                <input
                                                    id="edit_ptax_opt_out"
                                                    name="ptax_opt_out"
                                                    type="checkbox"
                                                    checked={formData.ptax_opt_out}
                                                    onChange={(e) => setFormData({ ...formData, ptax_opt_out: e.target.checked })}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300 select-none">Opt-out PTAX</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="edit_status" className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                    <select id="edit_status" name="status" autoComplete="off" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors">
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                    {formErrors.status && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.status}</p>}
                                </div>

                                <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button type="button" onClick={closeModals} className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                                    <button type="submit" disabled={isSubmitting} className={`px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        {isSubmitting ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-start z-50 overflow-y-auto p-4 pt-20">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg w-full max-w-md shadow-xl relative mx-auto transition-colors duration-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Delete Employee</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to delete <strong>{selectedEmployee?.user?.name}</strong>?
                            This action cannot be undone and will remove their user account as well.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={closeModals} className="px-4 py-2 rounded-lg font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                            <button onClick={handleDeleteSubmit} disabled={isSubmitting} className={`px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isSubmitting ? "Deleting..." : "Delete Employee"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW MODAL */}
            {isViewModalOpen && selectedEmployee && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-start z-50 overflow-y-auto p-4 pt-20">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg w-full max-w-3xl shadow-xl relative mx-auto transition-colors duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden border-2 border-white shadow-sm">
                                    {selectedEmployee.profile_photo ? (
                                        <img
                                            src={`http://localhost:8000/storage/${selectedEmployee.profile_photo}`}
                                            alt={selectedEmployee.user?.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            {selectedEmployee.user?.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{selectedEmployee.user?.name}</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{selectedEmployee.designation?.name || selectedEmployee.designation || "N/A"}</p>
                                </div>
                            </div>
                            <button onClick={closeModals} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl">✕</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">Personal Details</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Email</label>
                                        <p className="text-gray-900 dark:text-white">{selectedEmployee.user?.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Phone</label>
                                        <p className="text-gray-900 dark:text-white">{selectedEmployee.phone || "N/A"}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Emergency Contact</label>
                                        <p className="text-gray-900 dark:text-white">{selectedEmployee.emergency_contact || "N/A"}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Date of Birth</label>
                                        <p className="text-gray-900 dark:text-white">{formatDate(selectedEmployee.dob)}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Gender</label>
                                        <p className="text-gray-900 dark:text-white">{selectedEmployee.gender || "N/A"}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Marital Status</label>
                                        <p className="text-gray-900 dark:text-white">{selectedEmployee.marital_status || "N/A"}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Address</label>
                                        <p className="text-gray-900 dark:text-white">{selectedEmployee.address || "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">Employment Details</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Code</label>
                                        <p className="text-gray-900 dark:text-white font-medium">{selectedEmployee.employee_code}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Department</label>
                                        <p className="text-gray-900 dark:text-white">{selectedEmployee.department?.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Joining Category</label>
                                        <p className="text-gray-900 dark:text-white">{selectedEmployee.joining_category || "N/A"}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Joined</label>
                                        <p className="text-gray-900 dark:text-white">{formatDate(selectedEmployee.date_of_joining)}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Aadhar Number</label>
                                        <p className="text-gray-900 dark:text-white font-mono">
                                            {selectedEmployee.aadhar_number ? selectedEmployee.aadhar_number.replace(/\d{8}(\d{4})/, "XXXX-XXXX-$1") : "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">PAN Number</label>
                                        <p className="text-gray-900 dark:text-white font-mono">{selectedEmployee.pan_number || "N/A"}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Status</label>
                                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${selectedEmployee.user?.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                                            {selectedEmployee.user?.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    {canManage && (
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Overtime Permission</label>
                                            <div className="mt-2 flex items-center gap-2">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await api.post(`/employees/${selectedEmployee.id}/toggle-overtime`, {
                                                                overtime_enabled: !selectedEmployee.overtime_enabled
                                                            });
                                                            const updatedEmps = employees.map(emp => 
                                                                emp.id === selectedEmployee.id 
                                                                    ? { ...emp, overtime_enabled: !selectedEmployee.overtime_enabled }
                                                                    : emp
                                                            );
                                                            setEmployees(updatedEmps);
                                                            setSelectedEmployee({ ...selectedEmployee, overtime_enabled: !selectedEmployee.overtime_enabled });
                                                        } catch (error) {
                                                            alert(error?.response?.data?.message || 'Failed to toggle overtime permission');
                                                        }
                                                    }}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 ${
                                                        selectedEmployee.overtime_enabled
                                                            ? 'bg-blue-400 border-blue-500 focus:ring-blue-400'
                                                            : 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500 focus:ring-gray-400'
                                                    }`}
                                                >
                                                    <span 
                                                        className={`inline-block h-5 w-5 transform rounded-full shadow-lg transition-all duration-300 ease-in-out bg-white ${
                                                            selectedEmployee.overtime_enabled 
                                                                ? 'translate-x-5 scale-110' 
                                                                : 'translate-x-0.5'
                                                        }`} 
                                                    />
                                                </button>
                                                <span className={`text-xs font-medium transition-colors duration-300 ${
                                                    selectedEmployee.overtime_enabled ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                                                }`}>
                                                    {selectedEmployee.overtime_enabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Code</label>
                                <p className="text-gray-900 dark:text-white font-medium">{selectedEmployee.employee_code}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Email</label>
                                <p className="text-gray-900 dark:text-white">{selectedEmployee.user?.email}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Department</label>
                                <p className="text-gray-900 dark:text-white">{selectedEmployee.department?.name}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Designation</label>
                                <p className="text-gray-900 dark:text-white">{selectedEmployee.designation?.name || selectedEmployee.designation || "N/A"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Joined</label>
                                <p className="text-gray-900 dark:text-white">{formatDate(selectedEmployee.date_of_joining)}</p>
                            </div>
                            <div className="col-span-1 md:col-span-2 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                                {canViewSalary && (
                                    <>
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">Salary Structure</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Basic</label>
                                                <p className="text-gray-900 dark:text-white font-medium">₹{selectedEmployee.current_salary?.basic || "0"}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">HRA</label>
                                                <p className="text-gray-900 dark:text-white font-medium">₹{selectedEmployee.current_salary?.hra || "0"}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">PF</label>
                                                <p className="text-red-600 dark:text-red-400 font-medium">-₹{selectedEmployee.current_salary?.pf || "0"}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">ESIC</label>
                                                <p className="text-red-600 dark:text-red-400 font-medium">-₹{selectedEmployee.current_salary?.esic || "0"}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">PTAX</label>
                                                <p className="text-red-600 dark:text-red-400 font-medium">-₹{selectedEmployee.current_salary?.ptax || "0"}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Gross Salary</label>
                                                <p className="text-green-600 dark:text-green-400 font-bold text-lg">₹{selectedEmployee.current_salary?.gross_salary || "0"}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                                {!canViewSalary && (
                                    <p className="text-sm text-gray-500 italic">Salary details are hidden.</p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Status</label>
                                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${selectedEmployee.user?.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                                    {selectedEmployee.user?.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Address</label>
                                <p className="text-gray-900 dark:text-white">{selectedEmployee.address || "N/A"}</p>
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Phone</label>
                                <p className="text-gray-900 dark:text-white">{selectedEmployee.phone || "N/A"}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={closeModals} className="px-4 py-2 rounded-lg font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Close</button>
                        </div>
                    </div >
                </div >
            )
            }

            {/* PASSWORD MODAL */}
            {
                isPasswordModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[2000]">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-[90%] max-w-sm text-center relative transition-colors duration-200">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                                Temporary Password
                            </h2>

                            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-500 p-6 rounded-xl mb-6">
                                <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-400 font-mono tracking-wider m-0">
                                    {createdPassword}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Copy this password now
                                </p>
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg text-sm text-left mb-6">
                                <strong>Warning:</strong> Please share this password with the employee immediately. It will not be shown again after you close this window.
                            </div>

                            <button
                                onClick={() => { setIsPasswordModalOpen(false); setCreatedPassword(null); }}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }

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

            {/* End of Modals */}
        </>
    );
};


export default EmployeesPage;
