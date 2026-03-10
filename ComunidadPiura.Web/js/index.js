// js/index.js — Lógica de la landing page

// ── NAVBAR SCROLL ──
window.addEventListener('scroll', () => {
  document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 60);
  updateActiveLink();
});

function updateActiveLink() {
  const links = document.querySelectorAll('.nav-link');
  let current = '';
  document.querySelectorAll('section[id]').forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
  });
  links.forEach(l => {
    l.classList.remove('active');
    if (l.getAttribute('href') === '#' + current) l.classList.add('active');
  });
}

// ── MOBILE MENU ──
document.getElementById('hamBtn')?.addEventListener('click', () => {
  document.getElementById('mobMenu').classList.toggle('open');
});
function closeMob() { document.getElementById('mobMenu')?.classList.remove('open'); }

// ── COUNTER ANIMATION ──
const statsObserver = new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting) return;
  statsObserver.disconnect();
  document.querySelectorAll('.st-num').forEach(el => {
    const target = +el.dataset.target;
    const duration = 1800;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.floor(current);
    }, 16);
  });
}, { threshold: 0.5 });
const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

// ── CAROUSEL ──
(function () {
  const track = document.getElementById('cTrack');
  const dots  = document.getElementById('cDots');
  if (!track) return;

  const slides = track.querySelectorAll('.c-slide');
  let cur = 0;

  slides.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'c-dot' + (i === 0 ? ' act' : '');
    d.addEventListener('click', () => go(i));
    dots.appendChild(d);
  });

  const vis = () => window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
  const sw  = () => slides[0].offsetWidth + 16;

  function updDots() {
    dots.querySelectorAll('.c-dot').forEach((d, i) => d.classList.toggle('act', i === cur));
  }
  function go(i) {
    cur = Math.max(0, Math.min(i, slides.length - vis()));
    track.style.transform = `translateX(-${cur * sw()}px)`;
    updDots();
  }

  document.getElementById('cPrev').addEventListener('click', () => go(cur - 1));
  document.getElementById('cNext').addEventListener('click', () => go(cur + 1));

  let ap = setInterval(() => go(cur + 1 > slides.length - vis() ? 0 : cur + 1), 4200);
  track.addEventListener('mouseenter', () => clearInterval(ap));
  track.addEventListener('mouseleave', () => {
    ap = setInterval(() => go(cur + 1 > slides.length - vis() ? 0 : cur + 1), 4200);
  });

  let sx = 0;
  track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; });
  track.addEventListener('touchend', e => {
    const diff = sx - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) go(diff > 0 ? cur + 1 : cur - 1);
  });

  window.addEventListener('resize', () => go(cur));
})();

// ── SCROLL REVEAL ──
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = 'opacity .6s ease, transform .6s ease';
  revealObs.observe(el);
});
