// Cambia el botón Login por Logout si hay usuario logueado y añade dashboard/administrador según el rol
document.addEventListener("DOMContentLoaded", function () {
  const loginBtn = document.getElementById("loginButton");
  if (!loginBtn) return;
  const nav = loginBtn.parentElement;
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("currentUser"));
  } catch {}
  // Elimina enlaces previos si existen
  const prev = document.getElementById("roleLink");
  if (prev) prev.remove();
  if (user) {
    // Añadir enlace según rol
    let link = document.createElement("a");
    link.id = "roleLink";
    link.className = "font-bold text-white hover:bg-[#6633ee] transition-colors rounded-2xl px-3 py-2 text-center";
    if (user.rol === "Admin") {
      link.href = "/admin";
      link.textContent = "Administrador";
    } else {
      link.href = "/dashboard";
      link.textContent = "Dashboard";
    }
    nav.insertBefore(link, loginBtn);
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
