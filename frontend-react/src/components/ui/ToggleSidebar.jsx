import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard, Users, Building2, BadgeCheck, Clock, Calendar,
    Banknote, FileText, File, UserPlus, Star, Megaphone, Settings,
    Sliders, Bell, Activity, UserCog, BarChart, User, LogOut,
    Menu, ChevronLeft, ChevronRight
} from "lucide-react";
import Tooltip from "./Tooltip";

const ToggleSidebar = ({ title, subtitle, menuItems, onLogout }) => {
    const [isOpen, setIsOpen] = useState(() => {
        const saved = localStorage.getItem("sidebarOpen");
        return saved !== null ? JSON.parse(saved) : true;
    });

    const location = useLocation();

    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(isOpen));
    }, [isOpen]);

    const toggleSidebar = () => setIsOpen(!isOpen);

    // Icon mapping
    const getIcon = (key) => {
        const icons = {
            dashboard: LayoutDashboard,
            employees: Users,
            departments: Building2,
            designations: BadgeCheck,
            attendance: Clock,
            leaves: Calendar,
            salaries: Banknote,
            salary: Banknote,
            payslips: FileText,
            documents: File,
            recruitment: UserPlus,
            "performance-reviews": Star,
            announcements: Megaphone,
            settings: Settings,
            "system-controls": Sliders,
            notifications: Bell,
            "activity-log": Activity,
            users: UserCog,
            reports: BarChart,
            profile: User,
        };
        return icons[key] || LayoutDashboard;
    };

    const sidebarVariants = {
        open: { width: "250px", transition: { type: "spring", stiffness: 300, damping: 30 } },
        closed: { width: "70px", transition: { type: "spring", stiffness: 300, damping: 30 } },
    };

    return (
        <motion.aside
            initial={false}
            animate={isOpen ? "open" : "closed"}
            variants={sidebarVariants}
            className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 flex flex-col shadow-sm z-20"
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="overflow-hidden whitespace-nowrap"
                        >
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                >
                    {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                {menuItems.map((item) => {
                    const Icon = getIcon(item.key);
                    const isActive = location.pathname.startsWith(item.to);

                    const LinkContent = (
                        <NavLink
                            to={item.to}
                            className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                ${isActive
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"}
              `}
                        >
                            <div className={`
                flex-shrink-0 transition-colors duration-200
                ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"}
              `}>
                                <Icon size={20} />
                            </div>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="whitespace-nowrap overflow-hidden"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {/* Active Indicator (Right Border) */}
                            {isActive && isOpen && (
                                <motion.div
                                    layoutId="activeIndicator"
                                    className="absolute right-0 w-1 h-8 bg-blue-600 dark:bg-blue-500 rounded-l-full"
                                />
                            )}
                        </NavLink>
                    );

                    return isOpen ? (
                        <div key={item.key} className="relative">
                            {LinkContent}
                        </div>
                    ) : (
                        <Tooltip key={item.key} text={item.label}>
                            {LinkContent}
                        </Tooltip>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-800">
                {isOpen ? (
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                ) : (
                    <Tooltip text="Logout">
                        <button
                            onClick={onLogout}
                            className="w-full flex justify-center items-center p-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <LogOut size={20} />
                        </button>
                    </Tooltip>
                )}
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .custom-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </motion.aside>
    );
};

export default ToggleSidebar;
