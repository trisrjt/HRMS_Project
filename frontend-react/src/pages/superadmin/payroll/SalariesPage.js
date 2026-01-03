import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import { formatDate } from "../../../utils/dateUtils";
import { useAuth } from "../../../context/AuthContext";

const SalariesPage = () => {
    const { user } = useAuth();
    const canManageSalary = user?.role_id === 1 || user?.role_id === 2 || user?.role_id === 3 || user?.permissions?.includes("can_manage_salaries");

    // State
    const [salaries, setSalaries] = useState({ data: [], current_page: 1, last_page: 1, total: 0 });
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [payrollConfig, setPayrollConfig] = useState({});

    // Filters
    const [search, setSearch] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [month, setMonth] = useState(currentMonth);
    const [currentPage, setCurrentPage] = useState(1);

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        employee_id: "",
        gross_salary: "",
        pf_opt_out: false,
        esic_opt_out: false,
        ptax_opt_out: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);



    const fetchDepartments = async () => {
        try {
            const response = await api.get("/departments");
            setDepartments(response.data);
        } catch (err) {
            console.error("Failed to fetch departments", err);
        }
    };

    const fetchPayrollPolicy = async () => {
        try {
            const res = await api.get('/payroll-policy');
            if (res.data) {
                const config = { ...res.data };
                // Parse strings to appropriate types
                config.basic_percentage = parseFloat(config.basic_percentage) || 70; // Default 70%
                config.pf_enabled = config.pf_enabled == '1' || config.pf_enabled === true;
                config.esic_enabled = config.esic_enabled == '1' || config.esic_enabled === true;
                config.ptax_enabled = config.ptax_enabled == '1' || config.ptax_enabled === true;

                if (typeof config.ptax_slabs === 'string') {
                    try {
                        config.ptax_slabs = JSON.parse(config.ptax_slabs);
                    } catch (e) {
                        config.ptax_slabs = [];
                        console.error("Failed to parse ptax_slabs", e);
                    }
                }
                setPayrollConfig(config);
            }
        } catch (err) {
            console.error("Failed to fetch payroll policy", err);
        }
    };

    const loadSalaries = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: currentPage,
                search,
                department_id: departmentId,
                month
            };
            const response = await api.get("/salaries", { params });
            setSalaries(response.data);
        } catch (err) {
            console.error("Failed to load salaries", err);
            setError("Failed to load salary records.");
        } finally {
            setLoading(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchDepartments();
        // Payroll policy is needed for calculations in Edit Modal
        // It should be viewable by anyone who can VIEW or MANAGE salaries
        if (user?.role_id === 1 || user?.permissions?.includes("can_view_salaries") || user?.permissions?.includes("can_manage_salaries")) {
            fetchPayrollPolicy();
        }
    }, []);

    useEffect(() => {
        loadSalaries();
    }, [currentPage, departmentId, month]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage === 1) loadSalaries();
            else setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleEdit = (salary) => {
        setSelectedSalary(salary);
        const emp = salary.employee || {};

        setFormData({
            employee_id: salary.employee_id,
            gross_salary: salary.gross_salary || "",
            pf_opt_out: Boolean(emp.pf_opt_out),
            esic_opt_out: Boolean(emp.esic_opt_out),
            ptax_opt_out: Boolean(emp.ptax_opt_out)
        });
        setIsEditModalOpen(true);
    };

    const handleHistory = async (employeeId) => {
        setIsHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            const response = await api.get(`/salaries/history/${employeeId}`);
            setSalaryHistory(response.data);
        } catch (err) {
            console.error("Failed to load history", err);
            setSalaryHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post("/salaries/update", {
                employee_id: formData.employee_id,
                gross_salary: formData.gross_salary
            });
            loadSalaries();
            setIsEditModalOpen(false);
        } catch (err) {
            console.error("Failed to update salary", err);
            alert("Failed to update salary.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get("/salaries/export", {
                params: { month, department_id: departmentId, search },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `salaries_export_${month}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Failed to export salaries", err);
            alert("Failed to export salaries.");
        }
    };

    const handleRefresh = () => {
        loadSalaries();
    };

    // Helper: Format INR
    const formatINR = (value) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0
        }).format(value);
    };

    // Calculations
    const calculateGross = (basic, hra, da, allowances, deductions) => {
        return parseFloat(basic || 0) + parseFloat(hra || 0) + parseFloat(da || 0) + parseFloat(allowances || 0) - parseFloat(deductions || 0);
    };

    const summaryStats = () => {
        if (!salaries.data.length) return { totalEmployees: 0, totalExpense: 0, avgSalary: 0, highest: 0, lowest: 0 };

        const totalEmployees = salaries.total;
        const currentData = salaries.data;
        const totalExpense = currentData.reduce((sum, s) => sum + parseFloat(s.gross_salary), 0);
        const avgSalary = totalExpense / (currentData.length || 1);
        const highest = Math.max(...currentData.map(s => parseFloat(s.gross_salary)));
        const lowest = Math.min(...currentData.map(s => parseFloat(s.gross_salary)));

        return { totalEmployees, totalExpense, avgSalary, highest, lowest };
    };

    const stats = summaryStats();

    return (
        <div className="p-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Salaries Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and review employee salary structures.</p>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-wrap gap-4 items-center transition-colors duration-200">
                <label htmlFor="search_salaries" className="sr-only">Search Salaries</label>
                <input
                    id="search_salaries"
                    name="search"
                    autoComplete="off"
                    type="text"
                    placeholder="Search employee..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-[200px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <label htmlFor="filter_department" className="sr-only">Filter by Department</label>
                <select
                    id="filter_department"
                    name="department_id"
                    autoComplete="off"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                    <option value="">All Departments</option>
                    {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
                <label htmlFor="filter_month" className="sr-only">Filter by Month</label>
                <input
                    id="filter_month"
                    name="month"
                    autoComplete="off"
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <button
                    onClick={handleRefresh}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                    Refresh
                </button>
                <button
                    onClick={handleExport}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                    Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center transition-colors duration-200">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalEmployees}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Employees</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center transition-colors duration-200">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{formatINR(stats.totalExpense)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Expense (Page)</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center transition-colors duration-200">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{formatINR(stats.avgSalary)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Salary</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center transition-colors duration-200">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{formatINR(stats.highest)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Highest</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center transition-colors duration-200">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{formatINR(stats.lowest)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lowest</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading salaries...</div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500 dark:text-red-400">{error}</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Basic (₹)</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">HRA (₹)</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">PF (₹)</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ESIC (₹)</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">PTAX (₹)</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deductions (₹)</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross Salary (₹)</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Updated</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {salaries.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                No employees found.
                                            </td>
                                        </tr>
                                    ) : (
                                        salaries.data.map((salary) => (
                                            <tr key={salary.employee_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-semibold text-gray-900 dark:text-white">{salary.employee?.user?.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{salary.employee?.employee_code}</div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500">ID: {salary.employee_id}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{salary.employee?.department?.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{salary.basic ? formatINR(salary.basic) : "-"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{salary.hra ? formatINR(salary.hra) : "-"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{salary.pf ? formatINR(salary.pf) : "-"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{salary.esic ? formatINR(salary.esic) : "-"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{salary.ptax ? formatINR(salary.ptax) : "-"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">{salary.deductions ? `-${formatINR(salary.deductions)}` : "-"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                                    {salary.gross_salary
                                                        ? formatINR(salary.gross_salary)
                                                        : (salary.employee?.salary ? <span title="From Employee Profile">{formatINR(salary.employee.salary)}*</span> : "Not Set")
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{salary.updated_at ? formatDate(salary.updated_at) : "Never"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {canManageSalary && (
                                                        <button
                                                            onClick={() => handleEdit(salary)}
                                                            className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 mr-2 transition-colors text-xs font-medium"
                                                        >
                                                            {salary.id ? "Edit Salary" : "Set Salary"}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleHistory(salary.employee_id)}
                                                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs font-medium"
                                                    >
                                                        View History
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {salaries.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm font-medium ${currentPage === 1 ? "text-gray-400 dark:text-gray-500 cursor-not-allowed" : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Page {currentPage} of {salaries.last_page}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(salaries.last_page, p + 1))}
                                    disabled={currentPage === salaries.last_page}
                                    className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm font-medium ${currentPage === salaries.last_page ? "text-gray-400 dark:text-gray-500 cursor-not-allowed" : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto transition-colors duration-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Salary Structure</h2>
                        <form onSubmit={handleSave}>
                            <div className="mb-4">
                                <label htmlFor="edit_gross" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gross Salary (Monthly)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500 text-sm">₹</span>
                                    <input
                                        id="edit_gross"
                                        name="gross_salary"
                                        autoComplete="off"
                                        type="number"
                                        value={formData.gross_salary}
                                        onChange={(e) => setFormData({ ...formData, gross_salary: e.target.value })}
                                        className="w-full pl-7 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors font-medium"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Components auto-calculated based on Payroll Policy.</p>
                            </div>

                            {/* PREVIEW COMPONENT */}
                            {(() => {
                                const gross = parseFloat(formData.gross_salary) || 0;
                                const basicPercent = payrollConfig.basic_percentage || 70;
                                const basic = Math.round((gross * basicPercent) / 100);
                                const hra = gross - basic;

                                // Deductions
                                let pf = 0;
                                if (!formData.pf_opt_out && payrollConfig.pf_enabled) {
                                    pf = Math.round(basic * 0.12);
                                }

                                let esic = 0;
                                if (!formData.esic_opt_out && payrollConfig.esic_enabled && gross <= 21000) {
                                    esic = Math.ceil(gross * 0.0075);
                                }

                                let ptax = 0;
                                if (!formData.ptax_opt_out && payrollConfig.ptax_enabled && Array.isArray(payrollConfig.ptax_slabs)) {
                                    const slab = payrollConfig.ptax_slabs.find(s => {
                                        const min = parseFloat(s.min_salary || 0);
                                        const max = s.max_salary === null || s.max_salary === "" ? Infinity : parseFloat(s.max_salary);
                                        return gross >= min && gross <= max;
                                    });
                                    if (slab) ptax = parseFloat(slab.tax_amount || 0);
                                }

                                const totalDeductions = pf + esic + ptax;
                                const netPay = gross - totalDeductions;

                                return (
                                    <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Basic ({basicPercent}%)</p>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatINR(basic)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">HRA ({100 - basicPercent}%)</p>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatINR(hra)}</p>
                                            </div>
                                        </div>
                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 grid grid-cols-3 gap-2">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">PF</p>
                                                <p className={`text-sm font-medium ${!formData.pf_opt_out && pf > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                                                    -{formatINR(pf)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">ESIC</p>
                                                <p className={`text-sm font-medium ${!formData.esic_opt_out && esic > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                                                    -{formatINR(esic)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">PTAX</p>
                                                <p className={`text-sm font-medium ${!formData.ptax_opt_out && ptax > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                                                    -{formatINR(ptax)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between items-center">
                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Est. Net Pay</p>
                                            <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatINR(netPay)}</p>
                                        </div>
                                        <div className="pt-2 text-xs text-gray-400 italic">
                                            * Opt-out settings are managed in Employee Profile.
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? "Saving..." : "Save Salary"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* HISTORY MODAL */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto transition-colors duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Salary History</h2>
                            <button
                                onClick={() => setIsHistoryModalOpen(false)}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        {historyLoading ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading history...</div>
                        ) : salaryHistory.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No edits made.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Basic (₹)</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">HRA (₹)</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">PF (₹)</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ESIC (₹)</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">PTAX (₹)</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ded. (₹)</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {salaryHistory.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.month}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatINR(item.basic)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatINR(item.hra)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatINR(item.pf || 0)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatINR(item.esic || 0)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatINR(item.ptax || 0)}</td>
                                                <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400">-{formatINR(item.deductions)}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{formatINR(item.gross_salary)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsHistoryModalOpen(false)}
                                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalariesPage;
