import React, { useState } from 'react';
import { X, Download, Calendar, User, FileText } from 'lucide-react';
import axios from '../../api/axios';

const DownloadPayslipModal = ({ onClose, employees }) => {
    const [formData, setFormData] = useState({
        employee_id: '',
        rangeType: '1', // 1, 3, 6, custom
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1, // Current month (1-indexed)
        start_month: '',
        end_month: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    // Searchable Dropdown State
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [filteredEmployees, setFilteredEmployees] = useState(employees);
    const dropdownRef = React.useRef(null);

    // Initial Filter
    React.useEffect(() => {
        setFilteredEmployees(employees);
    }, [employees]);

    // Search Filter Logic
    React.useEffect(() => {
        if (!searchQuery) {
            setFilteredEmployees(employees);
            return;
        }
        if (searchQuery === 'All Employees') return;

        const lower = searchQuery.toLowerCase();
        const filtered = employees.filter(emp =>
            (emp.user?.name || "").toLowerCase().includes(lower) ||
            (emp.employee_code || "").toLowerCase().includes(lower)
        );
        setFilteredEmployees(filtered);
    }, [searchQuery, employees]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleDownload = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (!formData.employee_id) {
                throw new Error("Please select an employee");
            }

            let start = 0;
            let end = 0;
            const selectedMonth = parseInt(formData.month);

            if (formData.rangeType === 'custom') {
                if (!formData.start_month || !formData.end_month) throw new Error("Please select start and end months");
                start = parseInt(formData.start_month);
                end = parseInt(formData.end_month);
                if (start > end) throw new Error("Start month cannot be after end month");
            } else {
                // Calculate range backwards
                const range = parseInt(formData.rangeType); // 1, 3, 6
                end = selectedMonth;
                start = end - range + 1;

                // Simple validation: if start < 1, it implies crossing year boundary which is complex. 
                // For MVP, let's restrict to within selected year or handle simplistic approach.
                // Requirement says "1 month, 3 months, 6 months". 
                // Let's assume user selects "End Month" and we look back. 
                // If start < 1, we should probably error or handle multi-year. 
                // Keeping it simple: Restrict to current year for now or just error if invalid.

                if (start < 1) {
                    throw new Error("Date range crosses year boundary. Please use Custom Range for precise control or select a later month.");
                }
            }

            const params = {
                employee_id: formData.employee_id,
                year: formData.year,
                start_month: start,
                end_month: end
            };

            const response = await axios.get('/payslips/download', {
                params,
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Payslips_${formData.employee_id}_${formData.year}_${start}-${end}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            onClose();
        } catch (err) {
            console.error("Download failed", err);
            const msg = err.response?.data?.message || err.message || "Failed to download payslips";

            // If blob response is JSON error (common issue with axios blob type)
            if (err.response?.data instanceof Blob && err.response.data.type === 'application/json') {
                const text = await err.response.data.text();
                try {
                    const json = JSON.parse(text);
                    setError(json.message);
                } catch (e) {
                    setError(msg);
                }
            } else {
                setError(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Download className="w-4 h-4 text-blue-600" />
                        Download Payslips
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleDownload} className="p-5 space-y-4">
                    {error && (
                        <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                            {error}
                        </div>
                    )}

                    {/* Employee Selection */}
                    <div className="space-y-1 relative" ref={dropdownRef}>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Employee
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Start typing name or code..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsDropdownOpen(true);
                                    if (e.target.value === '') {
                                        setFormData(prev => ({ ...prev, employee_id: '' }));
                                    }
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            />
                            {formData.employee_id && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, employee_id: '' }));
                                        setSearchQuery('');
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {isDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                <div
                                    className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm font-medium text-blue-600 border-b border-gray-50 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, employee_id: 'all' }));
                                        setSearchQuery('All Employees');
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    All Employees
                                </div>
                                {filteredEmployees.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-gray-500">No employees found</div>
                                ) : (
                                    filteredEmployees.map(emp => (
                                        <div
                                            key={emp.id}
                                            className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-700 last:border-0"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, employee_id: emp.id }));
                                                setSearchQuery(`${emp.employee_code} - ${emp.user?.name}`);
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            <span className="font-medium">{emp.user?.name}</span>
                                            <span className="text-xs text-gray-500 ml-2">({emp.employee_code})</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Year Selection */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Year
                        </label>
                        <select
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    {/* Range Type */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Export Range
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { val: '1', label: '1 Month' },
                                { val: '3', label: '3 Months' },
                                { val: '6', label: '6 Months' },
                                { val: 'custom', label: 'Custom' },
                            ].map(opt => (
                                <label key={opt.val} className={`cursor-pointer border rounded-md p-2 text-center text-xs font-medium transition-all ${formData.rangeType === opt.val
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="rangeType"
                                        value={opt.val}
                                        checked={formData.rangeType === opt.val}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Range Inputs */}
                    {formData.rangeType === 'custom' ? (
                        <div className="grid grid-cols-2 gap-3 animate-in fade-in">
                            <div>
                                <label className="text-[10px] font-semibold text-gray-400 uppercase mb-1 block">Start</label>
                                <select
                                    name="start_month"
                                    value={formData.start_month}
                                    onChange={handleChange}
                                    className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                                    required
                                >
                                    <option value="">Start</option>
                                    {months.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-gray-400 uppercase mb-1 block">End</label>
                                <select
                                    name="end_month"
                                    value={formData.end_month}
                                    onChange={handleChange}
                                    className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                                    required
                                >
                                    <option value="">End</option>
                                    {months.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in space-y-1">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">End Month</label>
                            <select
                                name="month"
                                value={formData.month}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                            >
                                {months.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-gray-400 mt-1">
                                Will generate: <span className="font-medium text-gray-600 dark:text-gray-300">
                                    {formData.rangeType === '1' ? months[formData.month - 1].label :
                                        `Prior ${formData.rangeType} months up to ${months[formData.month - 1].label}`
                                    }
                                </span>
                            </p>
                        </div>
                    )}

                    <div className="pt-2 flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow hover:shadow-md transition-all text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Processing...' : <><Download size={16} /> Download</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DownloadPayslipModal;
