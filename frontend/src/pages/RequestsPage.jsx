import React, { useState, useEffect } from 'react';
import { FiPlus, FiFilter, FiSearch, FiEye } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../components/Common/Header';
import Sidebar from '../components/Common/Sidebar';
import RequestList from '../components/Requests/RequestList';
import RequestForm from '../components/Requests/RequestForm';
import RequestDetailModal from '../components/Requests/RequestDetailModal';
import { useAuth } from '../contexts/AuthContext';

const RequestsPage = () => {
  const { user, isStudent, isStaff, isHod, isAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchRequests();
    if (!isStudent) {
      fetchStats();
    }
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/requests`);
      setRequests(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/requests/stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/requests/${requestId}/status`, {
        status: newStatus
      });
      toast.success(`Request status updated to ${newStatus}`);
      fetchRequests();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowDetail(true);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
                <p className="text-gray-600 mt-1">
                  {isStudent && 'Submit and track your maintenance requests'}
                  {isStaff && 'Manage requests assigned to you'}
                  {isHod && 'Review and approve department requests'}
                  {isAdmin && 'Manage all campus service requests'}
                </p>
              </div>
              {isStudent && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <FiPlus className="mr-2" />
                  New Request
                </button>
              )}
            </div>

            {/* Statistics Cards */}
            {stats && !isStudent && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                <div className="bg-white rounded-lg shadow p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.status?.find(s => s._id === 'submitted')?.count || 0}</p>
                  <p className="text-xs text-gray-600">Submitted</p>
                </div>
                <div className="bg-white rounded-lg shadow p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.status?.find(s => s._id === 'reviewing')?.count || 0}</p>
                  <p className="text-xs text-gray-600">Reviewing</p>
                </div>
                <div className="bg-white rounded-lg shadow p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.status?.find(s => s._id === 'in-progress')?.count || 0}</p>
                  <p className="text-xs text-gray-600">In Progress</p>
                </div>
                <div className="bg-white rounded-lg shadow p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.status?.find(s => s._id === 'completed')?.count || 0}</p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
                <div className="bg-white rounded-lg shadow p-3 text-center">
                  <p className="text-2xl font-bold text-gray-600">{stats.averageCompletionTime || 'N/A'}</p>
                  <p className="text-xs text-gray-600">Avg. Completion</p>
                </div>
              </div>
            )}
          </div>

          <RequestList
            requests={requests}
            loading={loading}
            onStatusUpdate={!isStudent ? handleStatusUpdate : null}
            onViewRequest={handleViewRequest}
          />
        </main>
      </div>

      <RequestForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => {
          fetchRequests();
          if (!isStudent) fetchStats();
        }}
      />

      <RequestDetailModal
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onStatusUpdate={!isStudent ? handleStatusUpdate : null}
        onRefresh={() => {
          fetchRequests();
          fetchStats();
        }}
      />
    </div>
  );
};

export default RequestsPage;