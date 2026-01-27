import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Users,
  Smartphone,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  Link2,
  Unlink,
  ArrowRight,
  Loader2,
} from 'lucide-react';

const DeviceMapping = () => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [detectedUsers, setDetectedUsers] = useState([]);
  const [unmappedEmployees, setUnmappedEmployees] = useState([]);
  const [mappedEmployees, setMappedEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDeviceUser, setSelectedDeviceUser] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStatistics(),
        fetchSuggestions(),
        fetchDetectedUsers(),
        fetchUnmappedEmployees(),
        fetchMappedEmployees(),
      ]);
    } catch (error) {
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/superadmin/device-mapping/statistics');
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await api.get('/superadmin/device-mapping/suggestions');
      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const fetchDetectedUsers = async () => {
    try {
      const response = await api.get('/superadmin/device-mapping/detected-users');
      setDetectedUsers(response.data.device_users);
    } catch (error) {
      console.error('Failed to fetch detected users:', error);
    }
  };

  const fetchUnmappedEmployees = async () => {
    try {
      const response = await api.get('/superadmin/device-mapping/unmapped-employees');
      setUnmappedEmployees(response.data.employees);
    } catch (error) {
      console.error('Failed to fetch unmapped employees:', error);
    }
  };

  const fetchMappedEmployees = async () => {
    try {
      const response = await api.get('/superadmin/device-mapping/mapped-employees');
      setMappedEmployees(response.data.employees);
    } catch (error) {
      console.error('Failed to fetch mapped employees:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSingleMapping = async () => {
    if (!selectedEmployee || !selectedDeviceUser) {
      showMessage('error', 'Please select both employee and device user');
      return;
    }

    setProcessing(true);
    try {
      await api.post('/superadmin/device-mapping/map', {
        employee_id: selectedEmployee,
        device_user_id: selectedDeviceUser,
      });
      showMessage('success', 'Employee mapped successfully');
      setSelectedEmployee('');
      setSelectedDeviceUser('');
      fetchAllData();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to map employee');
    } finally {
      setProcessing(false);
    }
  };

  const handleApplySuggestion = async (suggestion) => {
    setProcessing(true);
    try {
      await api.post('/superadmin/device-mapping/map', {
        employee_id: suggestion.employee_id,
        device_user_id: suggestion.device_user_id,
      });
      showMessage('success', `Mapped ${suggestion.employee_name} successfully`);
      fetchAllData();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to apply suggestion');
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyAllHighConfidence = async () => {
    const highConfidenceSuggestions = suggestions.filter((s) => s.auto_apply);
    if (highConfidenceSuggestions.length === 0) {
      showMessage('error', 'No high confidence suggestions available');
      return;
    }

    setProcessing(true);
    try {
      const mappings = highConfidenceSuggestions.map((s) => ({
        employee_id: s.employee_id,
        device_user_id: s.device_user_id,
      }));
      
      const response = await api.post('/superadmin/device-mapping/bulk-map', { mappings });
      showMessage('success', `${response.data.results.success.length} employees mapped successfully`);
      fetchAllData();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to apply bulk mapping');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnmap = async (employeeId) => {
    if (!window.confirm('Are you sure you want to remove this mapping?')) return;

    setProcessing(true);
    try {
      await api.delete(`/superadmin/device-mapping/unmap/${employeeId}`);
      showMessage('success', 'Mapping removed successfully');
      fetchAllData();
    } catch (error) {
      showMessage('error', 'Failed to remove mapping');
    } finally {
      setProcessing(false);
    }
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 80) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">High {confidence}%</span>;
    } else if (confidence >= 60) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Medium {confidence}%</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Low {confidence}%</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-600 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading device mapping data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Device Mapping</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automated biometric device user ID mapping for employees
          </p>
        </div>
        <button
          onClick={fetchAllData}
          disabled={processing}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {statistics.total_employees}
                </p>
              </div>
              <Users className="w-12 h-12 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Mapped</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {statistics.mapped_employees}
                </p>
                <p className="text-xs text-gray-500 mt-1">{statistics.mapping_percentage}%</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Detected Devices</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {statistics.total_device_users}
                </p>
              </div>
              <Smartphone className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unmapped Devices</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                  {statistics.unmapped_device_users}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900 dark:to-indigo-900 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI-Powered Suggestions
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {suggestions.filter(s => s.auto_apply).length} high confidence matches found
                </p>
              </div>
            </div>
            <button
              onClick={handleApplyAllHighConfidence}
              disabled={processing || suggestions.filter(s => s.auto_apply).length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Apply All High Confidence
            </button>
          </div>

          <div className="space-y-3">
            {suggestions.slice(0, 10).map((suggestion, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {suggestion.employee_code}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      Device #{suggestion.device_user_id}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {suggestion.employee_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getConfidenceBadge(suggestion.confidence)}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.reasons[0]}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleApplySuggestion(suggestion)}
                  disabled={processing}
                  className="ml-4 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Mapping Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Link2 className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manual Mapping</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Choose employee...</option>
              {unmappedEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employee_code} - {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Device User ID
            </label>
            <select
              value={selectedDeviceUser}
              onChange={(e) => setSelectedDeviceUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Choose device user...</option>
              {detectedUsers
                .filter((u) => !u.mapped_to)
                .map((user) => (
                  <option key={user.device_user_id} value={user.device_user_id}>
                    Device #{user.device_user_id} ({user.event_count} events)
                  </option>
                ))}
            </select>
          </div>

          <button
            onClick={handleSingleMapping}
            disabled={processing || !selectedEmployee || !selectedDeviceUser}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Link2 className="w-4 h-4" />
            Map Employee
          </button>
        </div>
      </div>

      {/* Mapped Employees Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Mapped Employees ({mappedEmployees.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Employee Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Device User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {mappedEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {emp.employee_code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {emp.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {emp.department}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {emp.device_user_id}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleUnmap(emp.id)}
                      disabled={processing}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Unlink className="w-4 h-4" />
                      Unmap
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {mappedEmployees.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No mapped employees yet. Start mapping above!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceMapping;
