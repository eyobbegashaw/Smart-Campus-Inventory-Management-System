import React from 'react';
import { 
  FiClipboard, 
  FiCheckCircle, 
  FiClock,
  FiUserCheck,
  FiAlertCircle
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const StaffDashboard = ({ stats }) => {
  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }



  return (
    <div className="space-y-6 fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome, Staff Member!</h1>
        <p className="mt-2 opacity-90">Manage and track service requests assigned to you.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned Requests</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">{stats.requests?.assigned || 0}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <FiUserCheck className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">{stats.requests?.inProgress || 0}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100">
              <FiClock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">{stats.requests?.completed || 0}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <FiCheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* My Tasks */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Tasks</h3>
        <div className="space-y-3">
          {stats.myTasks?.map((task, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full status-${task.status}`}>
                    {task.status}
                  </span>
                  <p className="font-medium text-gray-900">{task.title}</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Request #{task.requestNumber}</p>
                <p className="text-sm text-gray-500">Location: {task.location}</p>
              </div>
              <div className="flex space-x-2">
                <Link
                  to={`/requests/${task._id}`}
                  className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
                >
                  Update
                </Link>
              </div>
            </div>
          ))}
          {(!stats.myTasks || stats.myTasks.length === 0) && (
            <p className="text-gray-500 text-center py-8">No tasks assigned</p>
          )}
        </div>
      </div>

      {/* Recent Completed */}
      {stats.recentCompleted && stats.recentCompleted.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Completed</h3>
          <div className="space-y-2">
            {stats.recentCompleted.map((task, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="text-sm text-gray-500">Completed: {new Date(task.completedAt).toLocaleDateString()}</p>
                </div>
                <FiCheckCircle className="text-green-500" size={20} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
