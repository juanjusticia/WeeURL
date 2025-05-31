// loginAuth.js
import { login as apiLogin, register as apiRegister } from './apiService';

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
        
        console.log('Guardando datos de Google en localStorage:', userData);
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
    console.log('Iniciando sesión con usuario:', username);
    const response = await apiLogin(username, password);
    console.log('Respuesta de la API:', response);
    
    if (response && response.token) {
      // Agregar timestamp para control de expiración
      const userData = {
        ...response,
        timestamp: Date.now() // Guardar el momento en que se inicia sesión
      };
      
      console.log('Guardando datos de usuario en localStorage:', userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // Verificar que se guardó correctamente
      const savedData = localStorage.getItem('currentUser');
      console.log('Datos guardados en localStorage:', savedData);
      
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
  if (!msgDiv) {
    msgDiv = document.createElement("div");
    msgDiv.id = "loginMessage";
    msgDiv.style.position = "absolute";
    msgDiv.style.top = "16px";
    msgDiv.style.left = "50%";
    msgDiv.style.transform = "translateX(-50%)";
    msgDiv.style.zIndex = "50";
    msgDiv.style.padding = "10px 24px";
    msgDiv.style.borderRadius = "8px";
    msgDiv.style.fontWeight = "bold";
    msgDiv.style.fontSize = "1rem";
    msgDiv.style.boxShadow = "0 2px 12px 0 rgba(0,0,0,0.08)";
    document.getElementById("loginModal").appendChild(msgDiv);
  }
  msgDiv.textContent = msg;
  msgDiv.style.background = type === "error" ? "#fee2e2" : type === "success" ? "#d1fae5" : "#ede9fe";
  msgDiv.style.color = type === "error" ? "#b91c1c" : type === "success" ? "#065f46" : "#4f46e5";
  msgDiv.style.border = type === "error" ? "1px solid #fca5a5" : type === "success" ? "1px solid #6ee7b7" : "1px solid #a5b4fc";
  msgDiv.style.opacity = "1";
  setTimeout(() => {
    msgDiv.style.opacity = "0";
  }, 2200);
}

window.addEventListener("DOMContentLoaded", () => {
  // Manejar la respuesta de autenticación de Google si es necesario
  handleGoogleAuthResponse();
  
  // Configurar el botón de Google
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', loginWithGoogle);
  }
  
  const form = document.querySelector("#loginModal form");
  if (!form) return;
  
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
      const errorMessage = error.response?.data?.message || 'Error de conexión. Inténtalo de nuevo.';
      showLoginMessage(errorMessage, "error");
    } finally {
      // Restore button state
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
});
