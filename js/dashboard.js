// js/dashboard.js — Lógica del panel con Firebase

import { auth, db }         from './firebase.js';
import { onAuthStateChanged, signOut }
                            from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp }
                            from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── DATOS ESTÁTICOS (reemplazar con Firestore collections) ──
const EVENTS = [
  { id:1, title:'Torneo Interdistrital de Fútbol 7',         date:'15 Mar 2026', day:'15', mon:'Mar', place:'Estadio Miguel Grau · 8:00 AM',     tag:'sp', label:'⚽ Deporte',      inscritos:32 },
  { id:2, title:'Excursión a las Cataratas de Huancabamba',  date:'22 Mar 2026', day:'22', mon:'Mar', place:'Plaza de Armas · 5:00 AM',           tag:'tr', label:'✈️ Viaje',       inscritos:18 },
  { id:3, title:'Festival Gastronómico Piurano',             date:'05 Abr 2026', day:'05', mon:'Abr', place:'Parque Infantil · Todo el día',      tag:'cu', label:'🎉 Cultura',      inscritos:65 },
  { id:4, title:'Limpieza de Playa en Máncora',             date:'19 Abr 2026', day:'19', mon:'Abr', place:'Playa Máncora · 7:00 AM',            tag:'vo', label:'🤝 Voluntariado', inscritos:41 },
  { id:5, title:'Viaje Grupal a Cusco',                      date:'03 May 2026', day:'03', mon:'May', place:'Aeropuerto de Piura · Cupos limitados', tag:'tr', label:'✈️ Viaje',   inscritos:24 },
  { id:6, title:'Torneo de Vóley Mixto',                    date:'10 May 2026', day:'10', mon:'May', place:'Complejo Deportivo, Sullana · 9:00 AM', tag:'sp', label:'🏐 Deporte', inscritos:16 }
];
const BDAYS = [
  { init:'MP', name:'María Pedraza',  district:'Sullana',    when:'Hoy',             isToday:true  },
  { init:'JR', name:'José Ramírez',   district:'Piura',      when:'Mañana, 11 Mar',  isToday:false },
  { init:'AG', name:'Ana García',     district:'Talara',     when:'13 Mar',          isToday:false },
  { init:'CL', name:'Carlos López',   district:'Máncora',    when:'15 Mar',          isToday:false },
  { init:'RP', name:'Rosa Palacios',  district:'Ayabaca',    when:'16 Mar',          isToday:false },
  { init:'MT', name:'Miguel Torres',  district:'Chulucanas', when:'18 Mar',          isToday:false }
];

// ── AUTH GUARD — si no hay sesión, volver al login ──
onAuthStateChanged(auth, async user => {
  if (!user) { window.location.href = 'login.html'; return; }
  await loadUserData(user);
  initDashboard();
});

// ── CARGAR DATOS DEL USUARIO ──
async function loadUserData(user) {
  try {
    const snap = await getDoc(doc(db, 'usuarios', user.uid));
    if (snap.exists()) {
      const d = snap.data();
      const fullName = `${d.nombre || ''} ${d.apellido || ''}`.trim() || user.email;
      const initials = (d.nombre?.[0] || 'U') + (d.apellido?.[0] || '');
      document.getElementById('welcomeName').textContent = d.nombre || user.email.split('@')[0];
      document.getElementById('userName').textContent    = fullName;
      document.getElementById('userAv').textContent      = initials.toUpperCase();
      document.getElementById('userDist').textContent    = d.distrito || 'Piura';
      document.getElementById('profName').value          = fullName;
      document.getElementById('profPhone').value         = d.phone || '';
      document.getElementById('profDist').value          = d.distrito || 'Piura';
    }
  } catch (e) { console.warn('loadUserData:', e.message); }
}

// ── INIT DASHBOARD ──
function initDashboard() {
  setDate();
  startCountdown();
  renderStats();
  renderHomeEvents();
  renderHomeBdays();
  renderBdayGrid();
  renderEventGrid('todos');
  setupSidebar();
  setupNotif();
  setupLogout();
  setupProfileSave();
}

// ── FECHA ACTUAL ──
function setDate() {
  const el = document.getElementById('pgDate');
  if (!el) return;
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  el.innerHTML = `<span style="color:var(--gold);font-size:.77rem;text-transform:capitalize">${new Date().toLocaleDateString('es-PE', opts)}</span>`;
}

// ── STATS ──
function renderStats() {
  document.getElementById('statMembers').textContent = '524';
  document.getElementById('statTrend').textContent   = '↑ 12 este mes';
  document.getElementById('statEvents').textContent  = EVENTS.length;
  document.getElementById('statBdays').textContent   = BDAYS.filter(b => b.isToday || b.when.startsWith('Mañana')).length;
}

// ── EVENTS LIST (HOME PANEL) ──
function renderHomeEvents() {
  document.getElementById('homeEventList').innerHTML = `
    <div class="ev-list-panel">
      ${EVENTS.slice(0, 3).map(e => `
        <div class="ev-row">
          <div class="ev-dt"><div class="ev-day">${e.day}</div><div class="ev-mon">${e.mon}</div></div>
          <div class="ev-inf"><strong>${e.title}</strong><span>📍 ${e.place}</span></div>
          <span class="ev-tag ${e.tag}">${e.label}</span>
        </div>`).join('')}
    </div>`;
}

// ── BDAYS LIST (HOME PANEL) ──
function renderHomeBdays() {
  document.getElementById('homeBdayList').innerHTML = `
    <div class="bd-list-panel">
      ${BDAYS.slice(0, 3).map(b => `
        <div class="bd-row ${b.isToday ? 'today' : ''}">
          <div class="bd-av">${b.init}</div>
          <div class="bd-inf"><strong>${b.name}</strong><span>${b.when} · ${b.district}</span></div>
          <button class="bd-btn" onclick="celebrate('${b.name}')">🎉</button>
        </div>`).join('')}
    </div>`;
}

// ── BDAYS GRID (CUMPLEAÑOS PAGE) ──
window.filterBdays = function (f, btn) {
  btn.closest('.filter-row').querySelectorAll('.fil-btn').forEach(b => b.classList.remove('act'));
  btn.classList.add('act');
  renderBdayGrid(f);
};
function renderBdayGrid() {
  document.getElementById('bdayGrid').innerHTML = BDAYS.map(b => `
    <div class="bd-card ${b.isToday ? 'today-bd' : ''}">
      ${b.isToday ? '<div class="bd-badge">🎂 HOY</div>' : ''}
      <div class="bd-card-av">${b.init}</div>
      <h4>${b.name}</h4>
      <p>${b.district} · ${b.when}</p>
      <button class="btn-gold sm" onclick="celebrate('${b.name}')">🎉 Felicitar</button>
    </div>`).join('');
}

// ── EVENTS GRID (EVENTOS PAGE) ──
window.filterEvents = function (f, btn) {
  btn.closest('.filter-row').querySelectorAll('.fil-btn').forEach(b => b.classList.remove('act'));
  btn.classList.add('act');
  renderEventGrid(f);
};
function renderEventGrid(filter) {
  const list = filter === 'todos' ? EVENTS : EVENTS.filter(e => e.tag === filter);
  document.getElementById('eventGrid').innerHTML = list.map(e => `
    <div class="ev-card ${e.tag}">
      <div class="ev-card-hd"><span class="ev-tag ${e.tag}">${e.label}</span><span class="ev-card-date">${e.date}</span></div>
      <h3>${e.title}</h3>
      <p>📍 ${e.place}</p>
      <div class="ev-card-ft">
        <span>👥 ${e.inscritos} inscritos</span>
        <button class="btn-gold sm" onclick="inscribir('${e.title}')">Inscribirme</button>
      </div>
    </div>`).join('');
}

// ── COUNTDOWN ──
function startCountdown() {
  const target = new Date('2026-03-15T20:00:00');
  const sets   = [
    ['hcd-d','hcd-h','hcd-m','hcd-s'],
    ['scd-d','scd-h','scd-m','scd-s']
  ];
  function tick() {
    const diff = target - new Date();
    if (diff <= 0) return;
    const d = Math.floor(diff / 864e5);
    const h = Math.floor(diff % 864e5 / 36e5);
    const m = Math.floor(diff % 36e5 / 6e4);
    const s = Math.floor(diff % 6e4 / 1e3);
    const f = n => String(n).padStart(2,'0');
    sets.forEach(([di,hi,mi,si]) => {
      const de = document.getElementById(di); if (de) de.textContent = f(d);
      const he = document.getElementById(hi); if (he) he.textContent = f(h);
      const me = document.getElementById(mi); if (me) me.textContent = f(m);
      const se = document.getElementById(si); if (se) se.textContent = f(s);
    });
  }
  tick(); setInterval(tick, 1000);
}

// ── SORTEO PARTICIPAR ──
let tickets = 0;
window.participar = async function () {
  tickets++;
  document.getElementById('myTickets').textContent = `${tickets} ticket${tickets > 1 ? 's' : ''}`;
  document.getElementById('partBtn').textContent   = `🎲 Participando — ${tickets} ticket${tickets > 1 ? 's' : ''}`;
  showToast(`🎲 ¡Ya tienes ${tickets} ticket${tickets > 1 ? 's' : ''} en el sorteo!`);
  const user = auth.currentUser;
  if (user) {
    try {
      await setDoc(doc(db,'sorteos','marzo2026','participantes', user.uid),
        { tickets, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) { console.warn(e); }
  }
};

// ── SIDEBAR SECTION NAV ──
function setupSidebar() {
  document.querySelectorAll('.sb-link[data-sec]').forEach(btn => {
    btn.addEventListener('click', () => showSec(btn.dataset.sec));
  });
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    const ma = document.getElementById('mainArea');
    if (window.innerWidth <= 768) { sb.classList.toggle('mob-open'); }
    else { sb.classList.toggle('collapsed'); ma.classList.toggle('full'); }
  });
}

window.showSec = function (sec) {
  document.querySelectorAll('.dsec').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
  document.getElementById('sec-' + sec)?.classList.add('active');
  document.querySelector(`[data-sec="${sec}"]`)?.classList.add('active');
};

// ── NOTIFICATIONS ──
function setupNotif() {
  document.getElementById('notifBtn')?.addEventListener('click', () => {
    document.getElementById('notifPanel').classList.toggle('open');
    document.getElementById('notifOverlay').classList.toggle('active');
  });
  document.getElementById('notifClose')?.addEventListener('click', () => {
    document.getElementById('notifPanel').classList.remove('open');
    document.getElementById('notifOverlay').classList.remove('active');
  });
  document.getElementById('notifOverlay')?.addEventListener('click', () => {
    document.getElementById('notifPanel').classList.remove('open');
    document.getElementById('notifOverlay').classList.remove('active');
  });
}

// ── LOGOUT ──
function setupLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await signOut(auth);
    showToast('👋 Sesión cerrada');
    setTimeout(() => { window.location.href = '../index.html'; }, 700);
  });
}

// ── GUARDAR PERFIL ──
function setupProfileSave() {
  document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;
    const name  = document.getElementById('profName').value.trim();
    const phone = document.getElementById('profPhone').value.trim();
    const dist  = document.getElementById('profDist').value;
    const parts = name.split(' ');
    try {
      await setDoc(doc(db,'usuarios', user.uid), {
        nombre:   parts[0] || '',
        apellido: parts.slice(1).join(' ') || '',
        phone, distrito: dist, updatedAt: serverTimestamp()
      }, { merge: true });
      document.getElementById('userName').textContent = name;
      document.getElementById('userDist').textContent = dist;
      showToast('✅ Perfil guardado correctamente');
    } catch (e) {
      showToast('❌ Error: ' + e.message);
    }
  });
}

// ── ACCIONES GENERALES ──
window.celebrate  = name  => showToast(`🎉 ¡Felicitación enviada a ${name}!`);
window.inscribir  = title => showToast(`✅ ¡Te inscribiste en: ${title}!`);
window.addBirthday = ()   => showToast('ℹ️ Próximamente — Agregar cumpleaños');
window.addEvent    = ()   => showToast('ℹ️ Próximamente — Proponer evento');

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.innerHTML = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 3200);
}
