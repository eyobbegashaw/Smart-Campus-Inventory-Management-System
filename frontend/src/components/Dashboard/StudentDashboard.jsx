
import React, { useState } from 'react';
import { 
  FiClipboard, 
  FiCheckCircle, 
  FiClock,
  FiPlus,
  FiBookOpen
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import RequestForm from '../Requests/RequestForm';

const StudentDashboard = ({ stats, onRequestSubmit }) => {
  const [showRequestForm, setShowRequestForm] = useState(false);

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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome, Student!</h1>
        <p className="mt-2 opacity-90">Submit service requests and track their status easily.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setShowRequestForm(true)}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-center group"
        >
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-full bg-blue-100 group-hover:bg-blue-200 transition">
              <FiPlus className="text-blue-600" size={32} />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-900">Submit New Request</h3>
            <p className="text-sm text-gray-500 mt-1">Report maintenance or IT issues</p>
          </div>
        </button>

        <Link to="/library" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-center group">
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-full bg-green-100 group-hover:bg-green-200 transition">
              <FiBookOpen className="text-green-600" size={32} />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-900">Browse Library</h3>
            <p className="text-sm text-gray-500 mt-1">Search and borrow books</p>
          </div>
        </Link>
      </div>

      {/* My Requests Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">{stats.requests?.total || 0}</p>
            </div>
            <div className="p-3 rounded-full bg-gray-100">
              <FiClipboard className="text-gray-600" size={24} />
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

      {/* Recent Requests */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">My Recent Requests</h3>
          <Link to="/requests" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {stats.recentRequests?.slice(0, 5).map((request, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{request.title}</p>
                <p className="text-sm text-gray-500 mt-1">Request #{request.requestNumber}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(request.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 text-xs font-medium rounded-full status-${request.status}`}>
                  {request.status}
                </span>
                {request.status === 'completed' && request.resolution && (
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">{request.resolution}</p>
                )}
              </div>
            </div>
          ))}
          {(!stats.recentRequests || stats.recentRequests.length === 0) && (
            <p className="text-gray-500 text-center py-8">No requests submitted yet</p>
          )}
        </div>
      </div>

      {/* Request Form Modal */}
      {showRequestForm && (
        <RequestForm
          onClose={() => setShowRequestForm(false)}
          onSuccess={() => {
            setShowRequestForm(false);
            if (onRequestSubmit) onRequestSubmit();
          }}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
