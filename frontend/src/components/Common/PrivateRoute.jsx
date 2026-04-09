import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children, adminOnly = false, hodOnly = false, staffOnly = false }) => {
  const { isAuthenticated, loading, user, isAdmin, isHod, isStaff } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (hodOnly && !isHod && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (staffOnly && !isStaff && !isHod && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user is active
  if (user && !user.isActive) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Account Disabled</h2>
          <p className="text-gray-600">Your account has been disabled. Please contact an administrator.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;