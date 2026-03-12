// js/dashboard.js — Comunidad Piura v2

import { auth, db } from './firebase.js';
import {
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, getDocs, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const ADMIN_EMAIL = 'heinner2212@gmail.com';
let currentUser = null;
let isAdmin     = false;
let allEvents   = [];
let allBdays    = [];
let allMembers  = [];
let currentEventId = null;
let galleryImages  = [];

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const LABELS = { sp:'⚽ Deporte', tr:'✈️ Viaje', cu:'🎉 Cultura', vo:'🤝 Voluntariado' };

// ── AUTH ──
onAuthStateChanged(auth, async user => {
  if (!user) { window.location.href = 'login.html'; return; }
  currentUser = user;
  isAdmin = user.email === ADMIN_EMAIL;
  await loadUserData(user);
  await Promise.all([loadEvents(), loadBirthdays(), loadMembers()]);
  initDashboard();
});

function getInitials(nombre, apellido) {
  return ((nombre||'').charAt(0) + (apellido||'').charAt(0)).toUpperCase() || 'U';
}

// ── CARGAR USUARIO ──
async function loadUserData(user) {
  try {
    const snap = await getDoc(doc(db, 'usuarios', user.uid));
    if (snap.exists()) {
      const d = snap.data();
      document.getElementById('welcomeName').textContent  = d.nombre || user.email.split('@')[0];
      document.getElementById('userName').textContent     = `${d.nombre||''} ${d.apellido||''}`.trim();
      document.getElementById('userAv').textContent       = getInitials(d.nombre, d.apellido);
      document.getElementById('userDist').textContent     = d.distrito || 'Piura';
      document.getElementById('profNombre').value         = d.nombre || '';
      document.getElementById('profApellido').value       = d.apellido || '';
      document.getElementById('profPhone').value          = d.phone || '';
      document.getElementById('profDist').value           = d.distrito || 'Piura';
      document.getElementById('profEmail').value          = user.email || '';
      // Perfil card
      document.getElementById('perfilAv').textContent         = getInitials(d.nombre, d.apellido);
      document.getElementById('perfilNombreCard').textContent  = `${d.nombre||''} ${d.apellido||''}`.trim();
      document.getElementById('perfilRoleCard').textContent    = isAdmin ? '⭐ Administrador' : 'Miembro';
      document.getElementById('perfilDistCard').textContent    = d.distrito || 'Piura';
      document.getElementById('perfilPhoneCard').textContent   = d.phone || '—';
      document.getElementById('perfilEmailCard').textContent   = user.email || '—';
    }
  } catch(e) { console.warn(e); }
}

// ── CARGAR EVENTOS ──
async function loadEvents() {
  try {
    const q    = query(collection(db,'eventos'), orderBy('fecha','asc'));
    const snap = await getDocs(q);
    allEvents  = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!allEvents.length) throw new Error('empty');
  } catch(e) {
    allEvents = [
      { id:'e1', title:'Torneo Interdistrital de Fútbol 7', date:'15 Mar 2026', day:'15', mon:'Mar', place:'Estadio Miguel Grau · 8:00 AM', tag:'sp', label:'⚽ Deporte', inscritos:32, descripcion:'Gran torneo interdistrital con equipos de toda la región Piura. Se jugarán partidos en fase de grupos y eliminación directa. ¡Habrá premiación especial y parrillada al final del evento! Cupo máximo: 8 equipos de 7 jugadores.' },
      { id:'e2', title:'Excursión Cataratas de Huancabamba', date:'22 Mar 2026', day:'22', mon:'Mar', place:'Plaza de Armas · 5:00 AM', tag:'tr', label:'✈️ Viaje', inscritos:18, descripcion:'Excursión de un día a las espectaculares cataratas de Huancabamba. El precio incluye transporte en bus climatizado, guía local certificado y seguro de viaje. Llevar ropa cómoda, zapatillas de trekking y almuerzo. Cupos limitados a 25 personas.' },
      { id:'e3', title:'Festival Gastronómico Piurano', date:'05 Abr 2026', day:'05', mon:'Abr', place:'Parque Infantil · Todo el día', tag:'cu', label:'🎉 Cultura', inscritos:65, descripcion:'Festival con los mejores platos típicos: seco de chabelo, ceviche de mero, ají de maní, tamales y mucho más. Música en vivo con artistas locales, concursos de cocina y presentaciones culturales de los 20 distritos. Entrada libre.' },
      { id:'e4', title:'Limpieza de Playa en Máncora', date:'19 Abr 2026', day:'19', mon:'Abr', place:'Playa Máncora · 7:00 AM', tag:'vo', label:'🤝 Voluntariado', inscritos:41, descripcion:'Jornada de voluntariado ambiental para limpiar la icónica playa de Máncora. Se proveerán guantes, bolsas y snacks. Al terminar habrá almuerzo grupal con vista al mar. Una oportunidad única de cuidar el medio ambiente y fortalecer lazos en la comunidad.' },
      { id:'e5', title:'Viaje Grupal a Cusco', date:'03 May 2026', day:'03', mon:'May', place:'Aeropuerto Piura · Cupos limitados', tag:'tr', label:'✈️ Viaje', inscritos:24, descripcion:'Viaje de 5 días a Cusco. Incluye vuelo ida y vuelta desde Piura, hotel 3 estrellas en el centro histórico, tour a Machu Picchu, Valle Sagrado y Ciudad Imperial. Precio especial para miembros activos. Inscripción con 30% de adelanto.' }
    ];
  }
}

// ── CARGAR CUMPLEAÑOS ──
async function loadBirthdays() {
  try {
    const snap = await getDocs(collection(db,'usuarios'));
    const today = new Date();
    allBdays = snap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter(u => u.birthday)
      .map(u => {
        const bd   = new Date(u.birthday + 'T00:00:00');
        const next = getNextBirthday(bd);
        const diffDays = Math.max(0, Math.ceil((next - today) / 864e5));
        const isToday  = bd.getMonth()===today.getMonth() && bd.getDate()===today.getDate();
        const when = isToday ? 'Hoy 🎂' : diffDays === 1 ? 'Mañana' : `${bd.getDate()} ${MONTHS[bd.getMonth()]}`;
        return { uid: u.uid||d.id, email: u.email, init: getInitials(u.nombre, u.apellido), name: `${u.nombre||''} ${u.apellido||''}`.trim(), district: u.distrito||'Piura', when, isToday, diffDays };
      })
      .sort((a,b) => a.diffDays - b.diffDays);
  } catch(e) { allBdays = []; }
}

// ── CARGAR MIEMBROS ──
async function loadMembers() {
  try {
    const snap = await getDocs(collection(db,'usuarios'));
    allMembers = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  } catch(e) { allMembers = []; }
}

function getNextBirthday(bd) {
  const today = new Date();
  const next  = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
  if (next < today) next.setFullYear(today.getFullYear()+1);
  return next;
}

// ── INIT ──
function initDashboard() {
  setDate(); startCountdown(); renderStats();
  renderHomeEvents(); renderHomeBdays();
  renderBdayGrid('semana'); renderEventGrid('todos');
  renderMembersGrid(allMembers); renderGallery();
  setupAdminUI(); setupSidebar(); setupNotif();
  setupLogout(); setupProfileSave();
  setupEventModal(); setupBdayModal();
  setupGallery(); setupSorteoAdmin();
  setupMemberSearch();
}

function setupAdminUI() {
  // Admin-only elements visible
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  // Member upload hint visible only for members
  document.querySelectorAll('.member-upload-only').forEach(el => {
    el.style.display = !isAdmin ? '' : 'none';
  });
}

function setDate() {
  const el = document.getElementById('pgDate');
  if (!el) return;
  el.innerHTML = `<span style="color:var(--w50);font-size:.77rem;text-transform:capitalize">${new Date().toLocaleDateString('es-PE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>`;
}

function renderStats() {
  document.getElementById('statMembers').textContent = allBdays.length || '—';
  document.getElementById('statEvents').textContent  = allEvents.length;
  document.getElementById('statBdays').textContent   = allBdays.filter(b=>b.diffDays<=7).length;
}

// ── HOME PANELS ──
function renderHomeEvents() {
  document.getElementById('homeEventList').innerHTML = `<div class="ev-list-panel">
    ${allEvents.slice(0,4).map(e=>`
      <div class="ev-row" onclick="openEventDetail('${e.id}')" style="cursor:pointer">
        <div class="ev-dt"><div class="ev-day">${e.day}</div><div class="ev-mon">${e.mon}</div></div>
        <div class="ev-inf"><strong>${e.title}</strong><span>📍 ${e.place}</span></div>
        <span class="ev-tag ${e.tag}">${e.label}</span>
      </div>`).join('')}
  </div>`;
}

function renderHomeBdays() {
  if (!allBdays.length) {
    document.getElementById('homeBdayList').innerHTML = '<p style="color:var(--w30);font-size:.8rem;padding:14px">Sin cumpleaños próximos</p>';
    return;
  }
  document.getElementById('homeBdayList').innerHTML = `<div class="bd-list-panel">
    ${allBdays.slice(0,4).map(b=>`
      <div class="bd-row ${b.isToday?'today':''}">
        <div class="bd-av">${b.init}</div>
        <div class="bd-inf"><strong>${b.name}</strong><span>${b.when} · ${b.district}</span></div>
        ${isAdmin?`<button class="bd-btn" onclick="sendBdayEmail('${b.uid}','${b.name}','${b.email||''}')">🎉</button>`:''}
      </div>`).join('')}
  </div>`;
}

// ── CUMPLEAÑOS ──
window.filterBdays = function(f, btn) {
  btn.closest('.filter-row').querySelectorAll('.fil-btn').forEach(b=>b.classList.remove('act'));
  btn.classList.add('act'); renderBdayGrid(f);
};

function renderBdayGrid(filter='semana') {
  let list = allBdays;
  if (filter==='semana') list = allBdays.filter(b=>b.diffDays<=7);
  else if (filter==='mes') list = allBdays.filter(b=>b.diffDays<=31);
  if (!list.length) {
    document.getElementById('bdayGrid').innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--w30)">
        <div style="font-size:3rem;margin-bottom:14px">🎂</div>
        <p>No hay cumpleaños en este período</p>
      </div>`; return;
  }
  document.getElementById('bdayGrid').innerHTML = list.map(b=>`
    <div class="bd-card ${b.isToday?'today-bd':''}">
      ${b.isToday?'<div class="bd-badge">🎂 HOY</div>':''}
      <div class="bd-card-av">${b.init}</div>
      <h4>${b.name}</h4>
      <p>${b.district}</p>
      <p class="bd-countdown">${b.isToday?'¡Hoy es su día! 🎊':'Faltan '+b.diffDays+' día'+(b.diffDays!==1?'s':'')}</p>
      ${isAdmin?`<button class="btn-submit" style="padding:8px;font-size:.7rem;margin-top:8px;letter-spacing:1px" onclick="sendBdayEmail('${b.uid}','${b.name}','${b.email||''}')">✉️ Enviar saludo</button>`:''}
    </div>`).join('');
}

window.sendBdayEmail = function(uid, name, email) {
  if (!isAdmin) return;
  const firstName = name.split(' ')[0];
  document.getElementById('bdayModalName').textContent  = firstName;
  document.getElementById('bdayModalEmail').textContent = email;
  document.getElementById('bdayModalUid').value         = uid;
  document.getElementById('bdayModal').classList.add('open');
};

function setupBdayModal() {
  document.getElementById('bdayModalClose')?.addEventListener('click', ()=>document.getElementById('bdayModal').classList.remove('open'));
  document.getElementById('bdayModal')?.addEventListener('click', e=>{ if(e.target===e.currentTarget) e.currentTarget.classList.remove('open'); });
  document.getElementById('btnSendBday')?.addEventListener('click', async ()=>{
    const name  = document.getElementById('bdayModalName').textContent;
    const email = document.getElementById('bdayModalEmail').textContent;
    try {
      await setDoc(doc(db,'saludos',`${Date.now()}`),{ para:email, nombre:name, enviadoPor:currentUser.email, fecha:serverTimestamp() });
      showToast(`✅ Saludo enviado a ${name}`);
    } catch(e) { showToast('❌ Error: '+e.message); }
    document.getElementById('bdayModal').classList.remove('open');
    window.open(`mailto:${email}?subject=🎂 ¡Feliz Cumpleaños ${name}! - Comunidad Piura&body=Hola ${name},%0D%0A%0D%0A¡Desde Comunidad Piura te deseamos un feliz cumpleaños! 🎉%0D%0AEsperamos que pases un día increíble rodeado de los tuyos.%0D%0A%0D%0A¡Que los sueños se cumplan!%0D%0AComunidad Piura 🌊`);
  });
}

// ── EVENTOS ──
window.filterEvents = function(f, btn) {
  btn.closest('.filter-row').querySelectorAll('.fil-btn').forEach(b=>b.classList.remove('act'));
  btn.classList.add('act'); renderEventGrid(f);
};

function renderEventGrid(filter) {
  const list = filter==='todos' ? allEvents : allEvents.filter(e=>e.tag===filter);
  if (!list.length) {
    document.getElementById('eventGrid').innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--w30)">
        <div style="font-size:3rem;margin-bottom:14px">📅</div>
        <p>No hay eventos en esta categoría</p>
      </div>`; return;
  }
  document.getElementById('eventGrid').innerHTML = list.map(e=>`
    <div class="ev-card ${e.tag}" onclick="openEventDetail('${e.id}')" style="cursor:pointer">
      <div class="ev-card-hd">
        <span class="ev-tag ${e.tag}">${e.label}</span>
        <span class="ev-card-date">${e.date}</span>
      </div>
      <h3>${e.title}</h3>
      <p>📍 ${e.place}</p>
      <div class="ev-card-ft">
        <span>👥 ${e.inscritos||0} inscritos</span>
        <span style="color:var(--w30);font-size:.72rem">Ver detalles →</span>
      </div>
    </div>`).join('');
}

window.openEventDetail = function(id) {
  currentEventId = id;
  const e = allEvents.find(ev=>ev.id===id);
  if (!e) return;
  document.getElementById('evDetailTag').className   = `ev-tag ${e.tag}`;
  document.getElementById('evDetailTag').textContent = e.label;
  document.getElementById('evDetailTitle').textContent = e.title;
  document.getElementById('evDetailDate').innerHTML    = `📅 <strong>${e.date}</strong>`;
  document.getElementById('evDetailPlace').innerHTML   = `📍 <strong>${e.place}</strong>`;
  document.getElementById('evDetailInscritos').innerHTML = `👥 <strong>${e.inscritos||0} personas inscritas</strong>`;
  document.getElementById('evDetailDesc').textContent  = e.descripcion || 'Sin descripción disponible.';
  // Admin buttons
  const adminBtns = document.getElementById('evDetailAdminBtns');
  if (adminBtns) adminBtns.style.display = isAdmin ? 'flex' : 'none';
  document.getElementById('evDetailModal').classList.add('open');
};

function setupEventModal() {
  document.getElementById('evDetailClose')?.addEventListener('click', ()=>document.getElementById('evDetailModal').classList.remove('open'));
  document.getElementById('evDetailModal')?.addEventListener('click', e=>{ if(e.target===e.currentTarget) e.currentTarget.classList.remove('open'); });
  document.getElementById('btnAddEvent')?.addEventListener('click', ()=>openEventForm());
  document.getElementById('evFormClose')?.addEventListener('click', ()=>closeEvForm());
  document.getElementById('evFormModal')?.addEventListener('click', e=>{ if(e.target===e.currentTarget) closeEvForm(); });
  document.getElementById('evFormSave')?.addEventListener('click', saveEvent);
  // Admin btns in detail modal
  document.getElementById('evDetailEditBtn')?.addEventListener('click', ()=>{
    document.getElementById('evDetailModal').classList.remove('open');
    openEventForm(currentEventId);
  });
  document.getElementById('evDetailDeleteBtn')?.addEventListener('click', ()=>{
    document.getElementById('evDetailModal').classList.remove('open');
    deleteEvent(currentEventId);
  });
}

function closeEvForm() {
  document.getElementById('evFormModal').style.display = 'none';
  document.getElementById('evFormModal').classList.remove('open');
}

function openEventForm(id=null) {
  if (!isAdmin) return;
  const e = id ? allEvents.find(ev=>ev.id===id) : null;
  document.getElementById('evFormTitle').textContent = e ? 'Editar Evento' : 'Nuevo Evento';
  document.getElementById('evFormId').value          = e?.id || '';
  document.getElementById('evFormName').value        = e?.title || '';
  document.getElementById('evFormDate').value        = e?.date || '';
  document.getElementById('evFormPlace').value       = e?.place || '';
  document.getElementById('evFormTag').value         = e?.tag || 'sp';
  document.getElementById('evFormInscritos').value   = e?.inscritos || 0;
  document.getElementById('evFormDesc').value        = e?.descripcion || '';
  document.getElementById('evFormModal').style.display = '';
  document.getElementById('evFormModal').classList.add('open');
}

window.deleteEvent = async id => {
  if (!isAdmin || !confirm('¿Eliminar este evento?')) return;
  try {
    await deleteDoc(doc(db,'eventos',id));
    allEvents = allEvents.filter(e=>e.id!==id);
    renderEventGrid('todos'); renderHomeEvents();
    showToast('🗑️ Evento eliminado');
  } catch(e) { showToast('❌ '+e.message); }
};

async function saveEvent() {
  if (!isAdmin) return;
  const id = document.getElementById('evFormId').value;
  const title       = document.getElementById('evFormName').value.trim();
  const date        = document.getElementById('evFormDate').value.trim();
  const place       = document.getElementById('evFormPlace').value.trim();
  const tag         = document.getElementById('evFormTag').value;
  const inscritos   = parseInt(document.getElementById('evFormInscritos').value)||0;
  const descripcion = document.getElementById('evFormDesc').value.trim();
  if (!title||!date||!place) { showToast('⚠️ Completa título, fecha y lugar'); return; }
  const parts = date.split(' ');
  const data  = { title, date, day:parts[0]||'', mon:parts[1]||'', place, tag, label:LABELS[tag]||tag, inscritos, descripcion, fecha:date, updatedAt:serverTimestamp() };
  try {
    if (id) {
      await updateDoc(doc(db,'eventos',id), data);
      const idx = allEvents.findIndex(e=>e.id===id);
      if (idx!==-1) allEvents[idx] = { id, ...data };
      showToast('✅ Evento actualizado');
    } else {
      const ref = await addDoc(collection(db,'eventos'),{ ...data, createdAt:serverTimestamp() });
      allEvents.push({ id:ref.id, ...data });
      showToast('✅ Evento creado');
    }
    renderEventGrid('todos'); renderHomeEvents();
    closeEvForm();
  } catch(e) { showToast('❌ '+e.message); }
}

// ── MIEMBROS ──
function renderMembersGrid(members) {
  if (!members.length) {
    document.getElementById('membersGrid').innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--w30)">
        <div style="font-size:3rem;margin-bottom:14px">👥</div>
        <p>No se encontraron miembros</p>
      </div>`; return;
  }
  document.getElementById('membersGrid').innerHTML = members.map(m=>`
    <div class="member-card">
      <div class="member-av">${getInitials(m.nombre, m.apellido)}</div>
      <h4>${m.nombre||''} ${m.apellido||''}</h4>
      <p>${m.distrito||'Piura'}</p>
      <span class="member-role ${m.role==='admin'?'admin':'miembro'}">${m.role==='admin'?'⭐ Admin':'Miembro'}</span>
    </div>`).join('');
}

function setupMemberSearch() {
  document.getElementById('memberSearch')?.addEventListener('input', e=>{
    const q = e.target.value.toLowerCase();
    const filtered = allMembers.filter(m=>
      (`${m.nombre||''} ${m.apellido||''}`).toLowerCase().includes(q) ||
      (m.distrito||'').toLowerCase().includes(q)
    );
    renderMembersGrid(filtered);
  });
}

// ── GALERÍA ──
function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  // Restore admin add button
  const adminUploadBar = document.querySelector('.gallery-upload-bar');
  // Render saved images
  let html = '';
  galleryImages.forEach((src, i) => {
    html += `
      <div class="gallery-item" onclick="openGalleryImg('${src}')">
        <img src="${src}" alt="Foto ${i+1}" loading="lazy"/>
        <div class="gallery-overlay">
          <span style="color:#fff;font-size:1.3rem">🔍</span>
          ${isAdmin ? `<span onclick="event.stopPropagation();removeGalleryImg(${i})" style="color:var(--red);font-size:1.1rem;cursor:pointer">🗑️</span>` : ''}
        </div>
      </div>`;
  });
  if (!isAdmin) {
    html += `<div class="gallery-add member-upload-only" style="display:block">
      <label style="cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;height:100%;width:100%">
        <div class="gallery-add-icon">📷</div>
        <span>Proponer foto</span>
        <input type="file" id="galleryMemberInput" accept="image/*" style="display:none"/>
      </label>
    </div>`;
  }
  if (html) grid.innerHTML = html;
  else grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--w30)"><div style="font-size:3rem;margin-bottom:14px">🖼️</div><p>Aún no hay fotos. ${isAdmin?'¡Sube la primera!':'¡Pronto habrá recuerdos aquí!'}</p></div>`;
}

function setupGallery() {
  // Admin upload
  document.getElementById('galleryUploadInput')?.addEventListener('change', e=>{
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        galleryImages.push(ev.target.result);
        renderGallery();
        showToast('📷 Foto agregada a la galería');
      };
      reader.readAsDataURL(file);
    });
  });
  // Gallery modal
  document.getElementById('galleryModalClose')?.addEventListener('click', ()=>document.getElementById('galleryModal').classList.remove('open'));
  document.getElementById('galleryModal')?.addEventListener('click', e=>{ if(e.target===e.currentTarget) e.currentTarget.classList.remove('open'); });
}

window.openGalleryImg = function(src) {
  document.getElementById('galleryModalImg').src = src;
  document.getElementById('galleryModal').classList.add('open');
};

window.removeGalleryImg = function(idx) {
  if (!isAdmin || !confirm('¿Eliminar esta foto?')) return;
  galleryImages.splice(idx,1);
  renderGallery();
  showToast('🗑️ Foto eliminada');
};

// ── SORTEO ADMIN ──
function setupSorteoAdmin() {
  if (!isAdmin) return;
  // Load into inputs
  const tituloEl  = document.getElementById('sorteoTituloInput');
  const descEl    = document.getElementById('sorteoDescInput');
  const premioEl  = document.getElementById('sorteoPremioInput');
  const fechaEl   = document.getElementById('sorteoFechaInput');
  if (tituloEl) tituloEl.value = document.getElementById('sorteoTitulo')?.textContent || '';
  if (premioEl) premioEl.value = 'Viaje a Cusco (inscripción gratuita)';
  if (fechaEl)  fechaEl.value  = '15 Mar 2026';

  document.getElementById('saveSorteoBtn')?.addEventListener('click', ()=>{
    const titulo = tituloEl?.value.trim();
    const desc   = descEl?.value.trim();
    const premio = premioEl?.value.trim();
    const fecha  = fechaEl?.value.trim();
    if (titulo) document.getElementById('sorteoTitulo').textContent = titulo;
    if (desc)   document.getElementById('sorteoDesc').textContent   = desc;
    if (premio) document.getElementById('sorteoPremioDisplay').textContent = premio;
    if (fecha)  document.getElementById('sorteoFechaDisplay').textContent  = fecha;
    showToast('✅ Sorteo actualizado');
  });

  // Image upload
  document.getElementById('sorteoImgInput')?.addEventListener('change', e=>{
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const wrap = document.getElementById('sorteoImgWrap');
      const img  = document.getElementById('sorteoImgDisplay');
      const uploadArea = document.getElementById('sorteoImgUpload');
      img.src = ev.target.result;
      wrap.style.display = '';
      // Show thumbnail in upload area
      const preview = document.createElement('img');
      preview.src = ev.target.result;
      preview.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:10px';
      uploadArea.querySelector('img')?.remove();
      uploadArea.insertBefore(preview, uploadArea.firstChild);
      showToast('🖼️ Imagen del sorteo cargada');
    };
    reader.readAsDataURL(file);
  });
}

// ── COUNTDOWN ──
function startCountdown() {
  const target = new Date('2026-03-15T20:00:00');
  const sets = [['hcd-d','hcd-h','hcd-m','hcd-s'],['scd-d','scd-h','scd-m','scd-s']];
  function tick() {
    const diff = target - new Date(); if (diff<=0) return;
    const vals = [Math.floor(diff/864e5),Math.floor(diff%864e5/36e5),Math.floor(diff%36e5/6e4),Math.floor(diff%6e4/1e3)];
    sets.forEach(ids=>ids.forEach((elId,i)=>{ const el=document.getElementById(elId); if(el) el.textContent=String(vals[i]).padStart(2,'0'); }));
  }
  tick(); setInterval(tick,1000);
}

// ── SORTEO PARTICIPAR ──
let tickets = 0;
window.participar = async function() {
  tickets++;
  document.getElementById('myTickets').textContent = `${tickets} ticket${tickets>1?'s':''}`;
  document.getElementById('partBtn').textContent   = `🎲 Participando — ${tickets} ticket${tickets>1?'s':''}`;
  showToast(`🎲 ¡Ya tienes ${tickets} ticket${tickets>1?'s':''} en el sorteo!`);
  if (currentUser) {
    try { await setDoc(doc(db,'sorteos','marzo2026','participantes',currentUser.uid),{ tickets, updatedAt:serverTimestamp() },{ merge:true }); }
    catch(e) { console.warn(e); }
  }
};

// ── SIDEBAR ──
function setupSidebar() {
  document.querySelectorAll('.sb-link[data-sec]').forEach(btn=>{
    btn.addEventListener('click',()=>{ showSec(btn.dataset.sec); if(window.innerWidth<=768) closeMobileSidebar(); });
  });
  document.getElementById('sidebarToggle')?.addEventListener('click',()=>{
    const sb=document.getElementById('sidebar'), ma=document.getElementById('mainArea');
    if(window.innerWidth<=768){ sb.classList.toggle('mob-open'); document.getElementById('sidebarOverlay').classList.toggle('active'); }
    else { sb.classList.toggle('collapsed'); ma.classList.toggle('full'); }
  });
  document.getElementById('sidebarClose')?.addEventListener('click', closeMobileSidebar);
  document.getElementById('sidebarOverlay')?.addEventListener('click', closeMobileSidebar);
}

function closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('mob-open');
  document.getElementById('sidebarOverlay')?.classList.remove('active');
}

window.showSec = function(sec) {
  document.querySelectorAll('.dsec').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.sb-link').forEach(l=>l.classList.remove('active'));
  document.getElementById('sec-'+sec)?.classList.add('active');
  document.querySelector(`[data-sec="${sec}"]`)?.classList.add('active');
};

// ── NOTIF ──
function setupNotif() {
  document.getElementById('notifBtn')?.addEventListener('click',()=>{
    document.getElementById('notifPanel').classList.toggle('open');
    document.getElementById('notifOverlay').classList.toggle('active');
  });
  ['notifClose','notifOverlay'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>{
    document.getElementById('notifPanel').classList.remove('open');
    document.getElementById('notifOverlay').classList.remove('active');
  }));
}

// ── LOGOUT ──
function setupLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', async()=>{
    await signOut(auth);
    showToast('👋 Sesión cerrada');
    setTimeout(()=>{ window.location.href='../index.html'; },700);
  });
}

// ── PERFIL ──
function setupProfileSave() {
  document.getElementById('saveProfileBtn')?.addEventListener('click', async()=>{
    if (!currentUser) return;
    const nombre   = document.getElementById('profNombre').value.trim();
    const apellido = document.getElementById('profApellido').value.trim();
    const phone    = document.getElementById('profPhone').value.trim();
    const dist     = document.getElementById('profDist').value;
    try {
      await setDoc(doc(db,'usuarios',currentUser.uid),{ nombre, apellido, phone, distrito:dist, updatedAt:serverTimestamp() },{ merge:true });
      const fullName = `${nombre} ${apellido}`.trim();
      document.getElementById('userName').textContent         = fullName;
      document.getElementById('userDist').textContent         = dist;
      document.getElementById('userAv').textContent           = getInitials(nombre, apellido);
      document.getElementById('perfilNombreCard').textContent = fullName;
      document.getElementById('perfilAv').textContent         = getInitials(nombre, apellido);
      document.getElementById('perfilDistCard').textContent   = dist;
      document.getElementById('perfilPhoneCard').textContent  = phone;
      document.getElementById('welcomeName').textContent      = nombre;
      showToast('✅ Perfil guardado correctamente');
    } catch(e) { showToast('❌ '+e.message); }
  });
}

// ── TOAST ──
function showToast(msg) {
  const t=document.getElementById('toast');
  t.innerHTML=msg; t.classList.add('show');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),3200);
}
