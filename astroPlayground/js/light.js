document.addEventListener("mousemove", function (e) {
  const light = document.querySelector(".light");
  if (!light) return;
  const rect = light.getBoundingClientRect();
  const radiusX = rect.width / 2;
  const radiusY = rect.height / 2;
  let x = e.clientX;
  let y = e.clientY;
  // Limitar para que el centro de la luz no salga de la ventana
  x = Math.max(radiusX, Math.min(window.innerWidth - radiusX, x));
  y = Math.max(radiusY, Math.min(window.innerHeight - radiusY, y));
  light.style.position = 'fixed';
  light.style.left = (x - radiusX) + 'px';
  light.style.top = (y - radiusY) + 'px';
  light.style.transform = 'none';
});
