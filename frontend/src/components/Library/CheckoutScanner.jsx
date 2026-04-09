import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { FiCamera, FiX, FiCheck } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const CheckoutScanner = ({ isOpen, onClose, onSuccess }) => {
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [book, setBook] = useState(null);


  const handleScan = async (data) => {
    if (data && !loading) {
      setScanning(false);
      setLoading(true);
      
      try {
        let bookId;
        try {
          const parsed = JSON.parse(data);
          bookId = parsed.id || parsed.bookId;
        } catch {
          bookId = data;
        }
        
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/library/books/${bookId}`);
        setBook(response.data.data);
        toast.success('Book found!');
      } catch (error) {
        toast.error('Book not found');
        setScanning(true);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCheckout = async () => {
    if (!book) return;
    
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/library/checkout`, {
        bookId: book._id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });
      toast.success(`Successfully checked out "${book.title}"`);
      if (onSuccess) onSuccess(book);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to checkout book');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Scan Book QR Code</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <FiX size={24} />
          </button>
        </div>

        {scanning ? (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <QrReader
                onResult={handleScan}
                constraints={{ facingMode: 'environment' }}
                containerStyle={{ width: '100%' }}
                videoStyle={{ width: '100%' }}
              />
            </div>
            <p className="text-center text-sm text-gray-500">
              Position the QR code in the camera view
            </p>
            <button
              onClick={() => setScanning(false)}
              className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel Scan
            </button>
          </div>
        ) : book ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiCheck className="text-green-600" size={32} />
              </div>
              <h4 className="font-semibold text-gray-900">{book.title}</h4>
              <p className="text-sm text-gray-500">by {book.author}</p>
              <p className="text-xs text-gray-400 mt-1">ISBN: {book.isbn}</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available Copies:</span>
                <span className="font-semibold">{book.availableCopies}/{book.totalCopies}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-semibold">
                  {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setScanning(true);
                  setBook(null);
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Scan Again
              </button>
              <button
                onClick={handleCheckout}
                disabled={loading || book.availableCopies === 0}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'import.metaing...' : 'Checkout'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FiCamera className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-500">No book found. Try scanning again.</p>
            <button
              onClick={() => setScanning(true)}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Scan Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutScanner;
