import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import { Plus, Trash, Edit, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, Upload, X, FileSpreadsheet } from "lucide-react";

const HolidayPage = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [viewMode, setViewMode] = useState("calendar"); // Default to calendar
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false); // Import Modal State
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        start_date: "",
        end_date: "",
    });

    useEffect(() => {
        fetchHolidays();
        // fetchDepartments(); // Department fetch no longer needed
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
        // Deprecated
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, type: "Global", department_id: null, location: null };

            if (editingHoliday) {
                await api.put(`/holidays/${editingHoliday.id}`, payload);
            } else {
                await api.post("/holidays", payload);
            }
            await fetchHolidays();

            // If adding a new holiday, switch calendar to that month to show it
            if (!editingHoliday && payload.start_date) {
                const newHolidayDate = new Date(payload.start_date);
                setCurrentMonth(newHolidayDate);
            }

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
        });
    };

    const openEdit = (holiday) => {
        setEditingHoliday(holiday);
        setFormData({
            name: holiday.name,
            start_date: holiday.start_date,
            end_date: holiday.end_date,
        });
        setShowModal(true);
    };

    const getDepartmentName = (id) => "-"; // Deprecated

    // Calendar Logic
    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const renderCalendar = () => {
        const { days, firstDay } = getDaysInMonth(currentMonth);
        const totalSlots = Math.ceil((days + firstDay) / 7) * 7;
        const daysArray = Array.from({ length: totalSlots }, (_, i) => {
            if (i < firstDay || i >= firstDay + days) return null;
            return i - firstDay + 1;
        });

        const getHolidaysForDate = (day) => {
            if (!day) return [];
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return holidays.filter(h => {
                const start = h.start_date;
                const end = h.end_date;
                return dateStr >= start && dateStr <= end;
            });
        };

        const isToday = (day) => {
            if (!day) return false;
            const today = new Date();
            return today.getDate() === day &&
                today.getMonth() === currentMonth.getMonth() &&
                today.getFullYear() === currentMonth.getFullYear();
        };

        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg ring-1 ring-black/5 overflow-hidden transition-all duration-300">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <button onClick={prevMonth} className="p-2 hover:bg-white/50 dark:hover:bg-gray-600 rounded-xl transition-all shadow-sm hover:shadow text-gray-600 dark:text-gray-300">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={nextMonth} className="p-2 hover:bg-white/50 dark:hover:bg-gray-600 rounded-xl transition-all shadow-sm hover:shadow text-gray-600 dark:text-gray-300">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <div className="grid grid-cols-7 text-center bg-gray-50/50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 auto-rows-fr bg-gray-50/30 dark:bg-gray-900/30">
                    {daysArray.map((day, idx) => {
                        const dayHolidays = getHolidaysForDate(day);
                        const hasHoliday = dayHolidays.length > 0;
                        return (
                            <div key={idx} className={`min-h-[120px] border-b border-r border-gray-100 dark:border-gray-700/50 p-2 transition-colors hover:bg-white dark:hover:bg-gray-750
                                ${!day ? 'bg-gray-50/50 dark:bg-gray-800/20' :
                                    hasHoliday ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-800'}`}>
                                {day && (
                                    <>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-all ${isToday(day)
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900'
                                                : hasHoliday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-700'
                                                }`}>
                                                {day}
                                            </span>
                                            {hasHoliday && (
                                                <span className="flex h-2 w-2 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-1.5 pl-1">
                                            {dayHolidays.map(h => (
                                                <div
                                                    key={h.id}
                                                    onClick={(e) => { e.stopPropagation(); openEdit(h); }}
                                                    className="group text-[10px] sm:text-xs px-2 py-1.5 rounded-md border-l-2 cursor-pointer shadow-sm hover:shadow transition-all hover:translate-x-0.5 bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                                                    title={h.name}
                                                >
                                                    <div className="font-semibold truncate">{h.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Import Modal Handler
    const handleImport = async (e) => {
        e.preventDefault();
        const file = e.target.file.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            await api.post("/holidays/import", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            await fetchHolidays();
            setShowImportModal(false);
            alert("Holidays imported successfully!");
        } catch (err) {
            console.error("Import failed", err);
            alert("Import failed: " + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6" /> Holiday Calendar
                    </h1>
                    <p className="text-gray-500">Manage holidays for the organization.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 flex">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                            title="List View"
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode("calendar")}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                            title="Calendar View"
                        >
                            <CalendarIcon size={20} />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600 px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Upload size={18} /> Import
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Holiday
                    </button>
                </div>
            </div>

            {viewMode === "list" ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Date Range</th>
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
            ) : (
                renderCalendar()
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-lg shadow-lg relative">
                        <button
                            onClick={() => setShowImportModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-6">
                            <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FileSpreadsheet size={24} />
                            </div>
                            <h2 className="text-xl font-bold dark:text-white">Import Holidays</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                Bulk upload holidays using an Excel or CSV file.
                            </p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 border border-blue-100 dark:border-blue-900/50">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 text-sm">Required Format Headers</h4>
                            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                                <li><strong>name</strong> (Required)</li>
                                <li><strong>start_date</strong> (Required, YYYY-MM-DD)</li>
                                <li><strong>end_date</strong> (Optional, YYYY-MM-DD)</li>
                            </ul>
                        </div>

                        <form onSubmit={handleImport} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Select File</label>
                                <input
                                    type="file"
                                    name="file"
                                    accept=".csv, .xlsx, .xls"
                                    required
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(false)}
                                    className="px-4 py-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700 dark:text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <Upload size={16} /> Upload & Import
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
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

