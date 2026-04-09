import React, { useState, useEffect } from 'react';
import { FiPlus, FiBookOpen, FiUser, FiCalendar, FiSearch } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../components/Common/Header';
import Sidebar from '../components/Common/Sidebar';
import BookList from '../components/Library/BookList';
import CheckoutScanner from '../components/Library/CheckoutScanner';
import ReturnForm from '../components/Library/ReturnForm';
import BookModal from '../components/Library/BookModal';

const LibraryPage = () => {
  const [books, setBooks] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [stats, setStats] = useState(null);
  const { user, isAdmin, isStaff } = useAuth();

  useEffect(() => {
    fetchBooks();
    if (user) {
      fetchMyBooks();
    }
    if (isAdmin) {
      fetchStats();
    }
  }, [user]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/library/books`);
      setBooks(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBooks = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/library/my-books`);
      setMyBooks(response.data.data);
    } catch (error) {
      console.error('Failed to fetch my books', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/library/stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const handleCheckout = async (book) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/library/checkout`, {
        bookId: book._id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });
      toast.success(`Successfully borrowed "${book.title}"`);
      fetchBooks();
      fetchMyBooks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to borrow book');
    }
  };

  const handleReturn = async (checkout) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/library/return/${checkout._id}`);
      toast.success('Book returned successfully');
      fetchBooks();
      fetchMyBooks();
      setShowReturnForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to return book');
    }
  };

  const handleCreateBook = async (bookData) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/library/books`, bookData);
      toast.success('Book added successfully');
      fetchBooks();
      setShowBookModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add book');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Library Management</h1>
              {(isAdmin || isStaff) && (
                <button
                  onClick={() => setShowBookModal(true)}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <FiPlus className="mr-2" />
                  Add Book
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('browse')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'browse'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiBookOpen className="inline mr-2" />
                Browse Books
              </button>
              <button
                onClick={() => setActiveTab('my-books')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-books'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiUser className="inline mr-2" />
                My Borrowed Books
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'stats'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiCalendar className="inline mr-2" />
                  Statistics
                </button>
              )}
            </nav>
          </div>

          {/* Scan Button */}
          <div className="mb-4">
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiSearch className="mr-2" />
              Scan QR Code
            </button>
          </div>

          {/* Content */}
          {activeTab === 'browse' && (
            <BookList
              books={books}
              loading={loading}
              onCheckout={handleCheckout}
            />
          )}

          {activeTab === 'my-books' && (
            <div className="space-y-4">
              {myBooks.length > 0 ? (
                myBooks.map((checkout) => (
                  <div key={checkout._id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{checkout.bookId?.title}</h3>
                        <p className="text-sm text-gray-600">by {checkout.bookId?.author}</p>
                        <div className="mt-2 space-y-1 text-sm">
                          <p className="text-gray-500">
                            Borrowed: {new Date(checkout.checkoutDate).toLocaleDateString()}
                          </p>
                          <p className={`flex items-center ${checkout.isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                            <FiCalendar className="mr-1" size={14} />
                            Due: {new Date(checkout.dueDate).toLocaleDateString()}
                            {checkout.isOverdue && ` (${checkout.overdueDays} days overdue)`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCheckout(checkout);
                          setShowReturnForm(true);
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                      >
                        Return
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <FiBookOpen className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-500">No books borrowed</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-3xl font-bold text-primary-600">{stats.totalBooks}</p>
                <p className="text-gray-600 mt-1">Total Books</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-3xl font-bold text-green-600">{stats.availableBooks}</p>
                <p className="text-gray-600 mt-1">Available Copies</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-3xl font-bold text-yellow-600">{stats.activeCheckouts}</p>
                <p className="text-gray-600 mt-1">Active Checkouts</p>
              </div>
              {stats.overdueCheckouts > 0 && (
                <div className="bg-red-50 rounded-lg shadow p-6 text-center col-span-full">
                  <p className="text-2xl font-bold text-red-600">{stats.overdueCheckouts}</p>
                  <p className="text-red-600 mt-1">Overdue Books</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <CheckoutScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onSuccess={(book) => {
          setShowScanner(false);
          if (book) handleCheckout(book);
        }}
      />

      <ReturnForm
        isOpen={showReturnForm}
        onClose={() => {
          setShowReturnForm(false);
          setSelectedCheckout(null);
        }}
        onSuccess={() => {
          fetchBooks();
          fetchMyBooks();
        }}
        checkout={selectedCheckout}
      />

      <BookModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        onSubmit={handleCreateBook}
      />
    </div>
  );
};

export default LibraryPage;