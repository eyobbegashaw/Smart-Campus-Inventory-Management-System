import React, { useState } from 'react';
import { FiSearch, FiBookOpen, FiUser, FiCalendar, FiMapPin } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const BookList = ({ books, loading, onCheckout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn?.includes(searchTerm);
    const matchesCategory = !filterCategory || book.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(books.map(book => book.category))];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBooks.map((book) => (
          <div key={book._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <FiBookOpen className="text-primary-600" size={18} />
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{book.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">by {book.author}</p>
                {book.titleAm && (
                  <p className="text-xs text-gray-500 font-amharic mt-1">{book.titleAm}</p>
                )}
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                book.availableCopies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Out of stock'}
              </span>
            </div>

            <div className="mt-3 space-y-1 text-sm text-gray-500">
              {book.isbn && <p>ISBN: {book.isbn}</p>}
              {book.publisher && <p>Publisher: {book.publisher} ({book.publishYear})</p>}
              {book.location && (
                <p className="flex items-center">
                  <FiMapPin className="mr-1" size={12} />
                  {book.location}
                </p>
              )}
            </div>

            <div className="mt-4 flex space-x-2">
              <Link
                to={`/library/books/${book._id}`}
                className="flex-1 text-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Details
              </Link>
              {book.availableCopies > 0 && (
                <button
                  onClick={() => onCheckout(book)}
                  className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                >
                  Borrow
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-12">
          <FiBookOpen className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-500">No books found</p>
        </div>
      )}
    </div>
  );
};

export default BookList;