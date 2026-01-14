import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { FileText, Download, Trash2, Upload, Search, Filter, X, Eye } from "lucide-react";

const DocumentsPage = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [employees, setEmployees] = useState([]); // For Admin/HR filter
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ employee_id: "", document_type: "" });

    // Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadData, setUploadData] = useState({
        employee_id: "",
        document_type: "",
        document_title: "",
        file: null
    });
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    // Constants
    const isEmployee = user?.role_id === 4;
    const docTypes = ["Resume", "Offer Letter", "Aadhar", "PAN", "Experience Letter", "Payslip", "Voter ID", "Passport", "Other"];

    useEffect(() => {
        fetchDocuments();
        if (!isEmployee) {
            fetchEmployees();
        }
    }, [filters]); // Re-fetch when filters change

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            let params = {};
            if (filters.employee_id) params.employee_id = filters.employee_id;
            if (filters.document_type) params.document_type = filters.document_type;

            if (filters.document_type) params.document_type = filters.document_type;

            const response = await api.get("/employee-documents", {
                params: params
            });
            setDocuments(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching documents:", err);
            setError("Failed to load documents.");
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await api.get("/employees");
            setEmployees(response.data);
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("document_type", uploadData.document_type);
            formData.append("document_title", uploadData.document_title);
            formData.append("file", uploadData.file);

            if (!isEmployee) {
                if (!uploadData.employee_id) {
                    alert("Please select an employee.");
                    setUploading(false);
                    return;
                }
                formData.append("employee_id", uploadData.employee_id);
            }

            await api.post("/employee-documents", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            setIsUploadModalOpen(false);
            setUploadData({ employee_id: "", document_type: "", document_title: "", file: null });
            fetchDocuments(); // Refresh list
        } catch (err) {
            console.error("Upload failed", err);
            alert("Upload failed. Ensure file is within limits (2MB).");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        try {
            await api.delete(`/employee-documents/${id}`);
            setDocuments(documents.filter(doc => doc.id !== id));
            setDocuments(documents.filter(doc => doc.id !== id));
        } catch (err) {
            console.error("Delete failed", err);
            alert("Failed to delete document.");
        }
    };

    const handleView = async (doc) => {
        try {
            const response = await api.get(`/employee-documents/${doc.id}/download`, {
                responseType: 'blob',
            });

            const file = new Blob([response.data], { type: response.headers['content-type'] });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (err) {
            console.error("View failed", err);
            alert("Failed to view document.");
        }
    };

    const handleDownload = async (doc) => {
        try {
            const response = await api.get(`/employee-documents/${doc.id}/download`, {
                responseType: 'blob', // Important
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const ext = doc.file_path.split('.').pop();
            link.setAttribute('download', `${doc.document_title}.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download failed", err);
            alert("Failed to download document.");
        }
    }

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        Employee Documents
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {isEmployee ? "Manage your personal documents" : "Manage all employee documents safely"}
                    </p>
                </div>

                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition-colors"
                >
                    <Upload size={18} /> Upload Document
                </button>
            </div>

            {/* Filters (Admin/HR Only) */}
            {!isEmployee && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Filter size={18} /> <span className="text-sm font-medium">Filters:</span>
                    </div>

                    <div>
                        <label htmlFor="filter_employee" className="sr-only">Filter by Employee</label>
                        <select
                            id="filter_employee"
                            name="filter_employee"
                            className="border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                            value={filters.employee_id}
                            onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}
                        >
                            <option value="">All Employees</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.user?.name} ({emp.employee_code})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="filter_document_type" className="sr-only">Filter by Document Type</label>
                        <select
                            id="filter_document_type"
                            name="filter_document_type"
                            className="border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.document_type}
                            onChange={(e) => setFilters({ ...filters, document_type: e.target.value })}
                        >
                            <option value="">All Types</option>
                            {docTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>

                    {(filters.employee_id || filters.document_type) && (
                        <button
                            onClick={() => setFilters({ employee_id: "", document_type: "" })}
                            className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                            <X size={16} /> Clear
                        </button>
                    )}
                </div>
            )}

            {/* Document List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading documents...</div>
                ) : documents.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                        <FileText className="w-12 h-12 text-gray-300 mb-3" />
                        <p>No documents found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">
                                    {!isEmployee && <th className="p-4 font-semibold">Employee</th>}
                                    <th className="p-4 font-semibold">Type</th>
                                    <th className="p-4 font-semibold">Title</th>
                                    <th className="p-4 font-semibold">Size</th>
                                    <th className="p-4 font-semibold">Uploaded On</th>
                                    {!isEmployee && <th className="p-4 font-semibold">Uploaded By</th>}
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        {!isEmployee && (
                                            <td className="p-4 text-sm text-gray-900 dark:text-white">
                                                <div className="font-medium">{doc.employee?.user?.name || "Unknown"}</div>
                                                <div className="text-xs text-gray-500">{doc.employee?.employee_code}</div>
                                            </td>
                                        )}
                                        <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium">
                                                {doc.document_type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">{doc.document_title}</td>
                                        <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{doc.file_size ? `${doc.file_size} KB` : "N/A"}</td>
                                        <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </td>
                                        {!isEmployee && (
                                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                                {doc.uploader ? (
                                                    <div>
                                                        <div className="font-medium">{doc.uploader.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {doc.uploader.role_id === 1 ? 'SuperAdmin' :
                                                                doc.uploader.role_id === 2 ? 'Admin' :
                                                                    doc.uploader.role_id === 3 ? 'HR' : 'Employee'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">Unknown</span>
                                                )}
                                            </td>
                                        )}
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => handleView(doc)}
                                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                                                title="View"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(doc)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                title="Download"
                                            >
                                                <Download size={18} />
                                            </button>

                                            {!isEmployee && (
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Document</h2>
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-4">
                            {!isEmployee && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Employee *</label>
                                    <select
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                        value={uploadData.employee_id}
                                        onChange={(e) => setUploadData({ ...uploadData, employee_id: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Select Employee --</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.user?.name} ({emp.employee_code})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Type *</label>
                                <select
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                    value={uploadData.document_type}
                                    onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
                                    required
                                >
                                    <option value="">-- Select Type --</option>
                                    {docTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Title *</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Signed Offer Letter"
                                    value={uploadData.document_title}
                                    onChange={(e) => setUploadData({ ...uploadData, document_title: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File (PDF, Image, max 2MB) *</label>
                                <input
                                    type="file"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow disabled:opacity-50 flex items-center gap-2"
                                >
                                    {uploading ? "Uploading..." : "Upload Document"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentsPage;
