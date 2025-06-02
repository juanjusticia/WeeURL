import { useEffect, useState } from 'react';

// Define interfaces for our data types
interface User {
  id: string;
  username: string;
}

interface ApiLink {
  id: number;
  enlace_largo: string;
  enlace_acortado: string;
  usuario_id: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  usuario_id: string;
  total_enlaces: number;
  enlaces: ApiLink[];
}

interface Link {
  id: string;
  originalUrl: string;
  shortUrl: string;
  shortCode?: string;
  createdAt: string;
  updatedAt?: string;
}

const ITEMS_PER_PAGE = 10;

const LinksTable = () => {
  const [allLinks, setAllLinks] = useState<Link[]>([]);
  const [currentLinks, setCurrentLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);


  // Format date helper function
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Get current user
  const getCurrentUser = () => {
    try {
      const userDataStr = localStorage.getItem('currentUser');
      
      if (!userDataStr) {
        return null;
      }
      
      const userData = JSON.parse(userDataStr);
      
      // Verificar si el token está presente y no ha expirado
      if (userData.token) {
        const tokenExpiration = userData.expiresIn * 1000; // Convertir a milisegundos
        const now = Date.now();
        
        if (now > userData.timestamp + tokenExpiration) {
          localStorage.removeItem('currentUser');
          return null;
        }
      }
      
      // Retornar el objeto user directamente si existe, o el objeto completo si no
      return userData?.user || userData;
      
    } catch (error) {
      console.error('Error al obtener el usuario actual:', error);
      return null;
    }
  };

  // Fetch user links
  const fetchUserLinks = async () => {
    try {
      const user = getCurrentUser();
      if (!user?.id) {
        throw new Error('No se pudo obtener la información del usuario');
      }

      const { getUserLinks } = await import('../../../js/apiService');
      const response = await getUserLinks(user.id) as ApiResponse;
      
      // Update links state with fetched data
      const updateLinks = (apiLinks: ApiLink[]) => {
        const formattedLinks: Link[] = apiLinks.map(link => ({
          id: link.id.toString(),
          originalUrl: link.enlace_largo,
          shortUrl: link.enlace_acortado,
          shortCode: link.enlace_acortado.split('/').pop(),
          createdAt: link.created_at,
          updatedAt: link.updated_at
        }));
        setAllLinks(formattedLinks);
        setTotalItems(formattedLinks.length);
        setTotalPages(Math.ceil(formattedLinks.length / ITEMS_PER_PAGE));
      };
      
      updateLinks(response.enlaces);
      setError(null);
    } catch (err) {
      console.error('Error al cargar enlaces:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los enlaces');
    } finally {
      setIsLoading(false);
    }
  };

  // Update current links when page changes
  const updateCurrentLinks = (links: Link[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setCurrentLinks(links.slice(startIndex, endIndex));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  // Handle delete button click
  const handleDelete = async (linkId: string): Promise<void> => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este enlace?')) {
      return;
    }

    try {
      const { deleteLink } = await import('../../../js/apiService');
      await deleteLink(linkId);
      setAllLinks(allLinks.filter(link => link.id !== linkId));
      setTotalItems(allLinks.length - 1);
      setTotalPages(Math.ceil(allLinks.length / ITEMS_PER_PAGE));
    } catch (err) {
      console.error('Error al eliminar el enlace:', err);
      setError('Error al eliminar el enlace. Por favor, inténtalo de nuevo.');
    }
  };

  // Fetch links when component mounts
  useEffect(() => {
    fetchUserLinks();
  }, []);

  // Update current links when page or data changes
  useEffect(() => {
    updateCurrentLinks(allLinks, currentPage);
  }, [currentPage, allLinks]);

  if (isLoading && allLinks.length === 0) {
    return <div className="flex justify-center p-8">Cargando enlaces...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  if (allLinks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">No tienes ningún enlace acortado aún.</p>
        <a href="/" className="bg-[#8d6aed] hover:bg-[#7a5acd] text-white font-bold py-2 px-6 rounded-full transition-colors">
          Crear mi primer enlace
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL Original</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL Corta</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Creación</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {currentLinks.length > 0 ? (
            currentLinks.map((link) => (
              <tr key={link.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 max-w-xs truncate" title={link.originalUrl}>
                    {link.originalUrl}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-[#8d6aed] font-medium">
                    <a href={link.shortUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {link.shortUrl}
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(link.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleDelete(link.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-4">
                <p className="text-gray-600">No hay enlaces en esta página.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      {/* Pagination Controls */}
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
};

export default LinksTable;
