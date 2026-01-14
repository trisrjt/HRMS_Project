import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { STORAGE_URL } from "../../../api/axios";
import { ArrowLeft, Save, Edit2, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const EmployeeProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditingSalary, setIsEditingSalary] = useState(false);

    // Permissions
    const isSuperAdmin = user?.role_id === 1;
    const canManageSalary = isSuperAdmin || user?.role_id === 2 || user?.permissions?.includes("can_manage_salaries");

    // Salary Form State
    const [salaryData, setSalaryData] = useState({
        basic: 0,
        hra: 0,
        da: 0,
        allowances: 0,
        deductions: 0,
        gross_salary: 0
    });

    useEffect(() => {
        fetchEmployee();
    }, [id]);

    const fetchEmployee = async () => {
        try {
            // Unified Endpoint
            const { data } = await api.get(`/employees/${id}`);
            setEmployee(data);
            if (data.current_salary) {
                setSalaryData({
                    basic: parseFloat(data.current_salary.basic),
                    hra: parseFloat(data.current_salary.hra),
                    da: parseFloat(data.current_salary.da),
                    allowances: parseFloat(data.current_salary.allowances || 0),
                    deductions: parseFloat(data.current_salary.deductions),
                    gross_salary: parseFloat(data.current_salary.gross_salary)
                });
            }
        } catch (err) {
            setError("Failed to load employee details.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSalaryChange = (e) => {
        const { name, value } = e.target;
        setSalaryData(prev => {
            const updated = { ...prev, [name]: value };
            const basic = parseFloat(updated.basic) || 0;
            const hra = parseFloat(updated.hra) || 0;
            const da = parseFloat(updated.da) || 0;
            const allowances = parseFloat(updated.allowances) || 0;
            const deductions = parseFloat(updated.deductions) || 0;
            updated.gross_salary = (basic + hra + da + allowances - deductions).toFixed(2);
            return updated;
        });
    };

    const handleRecalculate = () => {
        const basicVal = parseFloat(salaryData.basic) || 0;
        const hra = (basicVal * 0.40).toFixed(2);
        const da = (basicVal * 0.10).toFixed(2);
        const allowances = (basicVal * 0.05).toFixed(2);
        const deductions = (basicVal * 0.02).toFixed(2);
        const gross = (basicVal + parseFloat(hra) + parseFloat(da) + parseFloat(allowances) - parseFloat(deductions)).toFixed(2);

        setSalaryData(prev => ({
            ...prev,
            hra,
            da,
            allowances,
            deductions,
            gross_salary: gross
        }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const maskAadhar = (aadhar) => {
        if (!aadhar) return "N/A";
        return aadhar.replace(/\d{8}(\d{4})/, "XXXX-XXXX-$1");
    };

    const getProfilePhotoUrl = (path) => {
        if (!path) return null;
        return `${STORAGE_URL}/${path}`;
    };

    const handleSaveSalary = async () => {
        try {
            // Unified Endpoint
            await api.put(`/employees/${id}`, { ...salaryData });
            setIsEditingSalary(false);
            fetchEmployee(); // Refresh data
        } catch (err) {
            alert("Failed to update salary: " + (err.response?.data?.message || err.message));
        }
    };

    const handleBack = () => {
        if (user?.role_id === 3) navigate("/hr/employees");
        else if (user?.role_id === 2) navigate("/admin/employees");
        else navigate("/superadmin/employees");
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <button
                onClick={handleBack}
                className="flex items-center text-gray-600 mb-6 hover:text-gray-900"
            >
                <ArrowLeft size={20} className="mr-2" /> Back to Employees
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden border-2 border-white shadow-sm">
                            {employee?.profile_photo ? (
                                <img
                                    src={getProfilePhotoUrl(employee.profile_photo)}
                                    alt={employee.user?.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    {employee?.user?.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{employee?.user?.name}</h1>
                            <p className="text-gray-500">{employee?.designation?.name || '-'} • {employee?.department?.name}</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${employee?.user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {employee?.user?.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Personal Details */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Email</label>
                                <p className="font-medium">{employee?.user?.email}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Phone</label>
                                <p className="font-medium">{employee?.phone || "N/A"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Emergency Contact</label>
                                <p className="font-medium">{employee?.emergency_contact || "N/A"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Date of Birth</label>
                                <p className="font-medium">{formatDate(employee?.dob)}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Gender</label>
                                <p className="font-medium">{employee?.gender || "N/A"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Marital Status</label>
                                <p className="font-medium">{employee?.marital_status || "N/A"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Address</label>
                                <p className="font-medium">{employee?.address || "N/A"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Date of Joining</label>
                                <p className="font-medium">{formatDate(employee?.date_of_joining)}</p>
                            </div>
                            <div className="pt-3 border-t border-gray-100">
                                <label className="text-xs text-gray-500 uppercase">Aadhar Number</label>
                                <p className="font-medium font-mono">{maskAadhar(employee?.aadhar_number)}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">PAN Number</label>
                                <p className="font-medium font-mono">{employee?.pan_number || "N/A"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Salary Structure */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Salary Structure</h2>
                            {(!isEditingSalary && canManageSalary) && (
                                <button
                                    onClick={() => setIsEditingSalary(true)}
                                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    <Edit2 size={16} className="mr-1" /> Edit Salary
                                </button>
                            )}
                            {isEditingSalary && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleRecalculate}
                                        className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                                    >
                                        Recalculate
                                    </button>
                                    <button
                                        onClick={() => setIsEditingSalary(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            {isEditingSalary ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Basic</label>
                                            <input
                                                type="number"
                                                name="basic"
                                                value={salaryData.basic}
                                                onChange={handleSalaryChange}
                                                className="w-full p-2 border rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">HRA</label>
                                            <input
                                                type="number"
                                                name="hra"
                                                value={salaryData.hra}
                                                onChange={handleSalaryChange}
                                                className="w-full p-2 border rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">DA</label>
                                            <input
                                                type="number"
                                                name="da"
                                                value={salaryData.da}
                                                onChange={handleSalaryChange}
                                                className="w-full p-2 border rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Allowances</label>
                                            <input
                                                type="number"
                                                name="allowances"
                                                value={salaryData.allowances}
                                                onChange={handleSalaryChange}
                                                className="w-full p-2 border rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Deductions</label>
                                            <input
                                                type="number"
                                                name="deductions"
                                                value={salaryData.deductions}
                                                onChange={handleSalaryChange}
                                                className="w-full p-2 border rounded text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-gray-200 mt-3">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-gray-900">Gross Salary</span>
                                            <span className="font-bold text-xl text-green-600">₹{salaryData.gross_salary}</span>
                                        </div>
                                        <button
                                            onClick={handleSaveSalary}
                                            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex justify-center items-center gap-2"
                                        >
                                            <Save size={18} /> Save Changes
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Basic Salary</span>
                                        <span className="font-medium">₹{salaryData.basic}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">HRA</span>
                                        <span className="font-medium">₹{salaryData.hra}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">DA</span>
                                        <span className="font-medium">₹{salaryData.da}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Allowances</span>
                                        <span className="font-medium">₹{salaryData.allowances}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Deductions</span>
                                        <span>- ₹{salaryData.deductions}</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-200 mt-1 flex justify-between items-center">
                                        <span className="font-bold text-gray-900">Gross Salary</span>
                                        <span className="font-bold text-lg text-green-600">₹{salaryData.gross_salary}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfilePage;
