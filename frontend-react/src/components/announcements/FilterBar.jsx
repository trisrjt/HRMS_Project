import React from "react";
import { Search, Filter, Calendar } from "lucide-react";

const FilterBar = ({ filters, onFilterChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ ...filters, [name]: value });
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors duration-200">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative w-full md:w-1/3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <label htmlFor="announcement_search" className="sr-only">Search Announcements</label>
                    <input
                        id="announcement_search"
                        type="text"
                        name="search"
                        value={filters.search}
                        onChange={handleChange}
                        placeholder="Search announcements..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                    />
                </div>

                {/* Filters Group */}
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {/* Category Filter */}
                    <div className="relative">
                        <label htmlFor="filter_category" className="sr-only">Filter by Category</label>
                        <select
                            id="filter_category"
                            name="category"
                            value={filters.category}
                            onChange={handleChange}
                            className="appearance-none pl-3 pr-8 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                        >
                            <option value="">All Categories</option>
                            <option value="General">General</option>
                            <option value="HR">HR</option>
                            <option value="Payroll">Payroll</option>
                            <option value="Events">Events</option>
                            <option value="Urgent">Urgent</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                            <Filter size={14} className="text-gray-400 dark:text-gray-500" />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <label htmlFor="filter_status" className="sr-only">Filter by Status</label>
                    <select
                        id="filter_status"
                        name="status"
                        value={filters.status}
                        onChange={handleChange}
                        className="pl-3 pr-8 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>

                    {/* Audience Filter */}
                    <label htmlFor="filter_audience" className="sr-only">Filter by Audience</label>
                    <select
                        id="filter_audience"
                        name="audience"
                        value={filters.audience}
                        onChange={handleChange}
                        className="pl-3 pr-8 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                        <option value="">All Audiences</option>
                        <option value="Employee">Employee</option>
                        <option value="Admin">Admin</option>
                        <option value="HR">HR</option>
                        <option value="SuperAdmin">SuperAdmin</option>
                    </select>

                    {/* Date Filter */}
                    <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 transition-colors">
                        <Calendar size={16} className="text-gray-400 dark:text-gray-500" />
                        <label htmlFor="filter_start_date" className="sr-only">Start Date</label>
                        <input
                            id="filter_start_date"
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleChange}
                            className="text-sm focus:outline-none text-gray-600 dark:text-gray-300 bg-transparent"
                        />
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                        <label htmlFor="filter_end_date" className="sr-only">End Date</label>
                        <input
                            id="filter_end_date"
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleChange}
                            className="text-sm focus:outline-none text-gray-600 dark:text-gray-300 bg-transparent"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
