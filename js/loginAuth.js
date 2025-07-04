// loginAuth.js
import { login as apiLogin, register as apiRegister } from './apiService';

// Función para mostrar/ocultar el modal de recuperación de contraseña
function togglePasswordRecoveryModal(show = true) {
  const modal = document.getElementById('passwordRecoveryModal');
  if (!modal) return;
  
  if (show) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    // Enfocar el campo de email cuando se abre el modal
    setTimeout(() => document.getElementById('recoveryEmail')?.focus(), 100);
  } else {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
  }
}

// Función para mostrar mensajes en el formulario de recuperación
function showRecoveryMessage(message, isError = false) {
  const messageElement = document.getElementById('recoveryMessage');
  if (!messageElement) return;
  
  messageElement.textContent = message;
  messageElement.className = 'mb-4 p-3 rounded text-sm';
  messageElement.classList.add(isError ? 'error-message' : 'success-message');
  messageElement.classList.remove('hidden');
  
  // Ocultar el mensaje después de 5 segundos
  if (!isError) {
    setTimeout(() => {
      messageElement.classList.add('hidden');
    }, 5000);
  }
}

// Función para manejar el envío del formulario de recuperación
async function handlePasswordRecovery(event) {
  event.preventDefault();
  
  const emailInput = document.getElementById('recoveryEmail');
  const email = emailInput?.value.trim();
  
  if (!email) {
    showRecoveryMessage('Por favor, introduce tu correo electrónico', true);
    return;
  }
  
  try {
    // Mostrar indicador de carga
    const submitButton = event.target.querySelector('button[type="submit"]');
    let originalButtonText = '';
    
    if (submitButton) {
      originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.innerHTML = 'Enviando...';
    }
    
    // Enviar la solicitud al servidor
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    let data;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        await response.text();
        throw new Error('El servidor devolvió una respuesta inesperada');
      }
      
      if (response.ok) {
        // Mostrar mensaje de éxito
        showRecoveryMessage('Se ha enviado un correo con las instrucciones para restablecer tu contraseña. Por favor, revisa tu bandeja de entrada.');
        
        // Limpiar el formulario
        if (emailInput) emailInput.value = '';
        
        // Cerrar el modal después de 3 segundos
        setTimeout(() => {
          togglePasswordRecoveryModal(false);
        }, 3000);
      } else {
        // Mostrar mensaje de error del servidor
        showRecoveryMessage(data.message || 'Error al procesar la solicitud', true);
      }
    } catch (parseError) {
      console.error('Error al procesar la respuesta:', parseError);
      if (response.status === 404) {
        showRecoveryMessage('El servicio de recuperación de contraseña no está disponible en este momento', true);
      } else {
        showRecoveryMessage('Error en el servidor. Por favor, inténtalo de nuevo más tarde.', true);
      }
    }
  } catch (error) {
    console.error('Error al enviar la solicitud de recuperación:', error);
    showRecoveryMessage('Error de conexión. Por favor, inténtalo de nuevo más tarde.', true);
  } finally {
    // Restaurar el botón
    if (submitButton && originalButtonText) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
}

// Función para iniciar sesión con Google
function loginWithGoogle() {
  try {
    // Redirigir al endpoint de autenticación de Google
    window.location.href = '/api/auth/google';
  } catch (error) {
    console.error('Error al intentar iniciar sesión con Google:', error);
    showLoginMessage('Error al intentar iniciar sesión con Google', 'error');
  }
}

// Función para manejar la respuesta de Google después de la autenticación
function handleGoogleAuthResponse() {
  // Verificar si hay una respuesta de Google en la URL
  const urlParams = new URLSearchParams(window.location.search);
  const responseData = urlParams.get('response');
  
  if (responseData) {
    try {
      // Decodificar y parsear la respuesta JSON
      const response = JSON.parse(decodeURIComponent(responseData));
      
      if (response.token && response.user) {
        // Crear el objeto de usuario en el formato esperado
        const userData = {
          token: response.token,
          userId: response.user.id,
          user: {
            id: response.user.id,
            username: response.user.username,
            email: response.user.email,
            rol: response.user.rol
          },
          expiresIn: response.expiresIn || 86400, // Valor por defecto de 24 horas
          message: response.message || 'Inicio de sesión con Google exitoso',
          timestamp: Date.now() // Añadir timestamp para control de expiración
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Limpiar la URL después de procesar la respuesta
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Redirigir al dashboard o página principal
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error al procesar la respuesta de Google:', error);
      showLoginMessage('Error al procesar la respuesta de autenticación', 'error');
    }
  }
}

async function login(username, password) {
  try {
    const response = await apiLogin(username, password);
    
    if (response && response.token) {
      // Agregar timestamp para control de expiración
      const userData = {
        ...response,
        timestamp: Date.now() // Guardar el momento en que se inicia sesión
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return userData;
    }
    return null;
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    throw error; // Propagar el error para manejarlo en el formulario
  }
}

async function register(userData) {
  try {
    const response = await apiRegister(userData);
    if (response && response.token) {
      // Guardar la respuesta completa en localStorage
      localStorage.setItem('currentUser', JSON.stringify(response));
      return response;
    }
    return null;
  } catch (error) {
    console.error('Error en el registro:', error);
    throw error; // Propagar el error para manejarlo en el formulario
  }
}

// Manejo del formulario
function showLoginMessage(msg, type = "info") {
  let msgDiv = document.getElementById("loginMessage");
  const modalContent = document.querySelector("#loginModal .modal-content");
  const modalTitle = document.querySelector("#loginModal h2");
  
  if (!msgDiv) {
    msgDiv = document.createElement("div");
    msgDiv.id = "loginMessage";
    msgDiv.style.width = "100%";
    msgDiv.style.padding = "12px 16px";
    msgDiv.style.borderRadius = "8px";
    msgDiv.style.marginBottom = "16px";
    msgDiv.style.fontWeight = "500";
    msgDiv.style.fontSize = "0.95rem";
    msgDiv.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
    
    // Insertar después del título
    if (modalTitle && modalTitle.parentNode) {
      modalTitle.parentNode.insertBefore(msgDiv, modalTitle.nextSibling);
    } else if (modalContent) {
      modalContent.insertBefore(msgDiv, modalContent.firstChild);
    } else {
      document.getElementById("loginModal").appendChild(msgDiv);
    }
  }
  msgDiv.textContent = msg;
  msgDiv.style.background = type === "error" ? "#fef2f2" : type === "success" ? "#ecfdf5" : "#f5f3ff";
  msgDiv.style.color = type === "error" ? "#dc2626" : type === "success" ? "#059669" : "#4f46e5";
  msgDiv.style.borderLeft = type === "error" ? "4px solid #dc2626" : type === "success" ? "4px solid #059669" : "4px solid #4f46e5";
  msgDiv.style.opacity = "1";
  msgDiv.style.transition = "opacity 0.3s ease-in-out";
  
  // Asegurarse de que el mensaje sea visible
  msgDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  setTimeout(() => {
    msgDiv.style.opacity = "0";
    // Eliminar el mensaje después de la animación
    setTimeout(() => {
      if (msgDiv.parentNode) {
        msgDiv.parentNode.removeChild(msgDiv);
      }
    }, 300);
  }, 3000);
}

window.addEventListener("DOMContentLoaded", () => {
  // Manejar la respuesta de autenticación de Google si es necesario
  handleGoogleAuthResponse();
  
  // Configurar el botón de Google
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', loginWithGoogle);
  }
  
  // Configurar el enlace de "¿Olvidaste tu contraseña?"
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      togglePasswordRecoveryModal(true);
    });
  }
  
  // Configurar el botón de cierre del modal de recuperación
  const closeRecoveryModal = document.getElementById('closeRecoveryModal');
  if (closeRecoveryModal) {
    closeRecoveryModal.addEventListener('click', () => togglePasswordRecoveryModal(false));
  }
  
  // Configurar el envío del formulario de recuperación
  const recoveryForm = document.getElementById('passwordRecoveryForm');
  if (recoveryForm) {
    recoveryForm.addEventListener('submit', handlePasswordRecovery);
  }
  
  // Cerrar el modal al hacer clic fuera del contenido
  const recoveryModal = document.getElementById('passwordRecoveryModal');
  if (recoveryModal) {
    recoveryModal.addEventListener('click', (e) => {
      if (e.target === recoveryModal) {
        togglePasswordRecoveryModal(false);
      }
    });
  }
  
  const form = document.querySelector("#loginModal form");
  if (!form) return;
  
  // Configurar el botón de registro
  const toggleRegisterBtn = document.getElementById('toggleExtraField');
  const extraField = document.getElementById('extraField');
  const loginField = document.getElementById('loginField');
  const labelRegistro = document.getElementById('labelRegistro');
  
  if (toggleRegisterBtn && extraField && loginField && labelRegistro) {
    toggleRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isHidden = extraField.classList.toggle('hidden');
      loginField.textContent = isHidden ? 'Login' : 'Registro';
      toggleRegisterBtn.textContent = isHidden ? 'Regístrate' : 'Iniciar sesión';
      labelRegistro.textContent = isHidden ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?';
      
      // Cambiar el texto del botón de envío
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.textContent = isHidden ? 'Iniciar sesión' : 'Registrarse';
      }
    });
  }
  
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    
    const username = form.querySelector("#user").value;
    const password = form.querySelector("#password").value;
    const emailField = form.querySelector("#email");
    const isRegister = emailField && !form.querySelector("#extraField").classList.contains("hidden");
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Procesando...';
    
    try {
      if (isRegister) {
        const email = emailField ? emailField.value : '';
        if (!username || !email || !password) {
          showLoginMessage("Rellena todos los campos", "error");
          return;
        }
        
        // Call the register API
        const userData = await register({ username, email, password });
        if (userData) {
          // Store user data in localStorage
          localStorage.setItem('currentUser', JSON.stringify(userData));
          document.getElementById("loginModal").classList.add("hidden");
          showLoginMessage("¡Registro exitoso! Redirigiendo...", "success");
          
          // Redirect based on user role
          setTimeout(() => {
            const redirectPath = userData.rol === 'Admin' ? '/admin' : '/dashboard';
            window.location.href = redirectPath;
          }, 1500);
        } else {
          showLoginMessage("Error en el registro. Inténtalo de nuevo.", "error");
        }
      } else {
        // Handle login
        if (!username || !password) {
          showLoginMessage("Por favor, introduce usuario y contraseña", "error");
          return;
        }
        
        const userData = await login(username, password);
        if (userData) {
          // Store user data in localStorage
          localStorage.setItem('currentUser', JSON.stringify(userData));
          document.getElementById("loginModal").classList.add("hidden");
          showLoginMessage(`¡Bienvenido, ${userData.username || userData.user || 'usuario'}!`, "success");
          
          // Redirect based on user role
          setTimeout(() => {
            const redirectPath = userData.rol === 'Admin' ? '/admin' : '/dashboard';
            window.location.href = redirectPath;
          }, 1500);
        } else {
          showLoginMessage("Usuario o contraseña incorrectos", "error");
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      let errorMessage = 'Error de conexión. Inténtalo de nuevo.';
      
      // Manejar específicamente errores de credenciales incorrectas
      if (error.response?.status === 401) {
        errorMessage = 'Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.';
      } else if (error.response?.data?.message) {
        // Usar el mensaje del servidor si está disponible
        errorMessage = error.response.data.message;
      }
      
      showLoginMessage(errorMessage, "error");
    } finally {
      // Restore button state
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
});
