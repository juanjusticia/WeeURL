import { useEffect, useState } from 'react';

// Tipos para TypeScript
interface Link {
  id: number;
  enlace_largo: string;
  enlace_acortado: string;
  cod_enlace: string;
  created_at: string;
  updated_at: string;
  usuario_id: number;
}

interface ApiResponse {
  usuario_id: string;
  total_enlaces: number;
  enlaces: Link[];
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

interface UserLinksTableProps {
  userId: string | undefined;
}

const ITEMS_PER_PAGE = 10;

export default function UserLinksTable({ userId }: UserLinksTableProps) {
  const [allLinks, setAllLinks] = useState<Link[]>([]);
  const [currentLinks, setCurrentLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ username: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const handleCopy = (codEnlace: string) => {
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}/wee/${codEnlace}`;
      navigator.clipboard.writeText(fullUrl).catch(err => {
        console.error('Error al copiar el enlace:', err);
      });
    }
  };

  const handleDelete = async (linkId: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este enlace?')) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No se pudo autenticar');
      }

      const response = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el enlace');
      }

      // Actualizar la lista de enlaces eliminando el enlace borrado
      setAllLinks(allLinks.filter(link => link.id !== linkId));
      
      // Aquí podrías agregar un toast de éxito
    } catch (err) {
      console.error('Error al eliminar el enlace:', err);
      // Aquí podrías agregar un toast de error
      alert(err instanceof Error ? err.message : 'Error al eliminar el enlace');
    }
  };

  // Función para actualizar los enlaces mostrados cuando cambia la página
  const updateCurrentLinks = (links: Link[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setCurrentLinks(links.slice(startIndex, endIndex));
  };

  // Función para cambiar de página
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setError('ID de usuario no especificado');
        setLoading(false);
        return;
      }

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No se pudo autenticar');
        }
        
        // Obtener información del usuario
        const userResponse = await fetch(`/api/usuarios/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!userResponse.ok) {
          throw new Error('Error al cargar la información del usuario');
        }
        const userData = await userResponse.json();
        setUserInfo({ username: userData.nombre_usuario });

        // Obtener enlaces del usuario
        const linksResponse = await fetch(`/api/usuarios/${userId}/enlaces`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!linksResponse.ok) {
          throw new Error('Error al cargar los enlaces del usuario');
        }

        const data: ApiResponse = await linksResponse.json();
        setAllLinks(data.enlaces);
        setTotalItems(data.enlaces.length);
        setTotalPages(Math.ceil(data.enlaces.length / ITEMS_PER_PAGE));
        setLoading(false);
      } catch (err) {
        console.error('Error al obtener los enlaces del usuario:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los enlaces');
      }
    };

    fetchData();
  }, [userId]);

  // Actualizar enlaces mostrados cuando cambia la página o los datos
  useEffect(() => {
    updateCurrentLinks(allLinks, currentPage);
  }, [currentPage, allLinks]);

  if (loading && allLinks.length === 0) {
    return <div className="flex justify-center p-8">Cargando enlaces...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-8">{error}</div>;
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Enlaces de {userInfo?.username || 'Usuario'}
        </h2>
      </div>
      
      <div className="w-full overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">URL Original</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">URL Corta</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentLinks.length > 0 ? (
              currentLinks.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={link.enlace_largo}>
                      <a 
                        href={link.enlace_largo} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {link.enlace_largo}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-[#8d6aed] font-medium">
                      <a 
                        href={link.enlace_acortado} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:underline break-all"
                      >
                        {link.enlace_acortado}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(link.created_at).toLocaleDateString('es-ES', {
                      year: '2-digit',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(link.cod_enlace);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs px-2 py-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors whitespace-nowrap"
                      >
                        Copiar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(link.id);
                        }}
                        className="text-red-600 hover:text-red-800 font-medium text-xs px-2 py-1 bg-red-50 rounded hover:bg-red-100 transition-colors whitespace-nowrap"
                        title="Eliminar enlace"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  No se encontraron enlaces para este usuario.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-gray-600">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} de {totalItems} enlaces
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Anterior
            </button>
            
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
                  className={`w-8 h-8 rounded-md ${
                    currentPage === pageNum
                      ? 'bg-[#8d6aed] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
