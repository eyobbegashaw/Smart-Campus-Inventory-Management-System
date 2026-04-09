import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiDownload } from 'react-icons/fi';
import AssetList from '../components/Assets/AssetList';
import AssetModal from '../components/Assets/AssetModal';
import CheckoutModal from '../components/Assets/CheckoutModal';
import Header from '../components/Common/Header';
import Sidebar from '../components/Common/Sidebar';
import toast from 'react-hot-toast';

const AssetsPage = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', search: '' });

  useEffect(() => {
    fetchAssets();
  }, [filters]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters).toString();
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/assets?${params}`);
      setAssets(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (assetData) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/assets`, assetData);
      toast.success('Asset created successfully');
      fetchAssets();
      setShowCreateModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create asset');
    }
  };

  const handleCheckout = async (asset, checkoutData) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/assets/${asset._id}/checkout`, checkoutData);
      toast.success('Asset checked out successfully');
      fetchAssets();
      setShowCheckoutModal(false);
      setSelectedAsset(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to checkout asset');
    }
  };

  const handleReturn = async (asset) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/assets/${asset._id}/return`, {
        returnCondition: 'Good'
      });
      toast.success('Asset returned successfully');
      fetchAssets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to return asset');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/reports/assets?format=excel`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assets-report-${new Date().toISOString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded');
    } catch (error) {
      toast.error('Failed to download report');
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
              <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
              <div className="flex space-x-3">
                <button
                  onClick={handleExport}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FiDownload className="mr-2" />
                  Export
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <FiPlus className="mr-2" />
                  Add Asset
                </button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="mt-4 flex flex-wrap gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="checked-out">Checked Out</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
              
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Categories</option>
                <option value="Computer">Computer</option>
                <option value="Laptop">Laptop</option>
                <option value="Furniture">Furniture</option>
                <option value="Lab Equipment">Lab Equipment</option>
              </select>
            </div>
          </div>
          
          <AssetList
            assets={assets}
            loading={loading}
            onCheckout={(asset) => {
              setSelectedAsset(asset);
              setShowCheckoutModal(true);
            }}
            onReturn={handleReturn}
          />
        </main>
      </div>
      
      <AssetModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAsset}
      />
      
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => {
          setShowCheckoutModal(false);
          setSelectedAsset(null);
        }}
        onSubmit={(data) => handleCheckout(selectedAsset, data)}
        asset={selectedAsset}
      />
    </div>
  );
};

export default AssetsPage;
