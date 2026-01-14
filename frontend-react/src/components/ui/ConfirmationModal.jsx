import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "warning" // warning, danger, success, info
}) => {
    if (!isOpen) return null;

    const variants = {
        danger: {
            icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
            buttonBg: "bg-red-600 hover:bg-red-700",
            iconBg: "bg-red-100 dark:bg-red-900/30",
        },
        warning: {
            icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
            buttonBg: "bg-yellow-600 hover:bg-yellow-700",
            iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
        },
        success: {
            icon: <CheckCircle className="w-6 h-6 text-green-600" />,
            buttonBg: "bg-green-600 hover:bg-green-700",
            iconBg: "bg-green-100 dark:bg-green-900/30",
        },
        info: {
            icon: <Info className="w-6 h-6 text-blue-600" />,
            buttonBg: "bg-blue-600 hover:bg-blue-700",
            iconBg: "bg-blue-100 dark:bg-blue-900/30",
        }
    };

    const style = variants[variant] || variants.warning;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full flex-shrink-0 ${style.iconBg}`}>
                                {style.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {message}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mt-8 flex items-center justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-all shadow-md active:scale-95 ${style.buttonBg}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmationModal;
