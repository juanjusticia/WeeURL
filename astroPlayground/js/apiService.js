// apiService.js
import axios from 'axios';

// Configuración de la API
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Obtener usuario actual
export const getCurrentUser = () => {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
};

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

// Eliminar un enlace
export const deleteLink = async (linkId) => {
  try {
    const response = await api.delete(`/api/links/${linkId}`);
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
