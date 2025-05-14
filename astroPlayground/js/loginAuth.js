// loginAuth.js
// Usuarios de prueba
defaultUsers = [
  { email: "admin@email.com", password: "admin123", nombre: "Admin", rol: "Admin" },
  { email: "juan@email.com", password: "juan123", nombre: "Juan", rol: "Usuario" },
  { email: "ana@email.com", password: "ana123", nombre: "Ana", rol: "Usuario" },
];

function getUsers() {
  // Si hay usuarios guardados en localStorage, usarlos
  const users = localStorage.getItem("users");
  return users ? JSON.parse(users) : defaultUsers;
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function login(email, password) {
  const users = getUsers();
  return users.find(
    (u) => u.email === email && u.password === password
  );
}

function register(nombre, email, password) {
  let users = getUsers();
  if (users.find((u) => u.email === email)) return false; // Ya existe
  users.push({ nombre, email, password, rol: "Usuario" });
  saveUsers(users);
  return true;
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
  const form = document.querySelector("#loginModal form");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = form.querySelector("#email").value;
    const password = form.querySelector("#password").value;
    const usernameField = form.querySelector("#username");
    const isRegister = !form.querySelector("#extraField").classList.contains("hidden");
    if (isRegister) {
      const nombre = usernameField.value;
      if (!nombre || !email || !password) {
        showLoginMessage("Rellena todos los campos", "error");
        return;
      }
      if (register(nombre, email, password)) {
        // Guardar usuario logueado y redirigir a dashboard
        const newUser = { nombre, email, password, rol: "Usuario" };
        localStorage.setItem("currentUser", JSON.stringify(newUser));
        document.getElementById("loginModal").classList.add("hidden");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 400);
      } else {
        showLoginMessage("Ese email ya está registrado.", "error");
      }
    } else {
      const user = login(email, password);
      if (user) {
        showLoginMessage(`Bienvenido, ${user.nombre} (${user.rol})`, "success");
        // Guardar usuario logueado
        localStorage.setItem("currentUser", JSON.stringify(user));
        // Cerrar modal
        document.getElementById("loginModal").classList.add("hidden");
        // Redirección según rol
        setTimeout(() => {
          if (user.rol === "Admin") {
            window.location.href = "/admin";
          } else {
            window.location.href = "/dashboard";
          }
        }, 500);
      } else {
        showLoginMessage("Email o contraseña incorrectos", "error");
      }
    }
  });
});
