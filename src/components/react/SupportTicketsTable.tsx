// src/components/react/SupportTicketsTable.tsx
import React, { useState, useEffect, useCallback } from 'react';

interface Ticket {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'closed' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  admin_notes?: string;
  user_id: number;
  assigned_to: number | null;
  user_email: string;
  assigned_admin_email: string | null;
}

const statusLabels = {
  open: 'Abierto',
  in_progress: 'En progreso',
  closed: 'Cerrado',
  resolved: 'Resuelto'
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-green-100 text-green-800',
  high: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-800'
};

export const SupportTicketsTable = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const token = userData?.token;
        
        if (!token) {
          setError('No autenticado');
          window.location.href = '/';
          return;
        }

        const response = await fetch('/api/admin/support', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.status === 401 || response.status === 403) {
          setError('No tienes permisos para ver estos tickets');
          window.location.href = '/';
          return;
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error al cargar los tickets');
        }
        
        const responseData = await response.json();
        // Extraer el array de tickets del objeto de respuesta
        const ticketsData = Array.isArray(responseData.tickets) ? responseData.tickets : [];
        setTickets(ticketsData);
        setError(null);
      } catch (err) {
        console.error('Error al cargar los tickets:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const token = userData?.token;
      
      if (!token) {
        setError('No estás autenticado. Por favor, inicia sesión nuevamente.');
        return;
      }

      const response = await fetch('/api/admin/support', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401 || response.status === 403) {
        setError('No tienes permisos para ver estos tickets');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cargar los tickets');
      }
      
      const responseData = await response.json();
      const ticketsData = Array.isArray(responseData.tickets) ? responseData.tickets : [];
      setTickets(ticketsData);
      setError(null);
    } catch (err) {
      console.error('Error al cargar los tickets:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar los tickets al montar el componente
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const token = userData?.token;
      
      if (!token) {
        console.error('No se encontró el token de autenticación');
        setError('No estás autenticado. Por favor, inicia sesión nuevamente.');
        return;
      }
      
      // Enviar solo el campo status para la actualización
      const updateData = {
        status: newStatus
      };
      
      // Usar la ruta relativa ya que el proxy está configurado
      const response = await fetch(`/api/admin/support/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en la respuesta:', errorText);
        let errorMessage = 'Error al actualizar el estado del ticket';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('No se pudo parsear el error:', e);
        }
        
        throw new Error(errorMessage);
      }

      // Recargar la lista completa de tickets
      await fetchTickets();
      
      // Mostrar notificación de éxito
      setError(null);
    } catch (err) {
      console.error('Error al actualizar el estado:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar el ticket');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Asegurarse de que tickets sea un array antes de mapear
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  
  if (safeTickets.length === 0 && !error) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay tickets de soporte disponibles.
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asunto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safeTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{ticket.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ticket.subject}
                    {ticket.message && (
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                        {ticket.message}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{ticket.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{ticket.email || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                      ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      ticket.status === 'resolved' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {statusLabels[ticket.status as keyof typeof statusLabels] || ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div title={new Date(ticket.updated_at).toLocaleString()}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                      {ticket.updated_at !== ticket.created_at && (
                        <span className="ml-1 text-xs text-gray-400" title="Actualizado">
                          (✓)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option className="text-gray-700" value="open">Abierto</option>
                      <option className="text-blue-700" value="in_progress">En progreso</option>
                      <option className="text-purple-700" value="resolved">Resuelto</option>
                      <option className="text-gray-700" value="closed">Cerrado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};