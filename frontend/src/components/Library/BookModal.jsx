import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiX, FiBook, FiUser, FiHash, FiCalendar, FiMapPin } from 'react-icons/fi';
import Select from 'react-select';
import axios from 'axios';
import toast from 'react-hot-toast';

const BookModal = ({ isOpen, onClose, onSubmit, initialData, isEditing = false }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

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
    setValue('title', initialData.title);
    setValue('titleAm', initialData.titleAm);
    setValue('author', initialData.author);
    setValue('isbn', initialData.isbn);
    setValue('publisher', initialData.publisher);
    setValue('publishYear', initialData.publishYear);
    setValue('edition', initialData.edition);
    setValue('category', initialData.category);
    setValue('subCategory', initialData.subCategory);
    setValue('location', initialData.location);
    setValue('shelf', initialData.shelf);
    setValue('rack', initialData.rack);
    setValue('totalCopies', initialData.totalCopies);
    setValue('language', initialData.language || 'en');
    setValue('pages', initialData.pages);
    setValue('description', initialData.description);
    
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
      title: '',
      titleAm: '',
      author: '',
      isbn: '',
      publisher: '',
      publishYear: '',
      edition: '',
      category: 'Textbook',
      subCategory: '',
      location: '',
      shelf: '',
      rack: '',
      totalCopies: 1,
      language: 'en',
      pages: '',
      description: ''
    });
    setSelectedDepartment(null);
  };

  const onSubmitForm = async (data) => {
    setLoading(true);
    try {
      const formData = {
        ...data,
        totalCopies: parseInt(data.totalCopies),
        pages: data.pages ? parseInt(data.pages) : undefined,
        publishYear: data.publishYear ? parseInt(data.publishYear) : undefined,
        department: selectedDepartment?.value
      };
      
      await onSubmit(formData);
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save book');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'Textbook', label: '📚 Textbook', description: 'Educational books for courses' },
    { value: 'Reference', label: '📖 Reference', description: 'Encyclopedias, dictionaries, handbooks' },
    { value: 'Fiction', label: '📕 Fiction', description: 'Novels, stories, literature' },
    { value: 'Non-Fiction', label: '📗 Non-Fiction', description: 'Biographies, history, science' },
    { value: 'Journal', label: '📘 Journal', description: 'Academic journals, periodicals' },
    { value: 'Magazine', label: '📙 Magazine', description: 'Magazines, newsletters' },
    { value: 'Other', label: '📄 Other', description: 'Other types of publications' }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'am', label: 'አማርኛ (Amharic)' },
    { value: 'other', label: 'Other' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-lg bg-white mb-10">
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Book' : 'Add New Book'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Book Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiBook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('title', { required: 'Title is required' })}
                  type="text"
                  placeholder="Book title"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            {/* Amharic Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                የመጽሐፍ ርዕስ (Amharic)
              </label>
              <input
                {...register('titleAm')}
                type="text"
                placeholder="የመጽሐፉን ርዕስ በአማርኛ ይጻፉ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-amharic"
                dir="rtl"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('author', { required: 'Author is required' })}
                  type="text"
                  placeholder="Author name"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {errors.author && <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>}
            </div>

            {/* ISBN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ISBN
              </label>
              <div className="relative">
                <FiHash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('isbn')}
                  type="text"
                  placeholder="978-3-16-148410-0"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Publisher */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Publisher
              </label>
              <input
                {...register('publisher')}
                type="text"
                placeholder="Publisher name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Publish Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Publish Year
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('publishYear')}
                  type="number"
                  placeholder="2024"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Edition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Edition
              </label>
              <input
                {...register('edition')}
                type="text"
                placeholder="2nd Edition"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
            </div>

            {/* Sub Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub Category
              </label>
              <input
                {...register('subCategory')}
                type="text"
                placeholder="e.g., Programming, History"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Department (for textbooks) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department (for textbooks)
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

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                {...register('language')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Total Copies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Copies <span className="text-red-500">*</span>
              </label>
              <input
                {...register('totalCopies', { 
                  required: 'Total copies is required',
                  min: { value: 1, message: 'At least 1 copy' }
                })}
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.totalCopies && <p className="mt-1 text-sm text-red-600">{errors.totalCopies.message}</p>}
            </div>

            {/* Pages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Pages
              </label>
              <input
                {...register('pages')}
                type="number"
                min="1"
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
                  placeholder="e.g., Section A, Row 3"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Shelf */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shelf
              </label>
              <input
                {...register('shelf')}
                type="text"
                placeholder="e.g., Shelf A-12"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Rack */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rack
              </label>
              <input
                {...register('rack')}
                type="text"
                placeholder="e.g., Rack 3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
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
              placeholder="Book description, synopsis, or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ Available copies will be automatically set to match total copies.
              You can track borrow counts through the checkout system.
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
              {loading ? 'Saving...' : (isEditing ? 'Update Book' : 'Add Book')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookModal;