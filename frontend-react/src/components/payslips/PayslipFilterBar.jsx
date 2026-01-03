import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';

const PayslipFilterBar = ({ filters, onFilterChange, departments = [] }) => {
    const months = [
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 transition-colors duration-200">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <label htmlFor="search_payslips" className="sr-only">Search Payslips</label>
                    <input
                        id="search_payslips"
                        type="text"
                        placeholder="Search employee..."
                        value={filters.search}
                        onChange={(e) => onFilterChange('search', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                    />
                </div>

                {/* Filters Group */}
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {/* Department Filter */}
                    <div className="relative min-w-[140px]">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <label htmlFor="filter_department" className="sr-only">Filter by Department</label>
                        <select
                            id="filter_department"
                            value={filters.department}
                            onChange={(e) => onFilterChange('department', e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors"
                        >
                            <option value="">All Depts</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Month Filter */}
                    <div className="relative min-w-[140px]">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <label htmlFor="filter_month" className="sr-only">Filter by Month</label>
                        <select
                            id="filter_month"
                            value={filters.month}
                            onChange={(e) => onFilterChange('month', e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors"
                        >
                            <option value="">All Months</option>
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year Filter */}
                    <div className="relative min-w-[100px]">
                        <label htmlFor="filter_year" className="sr-only">Filter by Year</label>
                        <select
                            id="filter_year"
                            value={filters.year}
                            onChange={(e) => onFilterChange('year', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors"
                        >
                            <option value="">Year</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayslipFilterBar;
