import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiAlertCircle } from 'react-icons/fi';
import InventoryTable from '../components/Inventory/InventoryTable';
import InventoryForm from '../components/Inventory/InventoryForm';
import Header from '../components/Common/Header';
import Sidebar from '../components/Common/Sidebar';
import toast from 'react-hot-toast';

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/inventory`);
      setItems(response.data.data);
      
      // Count low stock items
      const lowStock = response.data.data.filter(item => item.quantity <= item.minimumQuantity);
      setLowStockCount(lowStock.length);
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (itemData) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/inventory`, itemData);
      toast.success('Item created successfully');
      fetchInventory();
      setShowForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create item');
    }
  };

  const handleUpdateItem = async (itemData) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/inventory/${editingItem._id}`, itemData);
      toast.success('Item updated successfully');
      fetchInventory();
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/inventory/${id}`);
      toast.success('Item deleted successfully');
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                {lowStockCount > 0 && (
                  <div className="mt-2 flex items-center text-amber-600">
                    <FiAlertCircle className="mr-1" />
                    <span className="text-sm">{lowStockCount} items are low on stock</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowForm(true);
                }}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <FiPlus className="mr-2" />
                Add Item
              </button>
            </div>
          </div>
          
          <InventoryTable
            items={items}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDeleteItem}
          />
        </main>
      </div>
      
      <InventoryForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
        initialData={editingItem}
        isEditing={!!editingItem}
      />
    </div>
  );
};

export default InventoryPage;
