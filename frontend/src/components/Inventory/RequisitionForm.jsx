import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { FiX, FiPlus, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import axios from 'axios';
import Select from 'react-select';
import toast from 'react-hot-toast';

const RequisitionForm = ({ isOpen, onClose, onSuccess }) => {
  const { register, control, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      items: [{ name: '', quantity: 1, estimatedPrice: 0 }]
    }
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchInventoryItems();
    }
  }, [isOpen]);

  const fetchInventoryItems = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/inventory`);
      const options = response.data.data.map(item => ({
        value: item._id,
        label: `${item.name} (${item.quantity} ${item.unit} available)`,
        item: item
      }));
      setInventoryItems(options);
    } catch (error) {
      toast.error('Failed to fetch inventory items');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const requisitionData = {
        items: data.items.map(item => ({
          inventoryItemId: item.inventoryItemId,
          name: item.name,
          quantity: parseInt(item.quantity),
          estimatedPrice: parseFloat(item.estimatedPrice) || 0
        })),
        purpose: data.purpose
      };
      
      await axios.post(`${process.env.REACT_APP_API_URL}/inventory/requisitions`, requisitionData);
      toast.success('Requisition submitted successfully');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit requisition');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (index, selectedOption) => {
    if (selectedOption) {
      setValue(`items.${index}.inventoryItemId`, selectedOption.value);
      setValue(`items.${index}.name`, selectedOption.item.name);
      setValue(`items.${index}.unit`, selectedOption.item.unit);
      setSelectedItems(prev => ({ ...prev, [index]: selectedOption }));
    } else {
      setValue(`items.${index}.inventoryItemId`, '');
      setValue(`items.${index}.name`, '');
      setSelectedItems(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <FiShoppingCart className="text-primary-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">New Requisition</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('purpose', { required: 'Purpose is required' })}
              rows="3"
              placeholder="Reason for requisition..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.purpose && <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Items <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-[200px]">
                    <Select
                      options={inventoryItems}
                      onChange={(option) => handleItemSelect(index, option)}
                      placeholder="Select item..."
                      className="react-select-container"
                      classNamePrefix="react-select"
                      value={selectedItems[index]}
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      {...register(`items.${index}.quantity`, {
                        required: 'Quantity required',
                        min: { value: 1, message: 'Min 1' }
                      })}
                      placeholder="Qty"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.estimatedPrice`)}
                      placeholder="Price"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => append({ name: '', quantity: 1, estimatedPrice: 0 })}
              className="mt-2 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
            >
              <FiPlus className="mr-1" size={14} />
              Add Item
            </button>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ Requisitions will be reviewed by your department head and finance team.
              You will be notified once approved.
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
              {loading ? 'Submitting...' : 'Submit Requisition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequisitionForm;