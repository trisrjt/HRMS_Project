import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Fingerprint,
  User,
  CreditCard,
  Download,
  RefreshCw,
  HelpCircle,
  X,
  Calendar,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const BiometricAttendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    employee_id: '',
    method: '',
  });
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchBiometricAttendances();
    fetchStatistics();
  }, [page, filters]);

  const fetchBiometricAttendances = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: 15,
        ...filters,
      };
      
      const response = await api.get('/superadmin/biometric/attendance', { params });
      setAttendances(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (err) {
      console.error('Error fetching biometric attendance:', err);
      setError(err.response?.data?.error || 'Failed to load biometric attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/superadmin/biometric/statistics');
      setStatistics(response.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/superadmin/biometric/export', {
        params: filters,
      });
      
      if (response.data.download_url) {
        window.open(response.data.download_url, '_blank');
      }
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Failed to export report');
    }
  };

  const openImageDialog = (attendance) => {
    setSelectedAttendance(attendance);
    setImageDialogOpen(true);
  };

  const getBiometricIcon = (method) => {
    switch (method) {
      case 'face':
        return <User className="w-4 h-4" />;
      case 'fingerprint':
        return <Fingerprint className="w-4 h-4" />;
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getBiometricColor = (method) => {
    switch (method) {
      case 'face':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'fingerprint':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'card':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/${path}`;
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Biometric Attendance Portal</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          SuperAdmin-only access to face and fingerprint attendance records
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Biometric Records</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {statistics.total_biometric_attendance}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">With Snapshots</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {statistics.with_snapshots}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Unique Employees</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {statistics.unique_employees}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Methods Used</p>
            {statistics.attendance_by_method.map((item) => (
              <p key={item.biometric_method} className="text-sm text-gray-700 dark:text-gray-300">
                {item.biometric_method}: {item.count}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Biometric Method
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={filters.method}
              onChange={(e) => handleFilterChange('method', e.target.value)}
            >
              <option value="">All Methods</option>
              <option value="face">Face Recognition</option>
              <option value="fingerprint">Fingerprint</option>
              <option value="card">Card</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              &nbsp;
            </label>
            <button
              onClick={fetchBiometricAttendances}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              &nbsp;
            </label>
            <button
              onClick={handleExport}
              className="w-full px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Attendance Table */}
      {!loading && attendances.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Snapshot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {attendances.map((attendance) => (
                  <tr key={attendance.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {attendance.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {attendance.employee?.first_name} {attendance.employee?.last_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {attendance.employee?.employee_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {attendance.check_in}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {attendance.check_out ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {attendance.check_out}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getBiometricColor(
                          attendance.biometric_method
                        )}`}
                      >
                        {getBiometricIcon(attendance.biometric_method)}
                        {attendance.biometric_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attendance.face_snapshot_url ? (
                        <img
                          src={getImageUrl(attendance.face_snapshot_url)}
                          alt="Face Snapshot"
                          className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500"
                          onClick={() => openImageDialog(attendance)}
                        />
                      ) : (
                        <span className="text-sm text-gray-400">No image</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Building2 className="w-4 h-4" />
                        {attendance.device_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        {attendance.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* No Data */}
      {!loading && attendances.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No biometric attendance records found</p>
        </div>
      )}

      {/* Image Dialog */}
      {imageDialogOpen && selectedAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Face Snapshot Details
              </h3>
              <button
                onClick={() => setImageDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {selectedAttendance.face_snapshot_url && (
                    <img
                      src={getImageUrl(selectedAttendance.face_snapshot_url)}
                      alt="Face Snapshot"
                      className="w-full rounded-lg"
                    />
                  )}
                </div>
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Attendance Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong className="text-gray-900 dark:text-white">Employee:</strong>{' '}
                      {selectedAttendance.employee?.first_name} {selectedAttendance.employee?.last_name}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong className="text-gray-900 dark:text-white">Code:</strong>{' '}
                      {selectedAttendance.employee?.employee_code}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong className="text-gray-900 dark:text-white">Date:</strong>{' '}
                      {selectedAttendance.date}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong className="text-gray-900 dark:text-white">Check In:</strong>{' '}
                      {selectedAttendance.check_in}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong className="text-gray-900 dark:text-white">Check Out:</strong>{' '}
                      {selectedAttendance.check_out || 'Not yet'}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong className="text-gray-900 dark:text-white">Method:</strong>{' '}
                      {selectedAttendance.biometric_method}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong className="text-gray-900 dark:text-white">Device:</strong>{' '}
                      {selectedAttendance.device_id}
                    </p>

                    {selectedAttendance.device_metadata && (
                      <div className="mt-4">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Device Metadata
                        </h5>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto max-h-64">
                          {JSON.stringify(selectedAttendance.device_metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end">
              <button
                onClick={() => setImageDialogOpen(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiometricAttendance;
