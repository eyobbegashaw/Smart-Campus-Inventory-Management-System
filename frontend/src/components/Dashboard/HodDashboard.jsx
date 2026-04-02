import React from 'react';
import { 
  FiPackage, 
  FiClipboard, 
  FiAlertCircle,
  FiTrendingUp,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const HodDashboard = ({ stats }) => {
  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  const assetStatusData = [
    { name: 'Available', value: stats.assets?.available || 0 },
    { name: 'Checked Out', value: stats.assets?.checkedOut || 0 },
    { name: 'Maintenance', value: stats.assets?.maintenance || 0 }
  ];

  const requestData = [
    { name: 'Pending', value: stats.requests?.submitted || 0 },
    { name: 'In Progress', value: stats.requests?.inProgress || 0 },
    { name: 'Completed', value: stats.requests?.completed || 0 }
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome, Department Head!</h1>
        <p className="mt-2 opacity-90">Manage your department's assets and requests efficiently.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Department Assets</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">{stats.assets?.total || 0}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <FiPackage className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Requests</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">{stats.requests?.active || 0}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <FiClipboard className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {stats.requests?.total ? 
                  Math.round((stats.requests.completed / stats.requests.total) * 100) : 0}%
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <FiCheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={assetStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {assetStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={requestData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" name="Requests" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Service Requests</h3>
        <div className="space-y-3">
          {stats.recentRequests?.slice(0, 5).map((request, index) => (
            <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                {request.status === 'submitted' && <FiClock className="text-yellow-500" />}
                {request.status === 'in-progress' && <FiTrendingUp className="text-blue-500" />}
                {request.status === 'completed' && <FiCheckCircle className="text-green-500" />}
                <div>
                  <p className="font-medium text-gray-900">{request.title}</p>
                  <p className="text-sm text-gray-500">Request #{request.requestNumber}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full status-${request.status}`}>
                {request.status}
              </span>
            </div>
          ))}
          {(!stats.recentRequests || stats.recentRequests.length === 0) && (
            <p className="text-gray-500 text-center py-4">No recent requests</p>
          )}
        </div>
        <div className="mt-4 text-center">
          <Link to="/requests" className="text-primary-600 hover:text-primary-700 font-medium">
            View All Requests →
          </Link>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {stats.lowStockItems && stats.lowStockItems.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiAlertCircle className="text-red-500 mr-2" />
            Low Stock Alerts
          </h3>
          <div className="space-y-3">
            {stats.lowStockItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">Current: {item.quantity} {item.unit}</p>
                </div>
                <button className="text-red-600 font-semibold text-sm hover:text-red-700">
                  Request Reorder
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HodDashboard;
