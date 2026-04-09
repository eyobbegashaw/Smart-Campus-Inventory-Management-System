import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiMapPin, FiCalendar, FiMessageSquare, FiUpload, FiSend, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import StatusTimeline from './StatusTimeline';
import toast from 'react-hot-toast';

const RequestDetailModal = ({ isOpen, onClose, request, onStatusUpdate, onRefresh }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [localRequest, setLocalRequest] = useState(null);

  useEffect(() => {
    if (isOpen && request) {
      fetchRequestDetails();
    }
  }, [isOpen, request]);

  const fetchRequestDetails = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/requests/${request._id}`);
      setLocalRequest(response.data.data);
      setNewStatus(response.data.data.status);
    } catch (error) {
      console.error('Failed to fetch request details', error);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/requests/${request._id}/comments`, {
        text: comment
      });
      toast.success('Comment added successfully');
      setComment('');
      fetchRequestDetails();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (newStatus === localRequest?.status) return;

    setLoading(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/requests/${request._id}/status`, {
        status: newStatus
      });
      toast.success(`Request status updated to ${newStatus}`);
      fetchRequestDetails();
      if (onStatusUpdate) onStatusUpdate(request._id, newStatus);
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
      setNewStatus(localRequest?.status);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-800',
      reviewing: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen || !localRequest) return null;

  const canUpdateStatus = ['admin', 'staff', 'hod'].includes(user?.role);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-lg bg-white mb-10">
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Request Details</h3>
            <p className="text-sm text-gray-500">Request #{localRequest.requestNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition">
            <FiX size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{localRequest.title}</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{localRequest.description}</p>
              
              <div className="mt-4 flex flex-wrap gap-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(localRequest.priority)}`}>
                  Priority: {localRequest.priority}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(localRequest.status)}`}>
                  Status: {localRequest.status}
                </span>
              </div>
            </div>

            {/* Photos */}
            {localRequest.photos && localRequest.photos.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <FiUpload className="mr-2" size={16} />
                  Attached Photos
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {localRequest.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={`${import.meta.env.REACT_APP_API_URL}${photo}`}
                      alt={`Request photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                      onClick={() => window.open(`${import.meta.env.VITE_API_URL}${photo}`, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FiMessageSquare className="mr-2" size={16} />
                Comments ({localRequest.comments?.length || 0})
              </h4>
              
              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {localRequest.comments && localRequest.comments.length > 0 ? (
                  localRequest.comments.map((comment, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 text-xs font-semibold">
                              {comment.userId?.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <span className="font-medium text-sm text-gray-900">
                            {comment.userId?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {comment.userId?.role}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2 ml-8">{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No comments yet</p>
                )}
              </div>

              {/* Add Comment */}
              <div className="flex space-x-2">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows="2"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={handleAddComment}
                  disabled={loading || !comment.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  <FiSend size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Timeline */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Progress Timeline</h4>
              <StatusTimeline request={localRequest} />
            </div>

            {/* Details */}
            <div className="bg-white border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-900 mb-2">Request Details</h4>
              
              <div className="flex items-start space-x-2 text-sm">
                <FiUser className="text-gray-400 mt-0.5" size={14} />
                <div>
                  <p className="text-gray-500">Requested by</p>
                  <p className="font-medium text-gray-900">{localRequest.requester?.name}</p>
                  <p className="text-xs text-gray-500">{localRequest.requester?.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2 text-sm">
                <FiMapPin className="text-gray-400 mt-0.5" size={14} />
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">{localRequest.location}</p>
                  {localRequest.building && <p className="text-xs text-gray-500">Building: {localRequest.building}</p>}
                  {localRequest.room && <p className="text-xs text-gray-500">Room: {localRequest.room}</p>}
                </div>
              </div>

              <div className="flex items-start space-x-2 text-sm">
                <FiCalendar className="text-gray-400 mt-0.5" size={14} />
                <div>
                  <p className="text-gray-500">Submitted</p>
                  <p className="font-medium text-gray-900">
                    {new Date(localRequest.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {localRequest.assignedTo && (
                <div className="flex items-start space-x-2 text-sm">
                  <FiUser className="text-gray-400 mt-0.5" size={14} />
                  <div>
                    <p className="text-gray-500">Assigned to</p>
                    <p className="font-medium text-gray-900">{localRequest.assignedTo?.name}</p>
                  </div>
                </div>
              )}

              {localRequest.completedAt && (
                <div className="flex items-start space-x-2 text-sm">
                  <FiCheckCircle className="text-green-500 mt-0.5" size={14} />
                  <div>
                    <p className="text-gray-500">Completed</p>
                    <p className="font-medium text-gray-900">
                      {new Date(localRequest.completedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Status Update (Staff/Admin only) */}
            {canUpdateStatus && localRequest.status !== 'completed' && localRequest.status !== 'rejected' && (
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Update Status</h4>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                >
                  <option value="submitted">Submitted</option>
                  <option value="reviewing">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
                {newStatus !== localRequest.status && (
                  <button
                    onClick={handleStatusChange}
                    disabled={loading}
                    className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Update Status
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailModal;
