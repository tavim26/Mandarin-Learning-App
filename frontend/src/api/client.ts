import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/config/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ataseaza automat JWT-ul inainte de fiecare request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestioneaza global erorile de autentificare si autorizare
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Eroare de retea — serviciu indisponibil
      return Promise.reject(error);
    }

    const status = error.response.status;

    if (status === 401) {
      // Token absent, expirat sau corupt — curata sesiunea si redirectioneaza
      useAuthStore.getState().clearAuth();
 
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;