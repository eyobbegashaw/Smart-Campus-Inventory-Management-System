import React, { useState } from 'react';
import { FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const ReturnForm = ({ isOpen, onClose, onSuccess, checkout }) => {
  const [loading, setLoading] = useState(false);
  const [condition, setCondition] = useState('Good');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/library/return/${checkout._id}`, {
        condition,
        notes
      });
      toast.success('Book returned successfully');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to return book');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !checkout) return null;

  const isOverdue = new Date() > new Date(checkout.dueDate);
  const overdueDays = isOverdue ? Math.ceil((new Date() - new Date(checkout.dueDate)) / (1000 * 60 * 60 * 24)) : 0;
  const fine = overdueDays * 5; // 5 Birr per day

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Return Book</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <FiX size={24} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-900">{checkout.bookId?.title}</p>
          <p className="text-sm text-gray-500">by {checkout.bookId?.author}</p>
          <p className="text-xs text-gray-400 mt-1">Due: {new Date(checkout.dueDate).toLocaleDateString()}</p>
        </div>

        {isOverdue && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-start space-x-2">
            <FiAlertCircle className="text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Overdue Notice</p>
              <p className="text-sm text-red-700">
                This book is {overdueDays} day(s) overdue. Fine: ETB {fine}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
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
              Return Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Any issues or additional notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
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
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              <FiCheckCircle className="mr-2" />
              {loading ? 'Processing...' : 'Confirm Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnForm;