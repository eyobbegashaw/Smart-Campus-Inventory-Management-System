import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import HodDashboard from '../components/Dashboard/HodDashboard';
import StaffDashboard from '../components/Dashboard/StaffDashboard';
import StudentDashboard from '../components/Dashboard/StudentDashboard';
import Header from '../components/Common/Header';
import Sidebar from '../components/Common/Sidebar';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { user, isAdmin, isHod, isStaff, isStudent } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/reports/dashboard-stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => {
    if (isAdmin) return <AdminDashboard stats={stats} />;
    if (isHod) return <HodDashboard stats={stats} />;
    if (isStaff) return <StaffDashboard stats={stats} />;
    return <StudentDashboard stats={stats} onRequestSubmit={fetchDashboardStats} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-6">
          {renderDashboard()}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;