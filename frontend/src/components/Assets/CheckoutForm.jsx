
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiX, FiCalendar, FiUser } from 'react-icons/fi';
import axios from 'axios';
import Select from 'react-select';

const CheckoutForm = ({ isOpen, onClose, onSubmit, asset }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users?role=staff,student`);
      const userOptions = response.data.data.map(user => ({
        value: user._id,
        label: `${user.name} (${user.role} - ${user.email})`
      }));
      setUsers(userOptions);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const onSubmitForm = async (data) => {
    setLoading(true);
    await onSubmit({
      ...data,
      checkedOutTo: selectedUser?.value || data.checkedOutTo
    });
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Checkout Asset</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <FiX size={24} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-900">{asset?.name}</p>
          <p className="text-sm text-gray-500">{asset?.assetTag}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Checkout To <span className="text-red-500">*</span>
            </label>
            <Select
              options={users}
              onChange={setSelectedUser}
              placeholder="Search user..."
              className="react-select-container"
              classNamePrefix="react-select"
              isClearable
            />
            <p className="mt-1 text-xs text-gray-500">Select the person checking out this asset</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Return Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                {...register('expectedReturnDate', { required: 'Expected return date is required' })}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            {errors.expectedReturnDate && (
              <p className="mt-1 text-sm text-red-600">{errors.expectedReturnDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition
            </label>
            <select
              {...register('condition')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose / Notes
            </label>
            <textarea
              {...register('purpose')}
              rows="3"
              placeholder="Reason for checkout..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Please ensure the asset is returned by the expected date to avoid penalties.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'import.metaing...' : 'Confirm Checkout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutForm;
