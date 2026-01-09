import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import {
    ShieldCheck, Plus, ChevronDown, ChevronUp, Edit2, Trash2, Check, X, AlertTriangle
} from "lucide-react";

const LeavePoliciesPage = () => {
    const [policies, setPolicies] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPolicyId, setExpandedPolicyId] = useState(null);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        joining_category: "Permanent",
        effective_from: "",
        status: "Active",
        rules: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [policiesRes, typesRes] = await Promise.all([
                api.get("/leave-policies"),
                api.get("/leave-types")
            ]);
            setPolicies(policiesRes.data);
            setLeaveTypes(typesRes.data);
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    };

    // Grouping
    const groupedPolicies = {
        "New Joinee": policies.filter(p => p.joining_category === "New Joinee"),
        "Intern": policies.filter(p => p.joining_category === "Intern"),
        "Permanent": policies.filter(p => p.joining_category === "Permanent"),
    };

    const handleOpenModal = (policy = null) => {
        if (policy) {
            setEditingPolicy(policy);
            // Transform rules for form
            const rules = leaveTypes.map(lt => {
                const existingRule = policy.rules.find(r => r.leave_type_id === lt.id);
                return existingRule || {
                    leave_type_id: lt.id,
                    total_leaves_per_year: 0,
                    accrual_frequency: "Yearly",
                    carry_forward_allowed: false,
                    max_carry_forward: 0,
                    requires_approval: true,
                    auto_approve: false,
                    allow_partial_leave: true,
                    probation_restriction: false,
                    available_during_probation: true
                };
            });

            setFormData({
                name: policy.name,
                joining_category: policy.joining_category,
                effective_from: policy.effective_from,
                status: policy.status,
                rules: rules
            });
        } else {
            setEditingPolicy(null);
            // Default blank rules for all types
            const initialRules = leaveTypes.map(lt => ({
                leave_type_id: lt.id,
                total_leaves_per_year: 0,
                accrual_frequency: "Yearly",
                carry_forward_allowed: false,
                max_carry_forward: 0,
                requires_approval: true,
                auto_approve: false,
                allow_partial_leave: true,
                probation_restriction: false,
                available_during_probation: true
            }));

            setFormData({
                name: "",
                joining_category: "Permanent",
                effective_from: new Date().toISOString().split('T')[0],
                status: "Active",
                rules: initialRules
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingPolicy) {
                await api.put(`/leave-policies/${editingPolicy.id}`, formData);
            } else {
                await api.post("/leave-policies", formData);
            }
            fetchData();
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to save policy", err);
            alert(err.response?.data?.message || "Failed to save policy");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This action cannot be undone.")) return;
        try {
            await api.delete(`/leave-policies/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete");
        }
    };

    const handleRecalculate = async (id) => {
        if (!window.confirm("This will update leave balances for all assigned employees. Continue?")) return;
        try {
            const res = await api.post(`/leave-policies/${id}/recalculate`);
            alert(res.data.message);
        } catch (err) {
            alert("Failed to recalculate");
        }
    };

    const handleRuleChange = (index, field, value) => {
        const newRules = [...formData.rules];
        newRules[index] = { ...newRules[index], [field]: value };
        setFormData({ ...formData, rules: newRules });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Policies...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-blue-600" /> Leave Policy Master
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Configure dynamic leave rules per joining category</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
                >
                    <Plus className="w-4 h-4" /> Create Policy
                </button>
            </div>

            <div className="grid gap-8">
                {Object.entries(groupedPolicies).map(([category, categoryPolicies]) => (
                    <div key={category} className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2 flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${category === 'Permanent' ? 'bg-green-500' : category === 'Intern' ? 'bg-yellow-500' : 'bg-blue-500'}`}></span>
                            {category} Policies
                        </h2>

                        {categoryPolicies.length === 0 ? (
                            <div className="text-gray-400 text-sm italic py-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">No policies configured for {category}.</div>
                        ) : (
                            categoryPolicies.map(policy => (
                                <div key={policy.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div
                                        className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                                        onClick={() => setExpandedPolicyId(expandedPolicyId === policy.id ? null : policy.id)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{policy.name}</h3>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${policy.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {policy.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">Effective: {policy.effective_from}</p>
                                        </div>

                                        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleRecalculate(policy.id)}
                                                className="text-sm text-blue-600 hover:underline px-2"
                                                title="Recalculate Balances"
                                            >
                                                Recalculate
                                            </button>
                                            <button onClick={() => handleOpenModal(policy)} className="p-2 text-gray-500 hover:text-blue-600">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(policy.id)} className="p-2 text-gray-500 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setExpandedPolicyId(expandedPolicyId === policy.id ? null : policy.id)} className="p-2 text-gray-400">
                                                {expandedPolicyId === policy.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {expandedPolicyId === policy.id && (
                                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                                            <div className="grid grid-cols-1 gap-4">
                                                {policy.rules.map(rule => (
                                                    <div key={rule.id} className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-4 text-sm">
                                                        <div className="font-medium w-full md:w-1/4 text-gray-900 dark:text-gray-200">
                                                            {rule.leave_type?.name || 'Unknown Type'}
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 text-gray-600 dark:text-gray-400">
                                                            <div>
                                                                <span className="block text-xs uppercase text-gray-400">Total</span>
                                                                {rule.total_leaves_per_year} / {rule.accrual_frequency}
                                                            </div>
                                                            <div>
                                                                <span className="block text-xs uppercase text-gray-400">Carry Fwd</span>
                                                                {rule.carry_forward_allowed ? `Yes (Max ${rule.max_carry_forward})` : 'No'}
                                                            </div>
                                                            <div>
                                                                <span className="block text-xs uppercase text-gray-400">Probat/Partial</span>
                                                                {rule.probation_restriction ? 'Restricted' : 'Allowed'} / {rule.allow_partial_leave ? 'Partial OK' : 'No Partial'}
                                                            </div>
                                                            <div>
                                                                <span className="block text-xs uppercase text-gray-400">Approval</span>
                                                                {rule.auto_approve ? <span className="text-green-600">Auto</span> : 'Required'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <h2 className="text-xl font-bold dark:text-white">{editingPolicy ? 'Edit Policy' : 'Create New Policy'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-auto p-6 flex-1">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="md:col-span-2">
                                    <label htmlFor="policyName" className="block text-sm font-medium mb-1 dark:text-gray-300">Policy Name</label>
                                    <input
                                        id="policyName"
                                        name="name"
                                        required
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Permanent Employees 2025"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="joiningCategory" className="block text-sm font-medium mb-1 dark:text-gray-300">Joining Category</label>
                                    <select
                                        id="joiningCategory"
                                        name="joining_category"
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.joining_category}
                                        onChange={e => setFormData({ ...formData, joining_category: e.target.value })}
                                    >
                                        <option value="New Joinee">New Joinee</option>
                                        <option value="Intern">Intern</option>
                                        <option value="Permanent">Permanent</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="policyStatus" className="block text-sm font-medium mb-1 dark:text-gray-300">Status</label>
                                    <select
                                        id="policyStatus"
                                        name="status"
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm text-orange-600 italic">Changing rules affects future leave calculations.</span>
                                </div>
                            </div>

                            {/* Rules Table */}
                            <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                                <table className="w-full min-w-[1000px] text-sm text-left">
                                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold">
                                        <tr>
                                            <th className="p-3">Leave Type</th>
                                            <th className="p-3 w-32">Total / Year</th>
                                            <th className="p-3 w-32">Accrual</th>
                                            <th className="p-3 text-center">Carry Fwd</th>
                                            <th className="p-3 text-center">Auto Approve</th>
                                            <th className="p-3 text-center">Probation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {leaveTypes.map((lt, idx) => {
                                            const rule = formData.rules.find(r => r.leave_type_id === lt.id) || {};
                                            return (
                                                <tr key={lt.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750">
                                                    <td className="p-3 font-medium text-gray-900 dark:text-white">{lt.name}</td>
                                                    <td className="p-3">
                                                        <input
                                                            type="number" step="0.5" min="0"
                                                            aria-label={`Total leaves for ${lt.name}`}
                                                            name={`total_leaves_per_year_${lt.id}`}
                                                            id={`total_leaves_per_year_${lt.id}`}
                                                            className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                            value={rule.total_leaves_per_year ?? 0}
                                                            onChange={e => handleRuleChange(idx, 'total_leaves_per_year', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <select
                                                            aria-label={`Accrual frequency for ${lt.name}`}
                                                            name={`accrual_frequency_${lt.id}`}
                                                            id={`accrual_frequency_${lt.id}`}
                                                            className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                            value={rule.accrual_frequency ?? 'Yearly'}
                                                            onChange={e => handleRuleChange(idx, 'accrual_frequency', e.target.value)}
                                                        >
                                                            <option value="Yearly">Yearly</option>
                                                            <option value="Monthly">Monthly</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-3 text-center space-y-1">
                                                        <input
                                                            type="checkbox"
                                                            aria-label={`Carry forward allowed for ${lt.name}`}
                                                            name={`carry_forward_allowed_${lt.id}`}
                                                            id={`carry_forward_allowed_${lt.id}`}
                                                            checked={rule.carry_forward_allowed ?? false}
                                                            onChange={e => handleRuleChange(idx, 'carry_forward_allowed', e.target.checked)}
                                                        />
                                                        {rule.carry_forward_allowed && (
                                                            <input
                                                                type="number" placeholder="Max" className="w-16 p-1 text-xs border rounded ml-2"
                                                                aria-label={`Max carry forward for ${lt.name}`}
                                                                name={`max_carry_forward_${lt.id}`}
                                                                id={`max_carry_forward_${lt.id}`}
                                                                value={rule.max_carry_forward ?? 0}
                                                                onChange={e => handleRuleChange(idx, 'max_carry_forward', e.target.value)}
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            aria-label={`Auto approve for ${lt.name}`}
                                                            name={`auto_approve_${lt.id}`}
                                                            id={`auto_approve_${lt.id}`}
                                                            checked={rule.auto_approve ?? false}
                                                            onChange={e => handleRuleChange(idx, 'auto_approve', e.target.checked)}
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <label htmlFor={`probation_restriction_${lt.id}`} className="text-xs flex items-center gap-1">
                                                                Restricted
                                                                <input
                                                                    type="checkbox"
                                                                    id={`probation_restriction_${lt.id}`}
                                                                    name={`probation_restriction_${lt.id}`}
                                                                    checked={rule.probation_restriction ?? false}
                                                                    onChange={e => handleRuleChange(idx, 'probation_restriction', e.target.checked)}
                                                                />
                                                            </label>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </form>

                        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 dark:text-gray-300">Cancel</button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Policy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeavePoliciesPage;
