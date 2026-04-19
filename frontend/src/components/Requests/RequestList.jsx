
import React, { useState } from 'react';
import { FiSearch, FiFilter, FiGrid, FiList } from 'react-icons/fi';
import RequestCard from './RequestCard';

const RequestList = ({ requests, loading, onStatusUpdate }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: ''
  });

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filters.status || request.status === filters.status;
    const matchesPriority = !filters.priority || request.priority === filters.priority;
    const matchesCategory = !filters.category || request.category === filters.category;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const statuses = [...new Set(requests.map(r => r.status))];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const categories = [...new Set(requests.map(r => r.category))];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Priority</option>
            {priorities.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
            >
              <FiGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
            >
              <FiList size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Requests Display */}
      {filteredRequests.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request._id}
                request={request}
                onStatusUpdate={onStatusUpdate}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request._id}
                request={request}
                onStatusUpdate={onStatusUpdate}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FiSearch className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-500">No requests found</p>
        </div>
      )}
    </div>
  );
};

export default RequestList;
