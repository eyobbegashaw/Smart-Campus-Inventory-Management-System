import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/Common/PrivateRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AssetsPage from './pages/AssetsPage';
import InventoryPage from './pages/InventoryPage';
import RequestsPage from './pages/RequestsPage';
import LibraryPage from './pages/LibraryPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import './index.css';

function AppContent() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/assets" element={<PrivateRoute><AssetsPage /></PrivateRoute>} />
      <Route path="/inventory" element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
      <Route path="/requests" element={<PrivateRoute><RequestsPage /></PrivateRoute>} />
      <Route path="/library" element={<PrivateRoute><LibraryPage /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute adminOnly><AdminPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: 'green',
                  secondary: 'black',
                },
              },
            }}
          />
          <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;