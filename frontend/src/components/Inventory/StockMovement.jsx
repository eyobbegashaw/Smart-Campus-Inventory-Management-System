import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiTrendingDown, FiPackage, FiUser } from 'react-icons/fi';
import axios from 'axios';

const StockMovement = ({ itemId }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovements();
  }, [itemId]);

  const fetchMovements = async () => {
    try {
      // This would be replaced with actual API endpoint
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/inventory/${itemId}/movements`);
      setMovements(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch stock movements', error);
      // Mock data for demo
      setMovements([
        {
          id: 1,
          type: 'in',
          quantity: 50,
          previousQuantity: 20,
          newQuantity: 70,
          reason: 'Restock',
          performedBy: { name: 'Admin User' },
          timestamp: new Date()
        },
        {
          id: 2,
          type: 'out',
          quantity: 10,
          previousQuantity: 70,
          newQuantity: 60,
          reason: 'Department requisition',
          performedBy: { name: 'Staff User' },
          timestamp: new Date(Date.now() - 86400000)
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {movements.length > 0 ? (
        movements.map((movement) => (
          <div key={movement.id} className="flex items-start space-x-3 p-3 border rounded-lg">
            <div className={`p-2 rounded-full ${
              movement.type === 'in' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {movement.type === 'in' ? (
                <FiTrendingUp className="text-green-600" size={16} />
              ) : (
                <FiTrendingDown className="text-red-600" size={16} />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">
                  {movement.type === 'in' ? '+' : '-'}{movement.quantity} units
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(movement.timestamp).toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                From {movement.previousQuantity} to {movement.newQuantity}
              </p>
              <p className="text-sm text-gray-500 mt-1">{movement.reason}</p>
              <div className="flex items-center mt-2 text-xs text-gray-400">
                <FiUser className="mr-1" size={12} />
                {movement.performedBy?.name || 'System'}
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center py-8">No stock movements recorded</p>
      )}
    </div>
  );
};

export default StockMovement;