const NotificationDetailModal = ({ isOpen, onClose, notification }) => {
    if (!isOpen || !notification) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-2xl transform transition-all border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notification Details</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-transparent border-none cursor-pointer text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>
                <div className="p-6">
                    <div className="mb-4">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{notification.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{notification.message}</p>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                        Received: {new Date(notification.created_at).toLocaleString()}
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationDetailModal;
