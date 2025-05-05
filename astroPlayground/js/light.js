document.addEventListener("mousemove", function (e) {
  const light = document.querySelector(".light");
  light.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
});
