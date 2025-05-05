// public/js/script.js
document.getElementById("loginButton").addEventListener("click", function () {
  const modal = document.getElementById("loginModal");
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.remove("opacity-0");
    modal.querySelector("div").classList.remove("scale-95");
  }, 10); // Pequeño retraso para activar la transición
});

document
  .getElementById("loginModal")
  .addEventListener("click", function (event) {
    if (event.target === this) {
      const modal = this;
      modal.classList.add("opacity-0");
      modal.querySelector("div").classList.add("scale-95");
      setTimeout(() => {
        modal.classList.add("hidden");
      }, 300); // Coincide con la duración de la transición
    }
  });

document
  .getElementById("toggleExtraField")
  .addEventListener("click", function (event) {
    event.preventDefault();
    const extraField = document.getElementById("extraField");
    extraField.classList.toggle("hidden");
    document.getElementById("loginField").innerHTML =
      document.getElementById("loginField").innerHTML == "Login"
        ? "Regístrate"
        : "Login";

    this.innerHTML = this.innerHTML == "Login" ? "Regístrate" : "Login";

    document.getElementById("labelRegistro").innerHTML =
      document.getElementById("labelRegistro").innerHTML ==
      "¿No tienes una cuenta?"
        ? "¿Ya tienes una cuenta?"
        : "¿No tienes una cuenta?";
  });
