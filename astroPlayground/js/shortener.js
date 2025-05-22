function randomId(len = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < len; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function getCurrentUser() {
  const userData = localStorage.getItem("currentUser");
  return userData ? JSON.parse(userData) : null;
}

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('shortenerForm');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const input = document.getElementById('originalUrl');
    const msg = document.getElementById('shortenMsg');
    const submitBtn = form.querySelector('button[type="submit"]');
    const original = input.value.trim();
    
    if (!original) return;

    // Mostrar estado de carga
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="animate-spin">↻</span> Procesando...';
    msg.textContent = '';

    try {
      const user = getCurrentUser();

      // Generar el código corto
      const shortCode = randomId(6);
      const shortUrl = `${window.location.origin}/wee/${shortCode}`;
      
      // Importar el servicio de API
      const { default: api } = await import('./apiService.js');
      
      // Preparar el cuerpo de la petición
      const requestData = {
        enlace_largo: original,
        enlace_acortado: shortUrl,
        cod_enlace: shortCode,
      };
      
      // Obtener usuario del localStorage si existe
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      
      // Añadir usuario_id si el usuario está autenticado
      if (currentUser) {
        requestData.usuario_id = currentUser.user.id;
      }
      // Enviar a la API usando el servicio configurado
      const response = await api.post('/links', requestData);

      // Mostrar éxito
      msg.innerHTML = `
        <div class="p-3 mb-4 text-green-700 bg-green-100 rounded">
          <span class="font-medium">¡Enlace acortado!</span>
          <a href="${shortUrl}" target="_blank" class="text-[#6633ee] underline block mt-1 truncate">
            ${shortUrl}
          </a>
        </div>
      `;
      
      // Limpiar el input
      input.value = '';
      
      // Recargar la tabla de enlaces si existe
      if (typeof window.renderLinks === 'function') {
        window.renderLinks();
      }
      
    } catch (error) {
      console.error('Error al acortar el enlace:', error);
      msg.innerHTML = `
        <div class="p-3 mb-4 text-red-700 bg-red-100 rounded">
          <span class="font-medium">Error:</span> ${error.message || 'No se pudo acortar el enlace'}
        </div>
      `;
    } finally {
      // Restaurar el botón
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      
      // Limpiar el mensaje después de 7 segundos
      setTimeout(() => {
        if (msg.textContent.includes('Error') || msg.textContent.includes('¡Enlace acortado!')) {
          msg.textContent = '';
        }
      }, 7000);
    }
  });
});
