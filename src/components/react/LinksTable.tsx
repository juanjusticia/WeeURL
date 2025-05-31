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

const LinksTable = () => {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


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
      console.log('Buscando usuario en localStorage...');
      const userDataStr = localStorage.getItem('currentUser');
      console.log('Datos de usuario en localStorage:', userDataStr);
      
      if (!userDataStr) {
        console.log('No se encontraron datos de usuario en localStorage');
        return null;
      }
      
      const userData = JSON.parse(userDataStr);
      console.log('Datos de usuario parseados:', userData);
      
      // Verificar si el token está presente y no ha expirado
      if (userData.token) {
        console.log('Token encontrado, verificando expiración...');
        const tokenExpiration = userData.expiresIn * 1000; // Convertir a milisegundos
        const now = Date.now();
        
        if (now > userData.timestamp + tokenExpiration) {
          console.log('Token expirado');
          localStorage.removeItem('currentUser');
          return null;
        }
      }
      
      // Retornar el objeto user directamente si existe, o el objeto completo si no
      const user = userData?.user || userData;
      console.log('Usuario obtenido:', user);
      return user;
      
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
      
      // Mapear la respuesta de la API a la interfaz Link
      const formattedLinks = response?.enlaces?.map((link: ApiLink) => ({
        id: link.id.toString(),
        originalUrl: link.enlace_largo,
        shortUrl: link.enlace_acortado,
        shortCode: link.enlace_acortado.split('/').pop(),
        createdAt: link.created_at,
        updatedAt: link.updated_at
      })) || [];
      
      setLinks(formattedLinks);
      setError(null);
    } catch (err) {
      console.error('Error al cargar enlaces:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los enlaces');
    } finally {
      setIsLoading(false);
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
      setLinks(links.filter(link => link.id !== linkId));
    } catch (err) {
      console.error('Error al eliminar el enlace:', err);
      setError('Error al eliminar el enlace. Por favor, inténtalo de nuevo.');
    }
  };

  // Fetch user links on component mount
  useEffect(() => {
    fetchUserLinks();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8d6aed]"></div>
        <p className="mt-2 text-gray-600">Cargando enlaces...</p>
      </div>
    );
  }


  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
        <p>{error}</p>
      </div>
    );
  }


  if (links.length === 0) {
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
          {links.map((link) => (
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LinksTable;
