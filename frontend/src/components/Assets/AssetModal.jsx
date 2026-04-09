import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiX, FiUpload, FiDollarSign, FiTag, FiMapPin, FiCalendar, FiHash } from 'react-icons/fi';
import Select from 'react-select';
import axios from 'axios';
import toast from 'react-hot-toast';

const AssetModal = ({ isOpen, onClose, onSubmit, initialData, isEditing = false }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm();
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);

  const watchStatus = watch('status');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchDepartments();
      if (initialData) {
        populateForm();
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/assets/categories`);
      const options = response.data.data.map(cat => ({
        value: cat._id,
        label: `${cat.name} ${cat.nameAm ? `(${cat.nameAm})` : ''}`,
        ...cat
      }));
      setCategories(options);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

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
    setValue('assetTag', initialData.assetTag);
    setValue('description', initialData.description);
    setValue('serialNumber', initialData.serialNumber);
    setValue('manufacturer', initialData.manufacturer);
    setValue('model', initialData.model);
    setValue('location', initialData.location);
    setValue('status', initialData.status);
    setValue('purchaseDate', initialData.purchaseDate ? initialData.purchaseDate.split('T')[0] : '');
    setValue('purchasePrice', initialData.purchasePrice);
    setValue('notes', initialData.notes);
    
    if (initialData.category) {
      const category = categories.find(c => c.value === initialData.category._id);
      if (category) {
        setSelectedCategory(category);
        setValue('category', category.value);
      }
    }
    
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
      assetTag: '',
      description: '',
      serialNumber: '',
      manufacturer: '',
      model: '',
      location: '',
      status: 'available',
      purchaseDate: '',
      purchasePrice: '',
      notes: ''
    });
    setSelectedCategory(null);
    setSelectedDepartment(null);
    setQrPreview(null);
  };

  const onSubmitForm = async (data) => {
    setLoading(true);
    try {
      const formData = {
        ...data,
        category: selectedCategory?.value,
        department: selectedDepartment?.value,
        purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : undefined,
        status: data.status || 'available'
      };
      
      await onSubmit(formData);
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  const generateAssetTag = () => {
    const prefix = selectedCategory?.code || 'AST';
    const timestamp = Date.now().toString().slice(-6);
    const newTag = `${prefix}-${timestamp}`;
    setValue('assetTag', newTag);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-lg bg-white mb-10">
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Asset' : 'Add New Asset'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Asset Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', { required: 'Asset name is required' })}
                type="text"
                placeholder="e.g., Dell XPS Laptop"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            {/* Asset Tag */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Tag
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    {...register('assetTag')}
                    type="text"
                    placeholder="Auto-generated"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={generateAssetTag}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  Generate
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <Select
                options={categories}
                onChange={setSelectedCategory}
                value={selectedCategory}
                placeholder="Select category..."
                className="react-select-container"
                classNamePrefix="react-select"
                isClearable
              />
              {!selectedCategory && <p className="mt-1 text-sm text-red-600">Category is required</p>}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department <span className="text-red-500">*</span>
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
              {!selectedDepartment && <p className="mt-1 text-sm text-red-600">Department is required</p>}
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number
              </label>
              <div className="relative">
                <FiHash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('serialNumber')}
                  type="text"
                  placeholder="Serial number"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="available">Available</option>
                <option value="checked-out">Checked Out</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer
              </label>
              <input
                {...register('manufacturer')}
                type="text"
                placeholder="e.g., Dell, HP, Lenovo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                {...register('model')}
                type="text"
                placeholder="Model number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('location')}
                  type="text"
                  placeholder="e.g., Room 204, CS Building"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('purchaseDate')}
                  type="date"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Purchase Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price (ETB)
              </label>
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('purchasePrice')}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows="3"
              placeholder="Detailed description of the asset..."
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
              placeholder="Any additional information..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ After creating the asset, you'll be able to generate a QR code for printing and attaching to the physical asset.
              QR codes can be scanned to quickly access asset information and checkout functionality.
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
              disabled={loading || !selectedCategory || !selectedDepartment}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Asset' : 'Create Asset')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetModal;