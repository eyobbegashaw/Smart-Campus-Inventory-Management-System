import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiX, FiShoppingCart } from 'react-icons/fi';
import axios from 'axios';
import { Link } from 'react-router-dom';

const LowStockAlert = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [show, setShow] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const fetchLowStockItems = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/inventory/low-stock`);
      setLowStockItems(response.data.data.lowStock || []);
    } catch (error) {
      console.error('Failed to fetch low stock items', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || lowStockItems.length === 0 || !show) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FiAlertCircle className="text-red-500" size={20} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Low Stock Alert - {lowStockItems.length} item(s) need attention
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc list-inside space-y-1">
              {lowStockItems.slice(0, 3).map((item) => (
                <li key={item._id}>
                  <span className="font-medium">{item.name}</span> - Only {item.quantity} {item.unit} left
                  (Min: {item.minimumQuantity})
                </li>
              ))}
              {lowStockItems.length > 3 && (
                <li>And {lowStockItems.length - 3} more items...</li>
              )}
            </ul>
          </div>
          <div className="mt-3">
            <Link
              to="/inventory"
              className="inline-flex items-center text-sm font-medium text-red-800 hover:text-red-900"
            >
              <FiShoppingCart className="mr-1" size={14} />
              View Inventory
            </Link>
          </div>
        </div>
        <button
          onClick={() => setShow(false)}
          className="flex-shrink-0 text-red-500 hover:text-red-700"
        >
          <FiX size={18} />
        </button>
      </div>
    </div>
  );
};

export default LowStockAlert;