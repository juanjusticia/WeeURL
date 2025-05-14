function randomId(len = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < len; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser") || 'null');
}
function saveLink(link) {
  const links = JSON.parse(localStorage.getItem("links") || '[]');
  links.push(link);
  localStorage.setItem("links", JSON.stringify(links));
}
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('shortenerForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const input = document.getElementById('originalUrl');
    const msg = document.getElementById('shortenMsg');
    const user = getCurrentUser();
    const original = input.value.trim();
    if (!original) return;
    const short = `${window.location.origin}/wee/${randomId(6)}`;
    const linkObj = user ? { email: user.email, original, short } : { original, short };
    saveLink(linkObj);
    msg.innerHTML = `<span class='text-green-700'>¡Enlace acortado!</span> <a href='${short}' target='_blank' class='text-[#6633ee] underline'>${short}</a>`;
    input.value = '';
    setTimeout(() => msg.textContent = '', 7000);
    if (typeof renderLinks === 'function') renderLinks();
  });
});
