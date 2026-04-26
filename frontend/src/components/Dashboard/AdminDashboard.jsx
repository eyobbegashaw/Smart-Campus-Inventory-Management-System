import React from 'react';
import { 
  FiPackage, 
  FiClipboard, 
  FiBookOpen, 
  FiAlertCircle,
  FiTrendingUp,
  FiUsers,
  FiPrinter,
  FiShoppingCart
} from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ title, value, icon: Icon, color, trend, link }) => (
  <Link to={link} className="block">
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{value?.toLocaleString() || 0}</p>
          {trend && (
            <p className={`text-sm mt-2 flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <FiTrendingUp className="mr-1" size={12} />
              {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
      </div>
    </div>
  </Link>
);

const AdminDashboard = ({ stats }) => {
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
    { name: 'Maintenance', value: stats.assets?.maintenance || 0 },
    { name: 'Retired', value: stats.assets?.retired || 0 }
  ];

  const requestStatusData = [
    { name: 'Submitted', value: stats.requests?.submitted || 0 },
    { name: 'In Progress', value: stats.requests?.inProgress || 0 },
    { name: 'Completed', value: stats.requests?.completed || 0 }
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, Admin!</h1>
        <p className="mt-2 opacity-90">Here's what's happening with your campus today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Assets" 
          value={stats.assets?.total} 
          icon={FiPackage} 
          color="blue"
          trend={12}
          link="/assets"
        />
        <StatCard 
          title="Active Requests" 
          value={stats.requests?.active} 
          icon={FiClipboard} 
          color="orange"
          trend={-5}
          link="/requests"
        />
        <StatCard 
          title="Books in Library" 
          value={stats.library?.totalBooks} 
          icon={FiBookOpen} 
          color="green"
          trend={8}
          link="/library"
        />
        <StatCard 
          title="Total Users" 
          value={stats.users?.total} 
          icon={FiUsers} 
          color="purple"
          trend={15}
          link="/admin"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Distribution</h3>
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

        {/* Request Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Trends (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyRequests || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Requests" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiAlertCircle className="text-red-500 mr-2" />
            Low Stock Alerts
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stats.lowStockItems?.length > 0 ? (
              stats.lowStockItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Current: {item.quantity} {item.unit} | 
                      Min: {item.minimumQuantity} {item.unit}
                    </p>
                  </div>
                  <Link 
                    to={`/inventory`}
                    className="text-red-600 font-semibold text-sm hover:text-red-700"
                  >
                    Reorder
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No low stock items</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stats.recentActivities?.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border-b border-gray-100">
                {activity.type === 'checkout' && <FiTrendingUp className="text-green-500 mt-1" />}
                {activity.type === 'request' && <FiClipboard className="text-blue-500 mt-1" />}
                {activity.type === 'return' && <FiPackage className="text-purple-500 mt-1" />}
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {(!stats.recentActivities || stats.recentActivities.length === 0) && (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/assets/new" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition group">
            <FiPackage size={24} className="text-blue-600 group-hover:scale-110 transition" />
            <span className="mt-2 text-sm font-medium text-gray-900">Add Asset</span>
          </Link>
          <Link to="/requests" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition group">
            <FiClipboard size={24} className="text-green-600 group-hover:scale-110 transition" />
            <span className="mt-2 text-sm font-medium text-gray-900">View Requests</span>
          </Link>
          <Link to="/admin" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition group">
            <FiUsers size={24} className="text-purple-600 group-hover:scale-110 transition" />
            <span className="mt-2 text-sm font-medium text-gray-900">Manage Users</span>
          </Link>
          <Link to="/reports" className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition group">
            <FiPrinter size={24} className="text-orange-600 group-hover:scale-110 transition" />
            <span className="mt-2 text-sm font-medium text-gray-900">Generate Report</span>
          </Link>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiShoppingCart className="mr-2 text-primary-600" />
          Inventory Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{stats.inventory?.totalItems || 0}</p>
            <p className="text-sm text-gray-600">Total Items</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              ETB {(stats.inventory?.totalValue || 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Value</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{stats.inventory?.lowStockCount || 0}</p>
            <p className="text-sm text-gray-600">Low Stock Items</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
