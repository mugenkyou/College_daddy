window.addEventListener('scroll', function () {
  const btn = document.getElementById('backToTopBtn');
  if (!btn) return;
  if (window.scrollY > 300) {
    btn.style.display = 'flex';
  } else {
    btn.style.display = 'none';
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('backToTopBtn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});