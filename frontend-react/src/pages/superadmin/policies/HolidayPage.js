import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import { Plus, Trash, Edit, Calendar } from "lucide-react";

const HolidayPage = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        start_date: "",
        end_date: "",
        type: "Global",
        department_id: "",
        location: "",
    });

    useEffect(() => {
        fetchHolidays();
        fetchDepartments();
    }, []);

    const fetchHolidays = async () => {
        try {
            const res = await api.get("/holidays");
            setHolidays(res.data);
        } catch (err) {
            console.error("Failed to fetch holidays", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await api.get("/departments");
            setDepartments(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            // Clean up payload based on type
            if (payload.type !== "Department") payload.department_id = null;
            if (payload.type !== "Location") payload.location = null;

            if (editingHoliday) {
                await api.put(`/holidays/${editingHoliday.id}`, payload);
            } else {
                await api.post("/holidays", payload);
            }
            fetchHolidays();
            setShowModal(false);
            resetForm();
        } catch (err) {
            alert("Failed to save holiday");
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) {
            try {
                await api.delete(`/holidays/${id}`);
                fetchHolidays();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const resetForm = () => {
        setEditingHoliday(null);
        setFormData({
            name: "",
            start_date: "",
            end_date: "",
            type: "Global",
            department_id: "",
            location: "",
        });
    };

    const openEdit = (holiday) => {
        setEditingHoliday(holiday);
        setFormData({
            name: holiday.name,
            start_date: holiday.start_date,
            end_date: holiday.end_date,
            type: holiday.type,
            department_id: holiday.department_id || "",
            location: holiday.location || "",
        });
        setShowModal(true);
    };

    const getDepartmentName = (id) => departments.find(d => d.id === parseInt(id))?.name || "-";

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Calendar className="w-6 h-6" /> Holiday Calendar
                    </h1>
                    <p className="text-gray-500">Manage holidays for the organization.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={18} /> Add Holiday
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Date Range</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Scope</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {holidays.map((h) => (
                            <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4 font-medium text-gray-900 dark:text-white">{h.name}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">
                                    {h.start_date} {h.start_date !== h.end_date && ` - ${h.end_date}`}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                        ${h.type === 'Global' ? 'bg-purple-100 text-purple-700' :
                                            h.type === 'Department' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {h.type}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-500">
                                    {h.type === 'Department' ? getDepartmentName(h.department_id) :
                                        h.type === 'Location' ? h.location : 'All Employees'}
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button onClick={() => openEdit(h)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(h.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                        <Trash size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {holidays.length === 0 && <div className="p-8 text-center text-gray-500">No holidays found.</div>}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-lg">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">{editingHoliday ? "Edit Holiday" : "New Holiday"}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="holiday_name" className="block text-sm font-medium mb-1 dark:text-gray-300">Holiday Name</label>
                                <input
                                    id="holiday_name"
                                    name="name"
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    autoComplete="off"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="start_date" className="block text-sm font-medium mb-1 dark:text-gray-300">Start Date</label>
                                    <input
                                        id="start_date"
                                        name="start_date"
                                        type="date"
                                        required
                                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                        autoComplete="off"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="end_date" className="block text-sm font-medium mb-1 dark:text-gray-300">End Date</label>
                                    <input
                                        id="end_date"
                                        name="end_date"
                                        type="date"
                                        required
                                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.end_date}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="holiday_type" className="block text-sm font-medium mb-1 dark:text-gray-300">Holiday Type</label>
                                <select
                                    id="holiday_type"
                                    name="type"
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    autoComplete="off"
                                >
                                    <option value="Global">Global (All Employees)</option>
                                    <option value="Department">Department Specific</option>
                                    <option value="Location">Location Specific</option>
                                </select>
                            </div>

                            {formData.type === "Department" && (
                                <div>
                                    <label htmlFor="department_select" className="block text-sm font-medium mb-1 dark:text-gray-300">Select Department</label>
                                    <select
                                        id="department_select"
                                        name="department_id"
                                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.department_id}
                                        onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                                        autoComplete="off"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.type === "Location" && (
                                <div>
                                    <label htmlFor="location_input" className="block text-sm font-medium mb-1 dark:text-gray-300">Location</label>
                                    <input
                                        id="location_input"
                                        name="location"
                                        type="text"
                                        placeholder="Enter Location (e.g. New York Office)"
                                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        autoComplete="off"
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    id="cancel_holiday_btn"
                                    name="cancel_holiday"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700 dark:text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    id="save_holiday_btn"
                                    name="save_holiday"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save Holiday
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HolidayPage;
