import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - FIXED: Tidak auto logout pada password salah
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Hanya logout jika token invalid/expired (401 dari auth middleware)
    // TIDAK logout jika password decrypt salah (401 dari decrypt function)
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || '';
      
      // Cek apakah error dari auth token atau password decrypt
      // Jika pesan error tentang password decrypt, JANGAN logout
      const isPasswordError = 
        errorMessage.toLowerCase().includes('password salah') ||
        errorMessage.toLowerCase().includes('password incorrect') ||
        errorMessage.toLowerCase().includes('wrong password');
      
      // Jika error bukan dari password decrypt, baru logout
      if (!isPasswordError) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Report APIs
export const reportAPI = {
  uploadReport: (formData) => 
    api.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getReports: () => api.get('/reports'),
  getReportById: (reportId) => api.get(`/reports/${reportId}`),
  decryptReport: (reportId, password) =>
    api.post(`/reports/${reportId}/decrypt`, { password }, {
      responseType: 'blob',
    }),
};

// Access Request APIs
export const accessAPI = {
  requestAccess: (data) => api.post('/access/request', data),
  getAccessRequests: (status) =>
    api.get('/access/requests', { params: { status } }),
  approveRequest: (requestId, data) =>
    api.post(`/access/approve/${requestId}`, data),
  rejectRequest: (requestId, data) =>
    api.post(`/access/reject/${requestId}`, data),
  decryptReport: (requestId, password) =>
    api.post(`/access/decrypt/${requestId}`, { password }, {
      responseType: 'blob',
    }),
};

export default api;