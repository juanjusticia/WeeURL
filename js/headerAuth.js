// Cambia el botón Login por Logout si hay usuario logueado y añade dashboard/administrador según el rol
document.addEventListener("DOMContentLoaded", function () {
  const loginBtn = document.getElementById("loginButton");
  if (!loginBtn) return;
  const nav = loginBtn.parentElement;
  let user = null;
  try {
    const userData = JSON.parse(localStorage.getItem("currentUser"));
    if (userData && userData.user) {
      user = userData.user; // Extraer solo los datos del usuario
    }
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
  }
  
  // Elimina enlaces previos si existen
  const prev = document.getElementById("roleLink");
  if (prev) prev.remove();
  
  if (user) {
    // Crear enlace al Dashboard para todos los usuarios autenticados
    let dashboardLink = document.createElement("a");
    dashboardLink.id = "dashboardLink";
    dashboardLink.href = "/dashboard";
    dashboardLink.textContent = "Dashboard";
    dashboardLink.className = "font-bold text-white hover:bg-[#6633ee] transition-colors rounded-2xl px-3 py-2 text-center";
    nav.insertBefore(dashboardLink, loginBtn);
    
    // Si el usuario es admin, añadir también el enlace de Administrador
    if (user.rol && user.rol.toLowerCase() === "admin") {
      let adminLink = document.createElement("a");
      adminLink.id = "adminLink";
      adminLink.href = "/admin";
      adminLink.textContent = "Administrador";
      adminLink.className = "font-bold text-white hover:bg-[#6633ee] transition-colors rounded-2xl px-3 py-2 text-center";
      nav.insertBefore(adminLink, loginBtn);
    }
    // Botón logout
    loginBtn.textContent = "Logout";
    loginBtn.onclick = function () {
      localStorage.removeItem("currentUser");
      window.location.href = "/";
    };
    loginBtn.classList.remove("hover:bg-[#6633ee]");
    loginBtn.classList.add("hover:bg-red-600");
  } else {
    loginBtn.textContent = "Login";
    loginBtn.onclick = function () {
      document.getElementById("loginModal").classList.remove("hidden");
    };
    loginBtn.classList.remove("hover:bg-red-600");
    loginBtn.classList.add("hover:bg-[#6633ee]");
  }
});
