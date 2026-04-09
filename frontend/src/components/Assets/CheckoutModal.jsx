import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiX, FiUser, FiCalendar, FiInfo, FiAlertCircle } from 'react-icons/fi';
import Select from 'react-select';
import axios from 'axios';
import toast from 'react-hot-toast';

const CheckoutModal = ({ isOpen, onClose, onSubmit, asset }) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [condition, setCondition] = useState('Good');

  const watchedReturnDate = watch('expectedReturnDate');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      // Set default return date (14 days from now)
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 14);
      setExpectedReturnDate(defaultDate.toISOString().split('T')[0]);
      setValue('expectedReturnDate', defaultDate.toISOString().split('T')[0]);
      resetForm();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users?role=staff,student&isActive=true`);
      const options = response.data.data.map(user => ({
        value: user._id,
        label: `${user.name} (${user.role} - ${user.email})`,
        ...user
      }));
      setUsers(options);
    } catch (error) {
      console.error('Failed to fetch users', error);
      toast.error('Failed to load users');
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setCondition('Good');
    setValue('purpose', '');
    setValue('notes', '');
  };

  const onSubmitForm = async (data) => {
    if (!selectedUser && !asset?.checkedOutTo) {
      toast.error('Please select a user to check out the asset');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        checkedOutTo: selectedUser?.value,
        expectedReturnDate: data.expectedReturnDate,
        condition: condition,
        purpose: data.purpose,
        notes: data.notes
      });
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to checkout asset');
    } finally {
      setLoading(false);
    }
  };

  const calculateFine = (returnDate) => {
    if (!returnDate) return 0;
    const today = new Date();
    const returnDateObj = new Date(returnDate);
    if (returnDateObj < today) {
      const daysOverdue = Math.ceil((today - returnDateObj) / (1000 * 60 * 60 * 24));
      return daysOverdue * 10; // 10 Birr per day
    }
    return 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Checkout Asset</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition">
            <FiX size={24} />
          </button>
        </div>

        {/* Asset Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Asset Details</p>
          <p className="font-semibold text-gray-900">{asset?.name}</p>
          <p className="text-sm text-gray-600">Tag: {asset?.assetTag}</p>
          {asset?.location && (
            <p className="text-sm text-gray-600">Location: {asset.location}</p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          {/* Checkout To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Checkout To <span className="text-red-500">*</span>
            </label>
            <Select
              options={users}
              onChange={setSelectedUser}
              value={selectedUser}
              placeholder="Search for a user..."
              className="react-select-container"
              classNamePrefix="react-select"
              isClearable
              noOptionsMessage={() => 'No users found'}
            />
            {!selectedUser && (
              <p className="mt-1 text-xs text-gray-500">Select the person checking out this asset</p>
            )}
          </div>

          {/* Expected Return Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Return Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                {...register('expectedReturnDate', { required: 'Expected return date is required' })}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            {errors.expectedReturnDate && (
              <p className="mt-1 text-sm text-red-600">{errors.expectedReturnDate.message}</p>
            )}
            {watchedReturnDate && new Date(watchedReturnDate) < new Date() && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <FiAlertCircle className="mr-1" size={12} />
                Return date is in the past
              </p>
            )}
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="Excellent">Excellent - Like new</option>
              <option value="Good">Good - Normal wear and tear</option>
              <option value="Fair">Fair - Some damage, still functional</option>
              <option value="Poor">Poor - Significant damage, needs repair</option>
            </select>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <textarea
              {...register('purpose')}
              rows="2"
              placeholder="Reason for checkout (e.g., classroom use, research, event)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              {...register('notes')}
              rows="2"
              placeholder="Any special instructions or notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Fine Information */}
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <FiInfo className="text-yellow-600 mt-0.5" size={16} />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Late Return Policy:</p>
                <p className="text-xs mt-1">
                  A fine of ETB 10 per day will be charged for late returns.
                  Please return the asset by the expected date to avoid penalties.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
              disabled={loading || !selectedUser}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="spinner-border h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  import.metaing...
                </>
              ) : (
                'Confirm Checkout'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutModal;