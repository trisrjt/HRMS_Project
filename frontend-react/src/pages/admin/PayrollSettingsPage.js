import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Save, Plus, Trash, AlertCircle, CheckCircle } from 'lucide-react';

const PayrollSettingsPage = () => {
    const { user } = useAuth();
    const canManage = user?.role_id === 1 || user?.role_id === 2 || (user?.role_id === 3 && user?.permissions?.includes("can_manage_salaries"));

    const [policies, setPolicies] = useState({
        basic_percentage: 70,
        hra_percentage: 30,
        pf_enabled: true,
        esic_enabled: true,
        ptax_enabled: true,
        ptax_slabs: []
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const res = await axios.get('/payroll-policy');
            let data = res.data;

            // Parse Slabs
            if (data.ptax_slabs && typeof data.ptax_slabs === 'string') {
                try {
                    data.ptax_slabs = JSON.parse(data.ptax_slabs);
                } catch (e) {
                    data.ptax_slabs = [];
                }
            } else if (!data.ptax_slabs) {
                data.ptax_slabs = [];
            }

            // Normalize Booleans
            const isTrue = (val) => {
                if (val === undefined || val === null) return false;
                const str = String(val).trim().toLowerCase();
                return str === '1' || str === 'true';
            };
            data.pf_enabled = isTrue(data.pf_enabled);
            data.esic_enabled = isTrue(data.esic_enabled);
            data.ptax_enabled = isTrue(data.ptax_enabled);

            setPolicies(prev => ({ ...prev, ...data }));
        } catch (err) {
            console.error("Failed to fetch policies", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPolicies(prev => {
            const newVal = type === 'checkbox' ? checked : value;
            // Auto-adjust HRA if Basic changes
            if (name === 'basic_percentage') {
                return { ...prev, [name]: newVal, hra_percentage: 100 - newVal };
            }
            if (name === 'hra_percentage') {
                return { ...prev, [name]: newVal, basic_percentage: 100 - newVal };
            }
            return { ...prev, [name]: newVal };
        });
    };

    const handleSlabChange = (index, field, value) => {
        const newSlabs = [...policies.ptax_slabs];
        newSlabs[index][field] = value;
        setPolicies(prev => ({ ...prev, ptax_slabs: newSlabs }));
    };

    const addSlab = () => {
        setPolicies(prev => ({
            ...prev,
            ptax_slabs: [...prev.ptax_slabs, { min_salary: 0, max_salary: 0, tax_amount: 0 }]
        }));
    };

    const removeSlab = (index) => {
        const newSlabs = policies.ptax_slabs.filter((_, i) => i !== index);
        setPolicies(prev => ({ ...prev, ptax_slabs: newSlabs }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        try {
            await axios.post('/payroll-policy', {
                ...policies,
                ptax_slabs: JSON.stringify(policies.ptax_slabs)
            });
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update settings.' });
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Payroll Settings</h1>

            {message && (
                <div className={`mb-4 p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
                    {message.text}
                </div>
            )}

            {loading ? <p>Loading...</p> : (
                <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
                    {/* Salary Components */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Salary Structure Breakdown</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="basic_percentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Basic Salary (%)</label>
                                <div className="flex items-center">
                                    <input
                                        id="basic_percentage"
                                        type="number"
                                        name="basic_percentage"
                                        value={policies.basic_percentage}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        min="0"
                                        max="100"
                                        autoComplete="off"
                                    />
                                    <span className="ml-2 text-gray-500">%</span>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="hra_percentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HRA (%)</label>
                                <div className="flex items-center">
                                    <input
                                        id="hra_percentage"
                                        type="number"
                                        name="hra_percentage"
                                        value={policies.hra_percentage}
                                        readOnly // Auto-calculated
                                        className="w-full border rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300 cursor-not-allowed"
                                        autoComplete="off"
                                    />
                                    <span className="ml-2 text-gray-500">%</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Automatically set to (100 - Basic).</p>
                            </div>
                        </div>
                    </div>

                    {/* Deductions */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Statutory Deductions (Global)</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-800 dark:text-white">Provident Fund (PF)</h3>
                                    <p className="text-sm text-gray-500">12% of Basic Salary</p>
                                </div>
                                <label htmlFor="pf_enabled" className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        id="pf_enabled"
                                        type="checkbox"
                                        name="pf_enabled"
                                        checked={policies.pf_enabled}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                        aria-label="Enable Provident Fund"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-800 dark:text-white">ESIC</h3>
                                    <p className="text-sm text-gray-500">0.75% of Gross Salary</p>
                                </div>
                                <label htmlFor="esic_enabled" className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        id="esic_enabled"
                                        type="checkbox"
                                        name="esic_enabled"
                                        checked={policies.esic_enabled}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                        aria-label="Enable ESIC"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-800 dark:text-white">Professional Tax (PTAX)</h3>
                                    <p className="text-sm text-gray-500">Slab-based deduction</p>
                                </div>
                                <label htmlFor="ptax_enabled" className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        id="ptax_enabled"
                                        type="checkbox"
                                        name="ptax_enabled"
                                        checked={policies.ptax_enabled}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                        aria-label="Enable Professional Tax"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* PTAX Slabs */}
                    {policies.ptax_enabled && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Professional Tax Slabs</h2>
                                <button type="button" onClick={addSlab} className="flex items-center text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100">
                                    <Plus className="w-4 h-4 mr-1" /> Add Slab
                                </button>
                            </div>
                            <div className="space-y-2">
                                {policies.ptax_slabs.map((slab, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label htmlFor={`ptax_min_${index}`} className="sr-only">Min Salary</label>
                                            <input
                                                id={`ptax_min_${index}`}
                                                name={`ptax_min_${index}`}
                                                type="number"
                                                placeholder="Min Salary"
                                                value={slab.min_salary}
                                                onChange={(e) => handleSlabChange(index, 'min_salary', e.target.value)}
                                                className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                aria-label={`Minimum Salary for Slab ${index + 1}`}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <span className="text-gray-500">-</span>
                                        <div className="flex-1">
                                            <label htmlFor={`ptax_max_${index}`} className="sr-only">Max Salary</label>
                                            <input
                                                id={`ptax_max_${index}`}
                                                name={`ptax_max_${index}`}
                                                type="number"
                                                placeholder="Max Salary"
                                                value={slab.max_salary || ""}
                                                onChange={(e) => handleSlabChange(index, 'max_salary', e.target.value)}
                                                className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                aria-label={`Maximum Salary for Slab ${index + 1}`}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <span className="text-gray-500">→</span>
                                        <div className="w-32">
                                            <label htmlFor={`ptax_amount_${index}`} className="sr-only">Tax Amount</label>
                                            <input
                                                id={`ptax_amount_${index}`}
                                                name={`ptax_amount_${index}`}
                                                type="number"
                                                placeholder="Tax Amount"
                                                value={slab.tax_amount}
                                                onChange={(e) => handleSlabChange(index, 'tax_amount', e.target.value)}
                                                className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                aria-label={`Tax Amount for Slab ${index + 1}`}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <button type="button" onClick={() => removeSlab(index)} className="text-red-500 hover:text-red-700" aria-label={`Remove Slab ${index + 1}`}>
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {policies.ptax_slabs.length === 0 && <p className="text-gray-400 text-sm">No slabs defined.</p>}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        {canManage && (
                            <button type="submit" className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                                <Save className="w-5 h-5 mr-2" /> Save Settings
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
};

export default PayrollSettingsPage;
