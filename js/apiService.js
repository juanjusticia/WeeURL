// apiService.js
import axios from 'axios';

// Configuración de la API
const api = axios.create({
  baseURL: '/api', // Usar ruta relativa que será manejada por el proxy de Vite
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Obtener usuario actual
export const getCurrentUser = () => {
  try {
    console.log('Buscando usuario en localStorage (apiService)...');
    const userData = localStorage.getItem('currentUser');
    console.log('Datos encontrados (apiService):', userData);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error al obtener el usuario actual (apiService):', error);
    return null;
  }
};

// Función para obtener el token de autenticación
const getAuthToken = () => {
  const userData = getCurrentUser();
  return userData?.token || '';
};

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en la petición:', error);
    
    if (error.response?.status === 401) {
      console.log('Error 401 - No autorizado');
      // Eliminar datos de usuario si la sesión expiró
      localStorage.removeItem('currentUser');
      // Redirigir al login
      window.location.href = '/login';
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Iniciar sesión
export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    throw error;
  }
};

// Registrar nuevo usuario
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Error en el registro:', error);
    throw error;
  }
};

// Obtener enlaces del usuario
export const getUserLinks = async (userId) => {
  try {
    const response = await api.get(`/usuarios/${userId}/enlaces`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener los enlaces del usuario:', error);
    throw error;
  }
};

// Obtener un enlace por su código de enlace
export const getLink = async (codEnlace) => {
  try {
    const response = await api.get(`/links/${codEnlace}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener el enlace:', error);
    throw error;
  }
};

// Eliminar un enlace
export const deleteLink = async (linkId) => {
  try {
    const response = await api.delete(`/links/${linkId}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar el enlace:', error);
    throw error;
  }
};

// Cerrar sesión
export const logout = () => {
  localStorage.removeItem('currentUser');
};

export default api;
