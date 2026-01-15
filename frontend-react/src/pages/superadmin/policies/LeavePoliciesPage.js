import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import {
    ShieldCheck, Plus, ChevronDown, ChevronUp, Edit2, Trash2, Check, X, AlertTriangle, List, ArrowRight, Users
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

    // Carry Forward State
    const [isCFModalOpen, setIsCFModalOpen] = useState(false);
    const [cfPolicy, setCfPolicy] = useState(null);
    const [cfLeaveTypeId, setCfLeaveTypeId] = useState("");
    const [cfCandidates, setCfCandidates] = useState([]);
    const [selectedCandidates, setSelectedCandidates] = useState([]);
    const [cfMaxLimit, setCfMaxLimit] = useState(5); // Default limit
    const [cfLoading, setCfLoading] = useState(false);

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

    // Carry Forward Handlers
    const handleOpenCFModal = (policy) => {
        setCfPolicy(policy);
        setCfLeaveTypeId("");
        setCfCandidates([]);
        setSelectedCandidates([]);
        setIsCFModalOpen(true);
    };

    useEffect(() => {
        if (cfPolicy && cfLeaveTypeId) {
            const fetchCandidates = async () => {
                setCfLoading(true);
                try {
                    const res = await api.get(`/leave-policies/${cfPolicy.id}/carry-forward-candidates?leave_type_id=${cfLeaveTypeId}&max_limit=${cfMaxLimit}`);
                    setCfCandidates(res.data);
                } catch (err) {
                    setCfCandidates([]);
                } finally {
                    setCfLoading(false);
                }
            };
            const debounce = setTimeout(fetchCandidates, 500); // Debounce input
            return () => clearTimeout(debounce);
        }
    }, [cfLeaveTypeId, cfPolicy, cfMaxLimit]);

    const handleProcessCF = async () => {
        if (selectedCandidates.length === 0) return alert("Select at least one employee");
        if (!window.confirm(`Process carry forward for ${selectedCandidates.length} employees? This will add days to their balance.`)) return;

        const candidatesPayload = cfCandidates
            .filter(c => selectedCandidates.includes(c.employee_id))
            .map(c => ({
                employee_id: c.employee_id,
                amount: c.proposed_carry_forward
            }));

        try {
            const res = await api.post(`/leave-policies/${cfPolicy.id}/process-carry-forward`, {
                leave_type_id: cfLeaveTypeId,
                candidates: candidatesPayload
            });
            alert(res.data.message);
            setIsCFModalOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to process");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Policies...</div>;

    return (
        <div className="p-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        Leave Policy Master
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Configure dynamic leave rules per joining category</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                >
                    <Plus className="w-5 h-5" /> Create Policy
                </button>
            </div>

            <div className="space-y-10">
                {Object.entries(groupedPolicies).map(([category, categoryPolicies]) => (
                    <div key={category} className="space-y-5">
                        <div className="flex items-center gap-3 mb-4">
                            <span className={`w-3 h-8 rounded-full ${category === 'Permanent' ? 'bg-gradient-to-b from-green-400 to-green-600' : category === 'Intern' ? 'bg-gradient-to-b from-amber-400 to-amber-600' : 'bg-gradient-to-b from-blue-400 to-blue-600'}`}></span>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                {category} Policies
                            </h2>
                            <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 ml-auto">
                                {categoryPolicies.length} Active
                            </span>
                        </div>

                        {categoryPolicies.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                                <p className="text-gray-400 dark:text-gray-500 font-medium">No policies configured for {category}</p>
                                <button onClick={() => handleOpenModal()} className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-2 hover:underline">
                                    + Add New Policy
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {categoryPolicies.map(policy => (
                                    <div key={policy.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 group">
                                        <div
                                            className="p-5 flex flex-col md:flex-row justify-between items-center gap-6 cursor-pointer"
                                            onClick={() => setExpandedPolicyId(expandedPolicyId === policy.id ? null : policy.id)}
                                        >
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {policy.name}
                                                    </h3>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${policy.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
                                                        {policy.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1.5">
                                                        <Check className="w-4 h-4 text-green-500" />
                                                        Effective: {new Date(policy.effective_from).toLocaleDateString()}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{policy.rules?.length || 0} Leave Types</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleRecalculate(policy.id)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"
                                                >
                                                    Recalculate
                                                </button>
                                                <button
                                                    onClick={() => handleOpenCFModal(policy)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40 transition-colors"
                                                >
                                                    Carry Forward
                                                </button>
                                                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                                                <button onClick={() => handleOpenModal(policy)} className="p-2 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 bg-gray-50 hover:bg-white rounded-lg dark:bg-gray-800 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(policy.id)} className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 bg-gray-50 hover:bg-white rounded-lg dark:bg-gray-800 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="p-2 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                                {expandedPolicyId === policy.id ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                                            </div>
                                        </div>

                                        {expandedPolicyId === policy.id && (
                                            <div className="px-6 pb-6 pt-2 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/50">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {policy.rules.map(rule => (
                                                        <div key={rule.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                                            <h4 className="font-bold text-gray-900 dark:text-white mb-3 pl-3">{rule.leave_type?.name}</h4>

                                                            <div className="space-y-2 text-sm pl-3">
                                                                <div className="flex justify-between border-b border-gray-50 dark:border-gray-700 pb-1">
                                                                    <span className="text-gray-500 dark:text-gray-400">Quota</span>
                                                                    <span className="font-medium text-gray-900 dark:text-gray-200">{rule.total_leaves_per_year} / {rule.accrual_frequency}</span>
                                                                </div>

                                                                <div className="flex justify-between pt-1">
                                                                    <span className="text-gray-500 dark:text-gray-400">Approval</span>
                                                                    <span className={`font-bold ${rule.auto_approve ? 'text-green-600' : 'text-amber-600'}`}>
                                                                        {rule.auto_approve ? 'Auto' : 'Required'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300">
                                {editingPolicy ? 'Edit Policy Configuration' : 'Create New Policy'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-auto p-6 flex-1 custom-scrollbar">
                            {/* Basic Info Section */}
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-800/30 mb-8">
                                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-4 uppercase tracking-wider">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-2">
                                        <label htmlFor="policyName" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Policy Name</label>
                                        <input
                                            id="policyName"
                                            name="name"
                                            autoComplete="off"
                                            required
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Permanent Employees 2025"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="joiningCategory" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Joining Category</label>
                                        <select
                                            id="joiningCategory"
                                            name="joining_category"
                                            autoComplete="off"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                                            value={formData.joining_category}
                                            onChange={e => setFormData({ ...formData, joining_category: e.target.value })}
                                        >
                                            <option value="New Joinee">New Joinee</option>
                                            <option value="Intern">Intern</option>
                                            <option value="Permanent">Permanent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="policyStatus" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Status</label>
                                        <select
                                            id="policyStatus"
                                            name="status"
                                            autoComplete="off"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6 flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                <span className="text-sm text-orange-700 dark:text-orange-300 font-medium">Warning: Modifying leave rules will trigger a re-calculation of balances for all affected employees.</span>
                            </div>

                            {/* Rules Table */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <List className="w-4 h-4" /> Leave Rules Configuration
                                </h3>
                                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                                    <table className="w-full min-w-[1000px] text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <th className="p-4 w-48">Leave Type</th>
                                                <th className="p-4 w-32">Total / Year</th>
                                                <th className="p-4 w-36">Accrual</th>
                                                <th className="p-4 text-center">Restrictions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                            {leaveTypes.map((lt, idx) => {
                                                const rule = formData.rules.find(r => r.leave_type_id === lt.id) || {};
                                                return (
                                                    <tr key={lt.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors group">
                                                        <td className="p-4 font-semibold text-gray-800 dark:text-gray-200">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                                {lt.name}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <input
                                                                type="number" step="0.5" min="0"
                                                                id={`total_leaves_per_year_${lt.id}`}
                                                                aria-label={`Total leaves for ${lt.name}`}
                                                                name={`total_leaves_per_year_${lt.id}`}
                                                                className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700/50 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center font-medium"
                                                                value={rule.total_leaves_per_year ?? 0}
                                                                onChange={e => handleRuleChange(idx, 'total_leaves_per_year', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="p-4">
                                                            <select
                                                                id={`accrual_frequency_${lt.id}`}
                                                                aria-label={`Accrual frequency for ${lt.name}`}
                                                                name={`accrual_frequency_${lt.id}`}
                                                                className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700/50 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                                                value={rule.accrual_frequency ?? 'Yearly'}
                                                                onChange={e => handleRuleChange(idx, 'accrual_frequency', e.target.value)}
                                                            >
                                                                <option value="Yearly">Yearly</option>
                                                                <option value="Monthly">Monthly</option>
                                                            </select>
                                                        </td>


                                                        <td className="p-4 text-center">
                                                            <label htmlFor={`probation_restriction_${lt.id}`} className="inline-flex items-center gap-2 cursor-pointer group/check">
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rule.probation_restriction ? 'bg-amber-500 border-amber-500' : 'border-gray-300 dark:border-gray-500'}`}>
                                                                    {rule.probation_restriction && <Check className="w-3 h-3 text-white" />}
                                                                </div>
                                                                <input
                                                                    type="checkbox"
                                                                    id={`probation_restriction_${lt.id}`}
                                                                    className="hidden"
                                                                    checked={rule.probation_restriction ?? false}
                                                                    onChange={e => handleRuleChange(idx, 'probation_restriction', e.target.checked)}
                                                                />
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 group-hover/check:text-amber-600 transition-colors">Probation Restricted</span>
                                                            </label>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </form>

                        <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-4 rounded-b-2xl">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" /> Save Policy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Carry Forward Modal */}
            {isCFModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-purple-50/80 dark:bg-purple-900/20 backdrop-blur-sm">
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-800 to-purple-600 dark:from-purple-200 dark:to-purple-400 flex items-center gap-2">
                                <ArrowRight className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                Process Carry Forward
                            </h2>
                            <button onClick={() => setIsCFModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-auto custom-scrollbar">
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                                <div>
                                    <label htmlFor="cfLeaveType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Leave Type</label>
                                    <select
                                        id="cfLeaveType"
                                        name="cfLeaveType"
                                        autoComplete="off"
                                        className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={cfLeaveTypeId}
                                        onChange={e => setCfLeaveTypeId(e.target.value)}
                                    >
                                        <option value="">-- Select Leave Type --</option>
                                        {leaveTypes.map(lt => (
                                            <option key={lt.id} value={lt.id}>{lt.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="cfMaxLimit" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Max Carry Forward Days</label>
                                    <input
                                        id="cfMaxLimit"
                                        name="cfMaxLimit"
                                        autoComplete="off"
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={cfMaxLimit}
                                        onChange={e => setCfMaxLimit(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                            {cfLoading ? (
                                <div className="text-center py-10">
                                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-gray-500">Calculating eligible candidates...</p>
                                </div>
                            ) : cfCandidates.length > 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 font-semibold uppercase text-xs">
                                            <tr>
                                                <th className="p-4 w-12">
                                                    <input
                                                        type="checkbox"
                                                        aria-label="Select all employees"
                                                        checked={selectedCandidates.length === cfCandidates.length}
                                                        onChange={e => setSelectedCandidates(e.target.checked ? cfCandidates.map(c => c.employee_id) : [])}
                                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                    />
                                                </th>
                                                <th className="p-4">Employee</th>
                                                <th className="p-4 text-center">Remaining Balance</th>
                                                <th className="p-4 text-center">Max Allowed</th>
                                                <th className="p-4 text-center text-purple-600">Proposed Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {cfCandidates.map(c => (
                                                <tr key={c.employee_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                    <td className="p-4">
                                                        <input
                                                            type="checkbox"
                                                            aria-label={`Select employee ${c.name}`}
                                                            checked={selectedCandidates.includes(c.employee_id)}
                                                            onChange={e => {
                                                                if (e.target.checked) setSelectedCandidates([...selectedCandidates, c.employee_id]);
                                                                else setSelectedCandidates(selectedCandidates.filter(id => id !== c.employee_id));
                                                            }}
                                                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                        />
                                                    </td>
                                                    <td className="p-4 font-medium text-gray-800 dark:text-gray-200">
                                                        {c.name} <span className="text-xs text-gray-400 ml-1">({c.employee_code})</span>
                                                    </td>
                                                    <td className="p-4 text-center text-gray-500">{c.remaining}</td>
                                                    <td className="p-4 text-center text-gray-500">{c.max_allowed}</td>
                                                    <td className="p-4 text-center font-bold text-purple-600 bg-purple-50/50 dark:bg-purple-900/10">
                                                        +{c.proposed_carry_forward}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : cfLeaveTypeId && (
                                <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                    <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                    No eligible candidates found for this leave type.<br />
                                    (Either 0 remaining balance or Carry Forward not allowed).
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={() => setIsCFModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium hover:bg-white dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessCF}
                                disabled={selectedCandidates.length === 0}
                                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <ArrowRight className="w-4 h-4" /> Process Credit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeavePoliciesPage;
