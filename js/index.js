// ============================================
//  COMUNIDAD PIURANA — INDEX JS
// ============================================

// Menú hamburguesa móvil
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.navbar__links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Cerrar menú al hacer clic en un enlace
document.querySelectorAll('.navbar__links a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Navbar con fondo al hacer scroll
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.style.borderBottomColor = 'rgba(255,255,255,0.12)';
  } else {
    navbar.style.borderBottomColor = 'rgba(255,255,255,0.07)';
  }
});

// Animación de entrada para secciones con IntersectionObserver
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.card, .event, .section__title').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});
