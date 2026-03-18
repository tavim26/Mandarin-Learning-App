import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// Instanta Axios configurata cu adresa API Gateway-ului
const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor — ruleaza automat inainte de FIECARE request HTTP
// Preia token-ul din store si il ataseaza in header-ul Authorization
apiClient.interceptors.request.use((config) => {
  // Citeste token-ul direct din localStorage ca fallback
  const token = useAuthStore.getState().token
    ?? JSON.parse(localStorage.getItem('auth-storage') ?? '{}')?.state?.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;