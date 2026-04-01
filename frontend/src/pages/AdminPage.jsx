import React, { useState, useEffect } from 'react';
import { FiUsers, FiUserPlus, FiEdit2, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../components/Common/Header';
import Sidebar from '../components/Common/Sidebar';
import DataTable from '../components/Common/DataTable';
import UserModal from '../components/Admin/UserModal';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/users`);
      setUsers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/users`, userData);
      toast.success('User created successfully');
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/users/${editingUser._id}`, userData);
      toast.success('User updated successfully');
      fetchUsers();
      setShowModal(false);
      setEditingUser(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/users/${userId}`);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const columns = [
    { Header: 'Name', accessor: 'name' },
    { Header: 'Email', accessor: 'email' },
    { 
      Header: 'Role', 
      accessor: 'role',
      Cell: ({ value }) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'admin' ? 'bg-purple-100 text-purple-800' :
          value === 'hod' ? 'bg-blue-100 text-blue-800' :
          value === 'staff' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value.toUpperCase()}
        </span>
      )
    },
    { Header: 'Department', accessor: 'department.name' },
    { 
      Header: 'Status', 
      accessor: 'isActive',
      Cell: ({ value }) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      Header: 'Actions',
      accessor: 'actions',
      Cell: ({ row }) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setEditingUser(row.original);
              setShowModal(true);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <FiEdit2 size={18} />
          </button>
          <button
            onClick={() => handleDeleteUser(row.original._id)}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-1">Manage system users and their roles</p>
              </div>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setShowModal(true);
                }}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <FiUserPlus className="mr-2" />
                Add User
              </button>
            </div>

            {/* Filters */}
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="hod">Department Head</option>
                <option value="staff">Staff</option>
                <option value="student">Student</option>
              </select>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredUsers}
            loading={loading}
          />

          {/* Statistics */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
                <FiUsers className="text-primary-600" size={24} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.role === 'student').length}
                  </p>
                </div>
                <FiUsers className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Staff</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.role === 'staff').length}
                  </p>
                </div>
                <FiUsers className="text-green-600" size={24} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Department Heads</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.role === 'hod').length}
                  </p>
                </div>
                <FiUsers className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </main>
      </div>

      <UserModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingUser(null);
        }}
        onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
        initialData={editingUser}
        isEditing={!!editingUser}
      />
    </div>
  );
};

export default AdminPage;