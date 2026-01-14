import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const EmailSettingsPage = () => {
    const [preferences, setPreferences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState(null); // For modal/editing
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        setLoading(true);
        try {
            const response = await api.get('/email-preferences');
            setPreferences(response.data);
        } catch (error) {
            console.error("Failed to fetch preferences", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (pref) => {
        setSelectedType(pref);
        setFormData({
            to_emails: pref.to_emails || '',
            cc_emails: pref.cc_emails || '',
            bcc_emails: pref.bcc_emails || '',
            subject_template: pref.subject_template,
            body_template: pref.body_template,
        });
        setMessage(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedType) return;

        setIsSubmitting(true);
        try {
            await api.post('/email-preferences', {
                leave_type_id: selectedType.leave_type_id,
                ...formData
            });
            setMessage({ type: 'success', text: 'Template saved successfully!' });

            // Refresh list
            fetchPreferences();
            setSelectedType(null); // Close modal
        } catch (error) {
            console.error("Failed to save", error);
            setMessage({ type: 'error', text: 'Failed to save template.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Email Settings</h1>

            <p className="mb-6 text-gray-600 dark:text-gray-400">
                Customize your email templates for each leave type. These emails will be automatically sent when you apply for leave.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {preferences.map(pref => (
                    <div key={pref.leave_type_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{pref.leave_type_name}</h3>
                                {pref.has_custom_template ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Customized</span>
                                ) : (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">Default</span>
                                )}
                            </div>
                            <div className="mb-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Subject</p>
                                <p className="text-sm text-gray-800 dark:text-gray-300 truncate">{pref.subject_template}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleEdit(pref)}
                            className="w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-gray-700 dark:text-blue-400 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                        >
                            Edit Template
                        </button>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {selectedType && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit {selectedType.leave_type_name} Template</h2>
                            <button onClick={() => setSelectedType(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="templateForm" onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Emails (comma separated)</label>
                                        <input
                                            type="text"
                                            value={formData.to_emails}
                                            onChange={e => setFormData({ ...formData, to_emails: e.target.value })}
                                            placeholder="manager@example.com (Manager is added automatically)"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                        <p className="text-xs text-gray-500 mt-1 mb-3">Your reporting manager is automatically included. Add others here.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CC Emails (comma separated)</label>
                                        <input
                                            type="text"
                                            value={formData.cc_emails}
                                            onChange={e => setFormData({ ...formData, cc_emails: e.target.value })}
                                            placeholder="hr@example.com, lead@example.com"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BCC Emails (comma separated)</label>
                                        <input
                                            type="text"
                                            value={formData.bcc_emails}
                                            onChange={e => setFormData({ ...formData, bcc_emails: e.target.value })}
                                            placeholder="hidden@example.com"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Template *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject_template}
                                        onChange={e => setFormData({ ...formData, subject_template: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body Template *</label>
                                    <textarea
                                        required
                                        rows="8"
                                        value={formData.body_template}
                                        onChange={e => setFormData({ ...formData, body_template: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                    ></textarea>
                                </div>

                                {/* Variables section removed as requested */}
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button type="button" onClick={() => setSelectedType(null)} className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">Cancel</button>
                            <button type="submit" form="templateForm" disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                                {isSubmitting ? 'Saving...' : 'Save Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailSettingsPage;
