import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiX, FiTag, FiMapPin, FiDollarSign, FiPackage, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const InventoryForm = ({ isOpen, onClose, onSubmit, initialData, isEditing = false }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');


  const watchQuantity = watch('quantity');
  const watchMinQuantity = watch('minimumQuantity');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        populateForm();
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const populateForm = () => {
    setValue('name', initialData.name);
    setValue('nameAm', initialData.nameAm);
    setValue('sku', initialData.sku);
    setValue('category', initialData.category);
    setValue('quantity', initialData.quantity);
    setValue('unit', initialData.unit);
    setValue('minimumQuantity', initialData.minimumQuantity);
    setValue('maximumQuantity', initialData.maximumQuantity);
    setValue('reorderQuantity', initialData.reorderQuantity);
    setValue('location', initialData.location);
    setValue('shelf', initialData.shelf);
    setValue('supplier', initialData.supplier);
    setValue('supplierContact', initialData.supplierContact);
    setValue('unitPrice', initialData.unitPrice);
    setValue('notes', initialData.notes);
    setSelectedCategory(initialData.category);
  };

  const resetForm = () => {
    reset({
      name: '',
      nameAm: '',
      sku: '',
      category: '',
      quantity: 0,
      unit: 'pieces',
      minimumQuantity: 10,
      maximumQuantity: '',
      reorderQuantity: '',
      location: '',
      shelf: '',
      supplier: '',
      supplierContact: '',
      unitPrice: '',
      notes: ''
    });
    setSelectedCategory('');
  };

  const generateSKU = () => {
    const categoryCode = selectedCategory ? selectedCategory.substring(0, 3).toUpperCase() : 'ITM';
    const timestamp = Date.now().toString().slice(-6);
    const newSKU = `${categoryCode}-${timestamp}`;
    setValue('sku', newSKU);
  };

  const onSubmitForm = async (data) => {
    setLoading(true);
    try {
      const formData = {
        ...data,
        quantity: parseInt(data.quantity),
        minimumQuantity: parseInt(data.minimumQuantity),
        maximumQuantity: data.maximumQuantity ? parseInt(data.maximumQuantity) : undefined,
        reorderQuantity: data.reorderQuantity ? parseInt(data.reorderQuantity) : undefined,
        unitPrice: data.unitPrice ? parseFloat(data.unitPrice) : undefined
      };
      
      await onSubmit(formData);
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save inventory item');
    } finally {
      setLoading(false);
    }
  };

  const isLowStock = watchQuantity !== undefined && watchMinQuantity !== undefined && 
    parseInt(watchQuantity) <= parseInt(watchMinQuantity);

  const categories = [
    { value: 'Stationery', label: '📄 Stationery', description: 'Paper, pens, notebooks, etc.' },
    { value: 'Cleaning', label: '🧹 Cleaning', description: 'Detergents, sanitizers, cleaning supplies' },
    { value: 'Lab Supplies', label: '🔬 Lab Supplies', description: 'Chemicals, glassware, equipment' },
    { value: 'Cafe Supplies', label: '☕ Cafe Supplies', description: 'Coffee, sugar, cups, utensils' },
    { value: 'Maintenance', label: '🔧 Maintenance', description: 'Tools, spare parts, repair items' },
    { value: 'IT Supplies', label: '💻 IT Supplies', description: 'Cables, drives, accessories' },
    { value: 'Other', label: '📦 Other', description: 'Miscellaneous items' }
  ];

  const units = [
    { value: 'pieces', label: 'Pieces' },
    { value: 'boxes', label: 'Boxes' },
    { value: 'packs', label: 'Packs' },
    { value: 'liters', label: 'Liters' },
    { value: 'kg', label: 'Kilograms' },
    { value: 'rolls', label: 'Rolls' },
    { value: 'bottles', label: 'Bottles' },
    { value: 'sheets', label: 'Sheets' },
    { value: 'meters', label: 'Meters' },
    { value: 'cartridges', label: 'Cartridges' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-lg bg-white mb-10">
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', { required: 'Item name is required' })}
                type="text"
                placeholder="e.g., A4 Paper"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            {/* Amharic Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                የእቃ ስም (Amharic)
              </label>
              <input
                {...register('nameAm')}
                type="text"
                placeholder="የእቃውን ስም በአማርኛ ይጻፉ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-amharic"
                dir="rtl"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU (Stock Keeping Unit)
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    {...register('sku')}
                    type="text"
                    placeholder="Auto-generated"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={generateSKU}
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
              <select
                {...register('category', { required: 'Category is required' })}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
              {selectedCategory && (
                <p className="mt-1 text-xs text-gray-500">
                  {categories.find(c => c.value === selectedCategory)?.description}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Quantity <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiPackage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('quantity', { 
                    required: 'Quantity is required',
                    min: { value: 0, message: 'Quantity cannot be negative' }
                  })}
                  type="number"
                  step="1"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
              {isLowStock && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <FiAlertCircle className="mr-1" size={12} />
                  Low stock warning! Quantity is at or below minimum level.
                </p>
              )}
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit of Measurement <span className="text-red-500">*</span>
              </label>
              <select
                {...register('unit', { required: 'Unit is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {units.map(unit => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
              {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>}
            </div>

            {/* Minimum Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stock Level <span className="text-red-500">*</span>
              </label>
              <input
                {...register('minimumQuantity', { 
                  required: 'Minimum quantity is required',
                  min: { value: 0, message: 'Minimum quantity cannot be negative' }
                })}
                type="number"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.minimumQuantity && <p className="mt-1 text-sm text-red-600">{errors.minimumQuantity.message}</p>}
              <p className="mt-1 text-xs text-gray-500">Alert when quantity falls below this level</p>
            </div>

            {/* Maximum Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Stock Level
              </label>
              <input
                {...register('maximumQuantity')}
                type="number"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">Optional: Maximum capacity for this item</p>
            </div>

            {/* Reorder Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reorder Quantity
              </label>
              <input
                {...register('reorderQuantity')}
                type="number"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">Recommended quantity to reorder</p>
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (ETB)
              </label>
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('unitPrice')}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Storage Location
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('location')}
                  type="text"
                  placeholder="e.g., Store Room A, Shelf 3"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Shelf/Bin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shelf / Bin Number
              </label>
              <input
                {...register('shelf')}
                type="text"
                placeholder="e.g., A-12, B-03"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <input
                {...register('supplier')}
                type="text"
                placeholder="Supplier name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Supplier Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Contact
              </label>
              <input
                {...register('supplierContact')}
                type="text"
                placeholder="Phone or email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              {...register('notes')}
              rows="3"
              placeholder="Any additional information about this item..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <FiAlertCircle className="text-blue-500 mt-0.5" size={16} />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Stock Management Tips:</p>
                <ul className="text-xs mt-1 list-disc list-inside space-y-1">
                  <li>Set minimum stock levels based on monthly consumption</li>
                  <li>Regular inventory counts help maintain accuracy</li>
                  <li>Low stock alerts will be sent when quantity falls below minimum</li>
                  <li>Update quantities when items are received or issued</li>
                </ul>
              </div>
            </div>
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
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Item' : 'Create Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryForm;
