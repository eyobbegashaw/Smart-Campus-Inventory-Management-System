import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiX, FiMail, FiLock, FiUser, FiPhone, FiBriefcase } from 'react-icons/fi';
import Select from 'react-select';
import axios from 'axios';
import toast from 'react-hot-toast';

const UserModal = ({ isOpen, onClose, onSubmit, initialData, isEditing = false }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm();
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const selectedRole = watch('role');

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      if (initialData) {
        populateForm();
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/departments`);
      const options = response.data.data.map(dept => ({
        value: dept._id,
        label: `${dept.name} ${dept.nameAm ? `(${dept.nameAm})` : ''}`,
        ...dept
      }));
      setDepartments(options);
    } catch (error) {
      console.error('Failed to fetch departments', error);
    }
  };

  const populateForm = () => {
    setValue('name', initialData.name);
    setValue('email', initialData.email);
    setValue('role', initialData.role);
    setValue('phone', initialData.phone);
    setValue('employeeId', initialData.employeeId);
    setValue('studentId', initialData.studentId);
    setValue('isActive', initialData.isActive);
    
    if (initialData.department) {
      const department = departments.find(d => d.value === initialData.department._id);
      if (department) {
        setSelectedDepartment(department);
        setValue('department', department.value);
      }
    }
  };

  const resetForm = () => {
    reset({
      name: '',
      email: '',
      password: '',
      role: 'student',
      phone: '',
      employeeId: '',
      studentId: '',
      department: '',
      isActive: true
    });
    setSelectedDepartment(null);
    setShowPassword(false);
  };

  const onSubmitForm = async (data) => {
    setLoading(true);
    try {
      const formData = {
        ...data,
        department: selectedDepartment?.value,
        isActive: data.isActive === true || data.isActive === 'true'
      };
      
      // Remove password if not provided (for edits)
      if (isEditing && !formData.password) {
        delete formData.password;
      }
      
      await onSubmit(formData);
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'admin', label: '👑 Administrator', description: 'Full system access' },
    { value: 'hod', label: '📚 Department Head', description: 'Manage department assets and requests' },
    { value: 'staff', label: '👨‍💼 Staff', description: 'import.meta requests and manage checkouts' },
    { value: 'student', label: '👨‍🎓 Student', description: 'Submit requests and borrow books' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit User' : 'Add New User'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  placeholder="Full name"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  placeholder="user@campus.edu"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            {/* Password (only for new users or when changing) */}
            {(!isEditing || showPassword) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {!isEditing && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    {...register('password', { 
                      required: !isEditing ? 'Password is required' : false,
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                {isEditing && !showPassword && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(true)}
                    className="mt-1 text-xs text-primary-600 hover:text-primary-700"
                  >
                    Change password
                  </button>
                )}
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>
            )}

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                {...register('role', { required: 'Role is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {roleOptions.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {selectedRole && (
                <p className="mt-1 text-xs text-gray-500">
                  {roleOptions.find(r => r.value === selectedRole)?.description}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="0912345678"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Employee ID (for staff/HOD) */}
            {(selectedRole === 'staff' || selectedRole === 'hod') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID
                </label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    {...register('employeeId')}
                    type="text"
                    placeholder="EMP001"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            )}

            {/* Student ID (for students) */}
            {selectedRole === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student ID
                </label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    {...register('studentId')}
                    type="text"
                    placeholder="STU001"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            )}

            {/* Department (for non-admin users) */}
            {selectedRole !== 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <Select
                  options={departments}
                  onChange={setSelectedDepartment}
                  value={selectedDepartment}
                  placeholder="Select department..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isClearable
                />
              </div>
            )}

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <input
                {...register('isActive')}
                type="checkbox"
                id="isActive"
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active Account
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ New users will receive a welcome email with login instructions.
              {isEditing && ' Leave password blank to keep current password.'}
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
