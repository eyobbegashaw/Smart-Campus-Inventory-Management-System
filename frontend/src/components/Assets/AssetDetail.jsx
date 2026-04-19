
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiQrCode, FiEdit, FiTrash2, FiCheckCircle, FiClock, FiUser, FiMapPin, FiPackage, FiCalendar } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import QRCodeDisplay from './QRCodeDisplay';
import CheckoutForm from './CheckoutForm';

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [checkoutHistory, setCheckoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const fetchAsset = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/assets/${id}`);
      setAsset(response.data.data);
      setCheckoutHistory(response.data.checkoutHistory || []);
    } catch (error) {
      toast.error('Failed to load asset details');
      navigate('/assets');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (data) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/assets/${id}/checkout`, data);
      toast.success('Asset checked out successfully');
      fetchAsset();
      setShowCheckout(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to checkout asset');
    }
  };

  const handleReturn = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/assets/${id}/return`, {
        returnCondition: 'Good'
      });
      toast.success('Asset returned successfully');
      fetchAsset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to return asset');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/assets/${id}`);
        toast.success('Asset deleted successfully');
        navigate('/assets');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete asset');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!asset) return null;

  const statusColors = {
    available: 'bg-green-100 text-green-800',
    'checked-out': 'bg-yellow-100 text-yellow-800',
    maintenance: 'bg-red-100 text-red-800',
    retired: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/assets')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="mr-2" />
          Back to Assets
        </button>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowQR(true)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <FiQrCode className="inline mr-1" />
            QR Code
          </button>
          <Link
            to={`/assets/${id}/edit`}
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <FiEdit className="inline mr-1" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-3 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50"
          >
            <FiTrash2 className="inline mr-1" />
            Delete
          </button>
        </div>
      </div>

      {/* Asset Info Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <FiPackage className="text-gray-400" size={20} />
                <span className="text-sm font-mono text-gray-500">{asset.assetTag}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">{asset.name}</h1>
              {asset.description && (
                <p className="text-gray-600 mt-2">{asset.description}</p>
              )}
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[asset.status]}`}>
              {asset.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <FiPackage className="text-gray-400 w-5 mr-2" />
                <span className="text-gray-600">Category:</span>
                <span className="ml-2 font-medium">{asset.category?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <FiUser className="text-gray-400 w-5 mr-2" />
                <span className="text-gray-600">Department:</span>
                <span className="ml-2 font-medium">{asset.department?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <FiMapPin className="text-gray-400 w-5 mr-2" />
                <span className="text-gray-600">Location:</span>
                <span className="ml-2 font-medium">{asset.location || 'N/A'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <FiCalendar className="text-gray-400 w-5 mr-2" />
                <span className="text-gray-600">Purchase Date:</span>
                <span className="ml-2 font-medium">
                  {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-5 mr-2">💰</span>
                <span className="text-gray-600">Purchase Price:</span>
                <span className="ml-2 font-medium">
                  {asset.purchasePrice ? `ETB ${asset.purchasePrice.toLocaleString()}` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-5 mr-2">📈</span>
                <span className="text-gray-600">Current Value:</span>
                <span className="ml-2 font-medium text-green-600">
                  {asset.currentValue ? `ETB ${asset.currentValue.toLocaleString()}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {asset.serialNumber && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Serial Number:</span> {asset.serialNumber}
              </p>
              {asset.manufacturer && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Manufacturer:</span> {asset.manufacturer} {asset.model}
                </p>
              )}
            </div>
          )}

          {asset.status === 'available' ? (
            <button
              onClick={() => setShowCheckout(true)}
              className="mt-6 w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Checkout Asset
            </button>
          ) : asset.status === 'checked-out' && (
            <button
              onClick={handleReturn}
              className="mt-6 w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
            >
              Return Asset
            </button>
          )}
        </div>
      </div>

      {/* Checkout History */}
      <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Checkout History</h2>
          {checkoutHistory.length > 0 ? (
            <div className="space-y-3">
              {checkoutHistory.map((checkout) => (
                <div key={checkout._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        Checked out by: {checkout.checkedOutBy?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        To: {checkout.checkedOutTo?.name || 'Unknown'}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <p className="text-xs text-gray-500">
                          <FiClock className="inline mr-1" size={12} />
                          {new Date(checkout.createdAt).toLocaleString()}
                        </p>
                        {checkout.expectedReturnDate && (
                          <p className="text-xs text-gray-500">
                            Expected Return: {new Date(checkout.expectedReturnDate).toLocaleDateString()}
                          </p>
                        )}
                        {checkout.actualReturnDate && (
                          <p className="text-xs text-green-600">
                            <FiCheckCircle className="inline mr-1" size={12} />
                            Returned: {new Date(checkout.actualReturnDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      checkout.status === 'active' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {checkout.status}
                    </span>
                  </div>
                  {checkout.condition && (
                    <p className="text-sm text-gray-600 mt-2">Condition: {checkout.condition}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No checkout history</p>
          )}
        </div>
      </div>

      {/* Modals */}
      {showQR && (
        <QRCodeDisplay
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          asset={asset}
        />
      )}
      {showCheckout && (
        <CheckoutForm
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          onSubmit={handleCheckout}
          asset={asset}
        />
      )}
    </div>
  );
};

export default AssetDetail;
