import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
      }
      
      // Handle 403 Forbidden
      if (error.response.status === 403) {
        toast.error('You do not have permission to perform this action');
      }
      
      // Handle 404 Not Found
      if (error.response.status === 404) {
        toast.error('Resource not found');
      }
      
      // Handle 500 Server Error
      if (error.response.status >= 500) {
        toast.error('Server error. Please try again later.');
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Asset API
export const assetAPI = {
  getAll: (params) => api.get('/assets', { params }),
  getById: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
  checkout: (id, data) => api.post(`/assets/${id}/checkout`, data),
  return: (id, data) => api.post(`/assets/${id}/return`, data),
  getQR: (id) => api.get(`/assets/${id}/qr`),
  getByQR: (qrData) => api.get(`/assets/qr/${encodeURIComponent(qrData)}`),
  getStats: () => api.get('/assets/stats'),
};

// Inventory API
export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  getLowStock: () => api.get('/inventory/low-stock'),
  getStats: () => api.get('/inventory/stats'),
  createRequisition: (data) => api.post('/inventory/requisitions', data),
  getRequisitions: (params) => api.get('/inventory/requisitions', { params }),
  updateRequisitionStatus: (id, data) => api.put(`/inventory/requisitions/${id}/status`, data),
};

// Service Request API
export const requestAPI = {
  getAll: (params) => api.get('/requests', { params }),
  getById: (id) => api.get(`/requests/${id}`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'photos' && Array.isArray(data[key])) {
        data[key].forEach(photo => formData.append('photos', photo));
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.post('/requests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateStatus: (id, data) => api.put(`/requests/${id}/status`, data),
  addComment: (id, data) => api.post(`/requests/${id}/comments`, data),
  assign: (id, data) => api.put(`/requests/${id}/assign`, data),
  getStats: () => api.get('/requests/stats'),
};

// Library API
export const libraryAPI = {
  getBooks: (params) => api.get('/library/books', { params }),
  getBook: (id) => api.get(`/library/books/${id}`),
  createBook: (data) => api.post('/library/books', data),
  updateBook: (id, data) => api.put(`/library/books/${id}`, data),
  deleteBook: (id) => api.delete(`/library/books/${id}`),
  checkout: (data) => api.post('/library/checkout', data),
  return: (checkoutId) => api.post(`/library/return/${checkoutId}`),
  getMyBooks: () => api.get('/library/my-books'),
  getAllCheckouts: (params) => api.get('/library/checkouts', { params }),
  getStats: () => api.get('/library/stats'),
};

// Report API
export const reportAPI = {
  getDashboardStats: () => api.get('/reports/dashboard-stats'),
  generateAssetReport: (params) => api.get('/reports/assets', { params, responseType: 'blob' }),
  generateRequestReport: (params) => api.get('/reports/requests', { params, responseType: 'blob' }),
  generateInventoryReport: (params) => api.get('/reports/inventory', { params, responseType: 'blob' }),
  exportToCSV: (type) => api.get(`/reports/export/${type}`, { responseType: 'blob' }),
};

// User API
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/auth/updatepassword', data),
};

// Department API
export const departmentAPI = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.put(`/auth/reset-password/${token}`, data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
};

export default api;