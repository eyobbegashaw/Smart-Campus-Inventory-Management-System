import React from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiUser, FiMapPin, FiMessageSquare, FiCheckCircle } from 'react-icons/fi';

const RequestCard = ({ request, onStatusUpdate }) => {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    submitted: 'bg-blue-100 text-blue-800',
    reviewing: 'bg-purple-100 text-purple-800',
    approved: 'bg-green-100 text-green-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-gray-500">{request.requestNumber}</span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityColors[request.priority]}`}>
              {request.priority}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mt-1">{request.title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{request.description}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[request.status]}`}>
          {request.status}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-sm text-gray-500">
        <div className="flex items-center">
          <FiUser className="mr-2" size={14} />
          {request.requester?.name || 'Unknown'}
        </div>
        <div className="flex items-center">
          <FiMapPin className="mr-2" size={14} />
          {request.location}
        </div>
        <div className="flex items-center">
          <FiClock className="mr-2" size={14} />
          {new Date(request.createdAt).toLocaleDateString()}
        </div>
        {request.comments?.length > 0 && (
          <div className="flex items-center">
            <FiMessageSquare className="mr-2" size={14} />
            {request.comments.length} comment(s)
          </div>
        )}
      </div>

      <div className="mt-4 flex space-x-2">
        <Link
          to={`/requests/${request._id}`}
          className="flex-1 text-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          View Details
        </Link>
        {request.status !== 'completed' && request.status !== 'rejected' && onStatusUpdate && (
          <select
            onChange={(e) => onStatusUpdate(request._id, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            defaultValue=""
          >
            <option value="" disabled>Update Status</option>
            <option value="reviewing">Start Review</option>
            <option value="in-progress">Start Work</option>
            <option value="completed">Mark Complete</option>
          </select>
        )}
      </div>
    </div>
  );
};

export default RequestCard;