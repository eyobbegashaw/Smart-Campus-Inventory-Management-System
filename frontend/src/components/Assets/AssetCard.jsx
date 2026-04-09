import React from 'react';
import { Link } from 'react-router-dom';
import { FiQrCode, FiEye, FiPackage, FiMapPin, FiCalendar } from 'react-icons/fi';

const AssetCard = ({ asset, onCheckout, onReturn }) => {
  const statusColors = {
    available: 'bg-green-100 text-green-800',
    'checked-out': 'bg-yellow-100 text-yellow-800',
    maintenance: 'bg-red-100 text-red-800',
    retired: 'bg-gray-100 text-gray-800'
  };

  const statusIcons = {
    available: '🟢',
    'checked-out': '📤',
    maintenance: '🔧',
    retired: '📦'
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <FiPackage className="text-gray-400" size={18} />
              <span className="text-xs font-mono text-gray-500">{asset.assetTag}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mt-1">{asset.name}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{asset.description}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[asset.status]}`}>
            {statusIcons[asset.status]} {asset.status}
          </span>
        </div>

        <div className="mt-3 space-y-1">
          {asset.category && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Category:</span> {asset.category.name}
            </p>
          )}
          {asset.location && (
            <p className="text-sm text-gray-600 flex items-center">
              <FiMapPin className="mr-1 text-gray-400" size={12} />
              {asset.location}
            </p>
          )}
          {asset.purchaseDate && (
            <p className="text-sm text-gray-600 flex items-center">
              <FiCalendar className="mr-1 text-gray-400" size={12} />
              Purchased: {new Date(asset.purchaseDate).toLocaleDateString()}
            </p>
          )}
          {asset.currentValue && (
            <p className="text-sm font-medium text-green-600">
              Value: ETB {asset.currentValue.toLocaleString()}
            </p>
          )}
        </div>

        <div className="mt-4 flex space-x-2">
          <Link
            to={`/assets/${asset._id}`}
            className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <FiEye className="mr-1" size={14} />
            Details
          </Link>
          {asset.status === 'available' ? (
            <button
              onClick={() => onCheckout(asset)}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
            >
              Checkout
            </button>
          ) : asset.status === 'checked-out' && (
            <button
              onClick={() => onReturn(asset)}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
            >
              Return
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetCard;
