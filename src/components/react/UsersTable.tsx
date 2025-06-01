import { useCallback, useEffect, useState } from 'react';
import { deleteUser } from '../../../js/apiService';

// Tipos para TypeScript
interface User {
  id: number;
  username: string;
  email: string;
  rol: string;
  created_at: string;
  updated_at: string;
}

// Función para obtener el token de autenticación
declare const localStorage: {
  getItem(key: string): string | null;
};

const getAuthToken = (): string | null => {
  try {
    const userData = localStorage.getItem('currentUser');
    if (!userData) return null;
    const user = JSON.parse(userData);
    return user.token || null;
  } catch (error) {
    console.error('Error al obtener el token de autenticación:', error);
    return null;
  }
};

// Función para navegar
const navigateTo = (path: string): void => {
  window.location.href = path;
};

const ITEMS_PER_PAGE = 10;

export default function UsersTable() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUsers, setCurrentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Actualizar la paginación cuando cambian los usuarios o el término de búsqueda
  useEffect(() => {
    // Filtrar usuarios según el término de búsqueda
    const filtered = allUsers.filter(user => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    });

    setTotalItems(filtered.length);
    const newTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    setTotalPages(newTotalPages);
    
    // Ajustar la página actual si es necesario
    const newCurrentPage = currentPage > newTotalPages && newTotalPages > 0 ? 1 : currentPage;
    if (newCurrentPage !== currentPage) {
      setCurrentPage(newCurrentPage);
    } else {
      updateCurrentUsers(filtered, newCurrentPage);
    }
  }, [allUsers, searchTerm, currentPage]);

  // Función para actualizar los usuarios mostrados cuando cambia la página
  const updateCurrentUsers = useCallback((users: User[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setCurrentUsers(users.slice(startIndex, endIndex));
  }, []);

  // Verificar rol de administrador y cargar usuarios
  useEffect(() => {
    const checkAdminAndFetchUsers = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        
        if (!token) {
          navigateTo('/');
          return;
        }

        // Obtener información del usuario actual
        const userResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!userResponse.ok) {
          throw new Error('Error al verificar la autenticación');
        }

        const userData = await userResponse.json();
        // Verificar si el usuario es administrador
        if (userData.rol !== 'admin') {
          navigateTo('/');
          return;
        }

        // Si es administrador, cargar la lista de usuarios
        const response = await fetch('/api/usuarios', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar los usuarios');
        }

        const data = await response.json();
        setAllUsers(data);
        setTotalItems(data.length);
        setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE));
      } catch (err) {
        console.error('Error:', err);
        setError('No se pudieron cargar los datos. Redirigiendo...');
        setTimeout(() => navigateTo('/'), 2000);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchUsers();
  }, []);

  // Actualizar usuarios mostrados cuando cambia la página o los datos
  useEffect(() => {
    updateCurrentUsers(allUsers, currentPage);
  }, [currentPage, allUsers]);

  // Función para manejar la navegación al hacer clic en un usuario
  const handleUserClick = (userId: number, e: React.MouseEvent<HTMLTableRowElement>): void => {
    // Verificar si el clic fue en un botón o enlace
    const target = e.target as HTMLElement;
    if (target.tagName !== 'BUTTON' && target.tagName !== 'A' && !target.closest('button') && !target.closest('a')) {
      navigateTo(`/admin/usuarios/${userId}`);
    }
  };

  // Función para manejar la eliminación de un usuario
  const handleDeleteUser = async (userId: number, username: string, e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.stopPropagation(); // Evitar que se active el click en la fila
    
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${username}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteUser(userId);
      // Actualizar la lista de usuarios eliminando el usuario borrado
      setAllUsers(prevUsers => {
        const updatedUsers = prevUsers.filter(user => user.id !== userId);
        setTotalItems(updatedUsers.length);
        setTotalPages(Math.ceil(updatedUsers.length / ITEMS_PER_PAGE));
        return updatedUsers;
      });
      
      // Mostrar mensaje de éxito (puedes reemplazar esto con un toast más adelante)
      alert(`Usuario ${username} eliminado correctamente`);
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
      alert('No se pudo eliminar el usuario. Por favor, inténtalo de nuevo.');
    }
  };

  // Función para cambiar de página
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  if (loading && allUsers.length === 0) {
    return <div className="flex justify-center p-8">Cargando usuarios...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
      {/* Barra de búsqueda */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8d6aed] focus:border-[#8d6aed] sm:text-sm"
            placeholder="Buscar por nombre de usuario o email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Resetear a la primera página al buscar
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registro
              </th>
              <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allUsers.filter(user => {
              if (!searchTerm) return true;
              const term = searchTerm.toLowerCase();
              return (
                user.username.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term)
              );
            }).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios disponibles'}
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => (
              <tr 
                key={user.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={(e) => handleUserClick(user.id, e as React.MouseEvent<HTMLTableRowElement>)}
              >
                <td className="py-2 px-3 text-gray-600 text-xs">{user.id}</td>
                <td className="py-2 px-3 font-medium text-gray-800 text-sm">{user.username}</td>
                <td className="py-2 px-3 text-gray-600 text-xs truncate max-w-[150px]">
                  {user.email}
                </td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    user.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.rol}
                  </span>
                </td>
                <td className="py-2 px-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(user.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="py-2 px-3 text-right">
                  <button
                    onClick={(e) => handleDeleteUser(user.id, user.username, e)}
                    className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    title="Eliminar usuario"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  </button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
      
      {/* Paginación */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
              <span className="font-medium">
                {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
              </span>{' '}
              de <span className="font-medium">{totalItems}</span> usuarios
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-md text-sm ${
                        currentPage === pageNum
                          ? 'bg-[#8d6aed] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
