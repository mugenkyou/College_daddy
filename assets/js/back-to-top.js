window.addEventListener('scroll', function () {
  const btn = document.getElementById('backToTopBtn');
  if (window.scrollY > 300) {
    btn.classList.add('show');
  } else {
    btn.classList.remove('show');
  }
});

document.getElementById('backToTopBtn').addEventListener('click', function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});