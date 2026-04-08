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
      // Evitam importul React Router aici pentru a nu crea dependente circulare.
      // Redirectionarea se face prin manipulare directa a history-ului browserului.
      // Componenta ProtectedRoute va intercepta starea clearAuth si va face redirect
      // la urmatorul render, dar pentru a forta redirectul imediat din afara arborelui
      // React (ex: request in background), folosim window.location.
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // 403 este propagat catre hook-ul apelant — fiecare domeniu
    // are logica proprie de tratare (ex: redirect, toast, rollback optimistic)

    return Promise.reject(error);
  }
);

export default apiClient;