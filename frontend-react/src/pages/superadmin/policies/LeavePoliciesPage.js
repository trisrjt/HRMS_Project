import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import { ShieldCheck, Save, AlertCircle } from "lucide-react";

const LeavePoliciesPage = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const res = await api.get("/leave-policies");
            setPolicies(res.data);
        } catch (err) {
            console.error("Failed to fetch policies", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id, field, currentValue) => {
        // Optimistic update
        setPolicies(prev => prev.map(p => p.id === id ? { ...p, [field]: !currentValue } : p));
        setUpdating(id);

        try {
            await api.put(`/leave-policies/${id}`, { [field]: !currentValue });
        } catch (err) {
            console.error("Failed to update policy", err);
            // Revert
            setPolicies(prev => prev.map(p => p.id === id ? { ...p, [field]: currentValue } : p));
            alert("Failed to update policy");
        } finally {
            setUpdating(null);
        }
    };

    const handleSelectChange = async (id, field, value) => {
        // Optimistic update
        const oldValue = policies.find(p => p.id === id)[field];
        setPolicies(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
        setUpdating(id);

        try {
            await api.put(`/leave-policies/${id}`, { [field]: value });
        } catch (err) {
            console.error("Failed to update policy", err);
            // Revert
            setPolicies(prev => prev.map(p => p.id === id ? { ...p, [field]: oldValue } : p));
            alert("Failed to update policy");
        } finally {
            setUpdating(null);
        }
    };

    const handleNumberChange = async (id, field, value) => {
        const numValue = parseInt(value) || 0;
        setPolicies(prev => prev.map(p => p.id === id ? { ...p, [field]: numValue } : p));

        // Debounce actual API call? For simplicity, we'll wait for blur or "Save" button individually, 
        // but user requirement says "Easy to manage". Toggles are instant. Inputs might need a save button or onBlur.
        // Let's us onBlur for the input.
    };

    const savePolicy = async (policy) => {
        setUpdating(policy.id);
        try {
            await api.put(`/leave-policies/${policy.id}`, {
                max_days_per_year: policy.max_days_per_year
            });
        } catch (err) {
            console.error(err);
            alert("Failed to update limit");
        } finally {
            setUpdating(null);
        }
    };

    if (loading) return <div className="p-6">Loading Policies...</div>;

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6" /> Leave Policies
                </h1>
                <p className="text-gray-500">Configure rules for each leave type.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {policies.map(policy => (
                    <div key={policy.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{policy.name}</h3>
                                <p className="text-sm text-gray-500">{policy.description}</p>
                            </div>
                            {updating === policy.id && <span className="text-xs text-blue-500 animate-pulse">Saving...</span>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <label htmlFor={`max_days_${policy.id}`} className="block text-sm font-medium mb-2 dark:text-gray-300">Max Days / Year</label>
                                <div className="flex gap-2">
                                    <input
                                        id={`max_days_${policy.id}`}
                                        name={`max_days_${policy.id}`}
                                        type="number"
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={policy.max_days_per_year}
                                        onChange={(e) => handleNumberChange(policy.id, 'max_days_per_year', e.target.value)}
                                        onBlur={() => savePolicy(policy)}
                                    />
                                </div>
                            </div>

                            {/* Applicable Gender - Only for Maternity */}
                            {policy.name.toLowerCase().includes('maternity') && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <label htmlFor={`gender_${policy.id}`} className="block text-sm font-medium mb-2 dark:text-gray-300">Applicable Gender</label>
                                    <select
                                        id={`gender_${policy.id}`}
                                        name={`gender_${policy.id}`}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={policy.applicable_gender || 'All'}
                                        onChange={(e) => handleSelectChange(policy.id, 'applicable_gender', e.target.value)}
                                    >
                                        <option value="All">All Employees</option>
                                        <option value="Male">Male Only</option>
                                        <option value="Female">Female Only</option>
                                        <option value="Other">Other Only</option>
                                    </select>
                                </div>
                            )}

                            {/* Toggles */}
                            <div className="col-span-1 md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <Toggle
                                    id={`carry_forward_${policy.id}`}
                                    name={`carry_forward_${policy.id}`}
                                    label="Carry Forward"
                                    checked={policy.carry_forward_allowed}
                                    onChange={() => handleToggle(policy.id, 'carry_forward_allowed', policy.carry_forward_allowed)}
                                />
                                <Toggle
                                    id={`partial_approval_${policy.id}`}
                                    name={`partial_approval_${policy.id}`}
                                    label="Partial Approval"
                                    checked={policy.allow_partial_approval}
                                    onChange={() => handleToggle(policy.id, 'allow_partial_approval', policy.allow_partial_approval)}
                                />
                                <Toggle
                                    id={`auto_approve_${policy.id}`}
                                    name={`auto_approve_${policy.id}`}
                                    label="Auto Approve"
                                    checked={policy.auto_approve}
                                    onChange={() => handleToggle(policy.id, 'auto_approve', policy.auto_approve)}
                                    warning={true}
                                />
                                <Toggle
                                    id={`requires_approval_${policy.id}`}
                                    name={`requires_approval_${policy.id}`}
                                    label="Requires Approval"
                                    checked={policy.requires_approval}
                                    onChange={() => handleToggle(policy.id, 'requires_approval', policy.requires_approval)}
                                    disabled={policy.auto_approve}
                                />
                                <Toggle
                                    id={`is_paid_${policy.id}`}
                                    name={`is_paid_${policy.id}`}
                                    label="Is Paid Leave"
                                    checked={policy.is_paid}
                                    onChange={() => handleToggle(policy.id, 'is_paid', policy.is_paid)}
                                />
                                <Toggle
                                    id={`probation_${policy.id}`}
                                    name={`probation_${policy.id}`}
                                    label="Avail. in Probation"
                                    checked={policy.available_during_probation}
                                    onChange={() => handleToggle(policy.id, 'available_during_probation', policy.available_during_probation)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Toggle = ({ label, checked, onChange, disabled, warning, id, name }) => (
    <button
        type="button"
        id={id}
        name={name}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`w-full p-3 rounded-lg border ${checked ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700'} flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={!disabled ? onChange : undefined}
        disabled={disabled}
    >
        <span className={`text-sm font-medium ${warning && checked ? 'text-orange-600' : 'text-gray-700 dark:text-gray-300'}`}>
            {label}
        </span>
        <div className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ease-in-out ${checked ? (warning ? 'bg-orange-500' : 'bg-blue-600') : 'bg-gray-300 dark:bg-gray-600'}`}>
            <div className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ease-in-out ${checked ? 'translate-x-5' : ''}`}></div>
        </div>
    </button>
);

export default LeavePoliciesPage;
