// ============================================
//  COMUNIDAD PIURANA — DASHBOARD JS (v2)
//  Rediseño completo: Juegos, Sorteo, Cumpleaños
// ============================================

import { auth, db } from '../firebase/config.js';
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection, onSnapshot, query, orderBy, limit,
  addDoc, serverTimestamp, getDocs, doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Estado global ──
let currentUser     = null;
let currentUserData = null;
let isAdmin         = false;
let countdownInterval = null;

// ── Fecha de hoy ──
const hoy = new Date();
document.getElementById('fechaHoy').textContent =
  hoy.toLocaleDateString('es-PE', { weekday:'long', day:'numeric', month:'long' });

// ── Auth guard ──
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = '../login/login.html'; return; }
  currentUser = user;
  await loadUserData(user.uid);
  initDashboard();
});

// ── Cargar datos del usuario ──
async function loadUserData(uid) {
  const snap = await getDoc(doc(db, 'usuarios', uid));
  if (snap.exists()) {
    currentUserData = snap.data();
    isAdmin = currentUserData.rol === 'admin';
    const nombre = currentUserData.nombres || currentUser?.displayName || 'Miembro';
    document.getElementById('userNameDisplay').textContent = nombre;
    document.getElementById('userAvatar').textContent = nombre.charAt(0).toUpperCase();
    // Mostrar botón exportar solo para admin
    if (isAdmin) {
      const btnExp = document.getElementById('btnExportCumples');
      if (btnExp) btnExp.style.display = 'flex';
    }
  }
}

// ── Cerrar sesión ──
document.getElementById('btnLogout').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = '../login/login.html';
});

// ── Navegación del sidebar ──
document.querySelectorAll('.nav-item, .ver-mas').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.section;
    if (!section) return;
    navigateTo(section);
  });
});

function navigateTo(sectionId) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.section-page').forEach(s => s.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
  const page    = document.getElementById(`sec-${sectionId}`);
  if (navItem) navItem.classList.add('active');
  if (page)    page.classList.add('active');
  if (sectionId === 'cumpleanos')      loadCumpleanos();
  if (sectionId === 'eventos')         loadEventos();
  if (sectionId === 'miembros')        loadMiembros();
  if (sectionId === 'anuncios')        loadAnuncios();
  if (sectionId === 'reconocimientos') loadReconocimientos();
  if (sectionId === 'foro')            initForo();
  if (sectionId === 'perfil')          loadPerfil();
  if (sectionId === 'sorteo')          loadSorteo();
}

// ── Sidebar toggle móvil ──
const sidebar  = document.getElementById('sidebar');
const overlay  = document.getElementById('sidebarOverlay');
document.getElementById('sidebarToggle').addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('visible');
});
overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('visible');
});

// ====================================================
//  INICIO
// ====================================================
async function initDashboard() {
  await loadStats();
  loadCumpleanosPreview();
  loadEventosPreview();
  loadAnunciosPreview();
}

async function loadStats() {
  try {
    const snapMiembros = await getDocs(collection(db, 'usuarios'));
    document.getElementById('totalMiembros').textContent = snapMiembros.size;
    const mesActual = hoy.getMonth() + 1;
    let cumplesMes = 0;
    snapMiembros.forEach(d => {
      const data = d.data();
      if (data.fechaNac) {
        const mes = parseInt(data.fechaNac.split('-')[1]);
        if (mes === mesActual) cumplesMes++;
      }
    });
    document.getElementById('cumplesMes').textContent = cumplesMes;
    const snapEventos  = await getDocs(collection(db, 'eventos'));
    document.getElementById('eventosProx').textContent = snapEventos.size;
    const snapAnuncios = await getDocs(collection(db, 'anuncios'));
    document.getElementById('anunciosCount').textContent = snapAnuncios.size;
  } catch (err) { console.error('Error cargando stats:', err); }
}

// ====================================================
//  CUMPLEAÑOS
// ====================================================
function loadCumpleanosPreview() {
  const container = document.getElementById('cumpleanosPreview');
  const mesActual = hoy.getMonth() + 1;
  const diaActual = hoy.getDate();
  getDocs(collection(db, 'usuarios')).then(snap => {
    const cumples = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.fechaNac) {
        const [,mesStr, diaStr] = data.fechaNac.split('-');
        const mes = parseInt(mesStr), dia = parseInt(diaStr);
        if (mes === mesActual) cumples.push({ ...data, dia, mes });
      }
    });
    cumples.sort((a,b) => a.dia - b.dia);
    if (!cumples.length) { container.innerHTML = '<p class="empty-text">Sin cumpleaños este mes.</p>'; return; }
    container.innerHTML = cumples.slice(0,5).map(c => {
      const esHoy = c.dia === diaActual;
      return `<div class="cumple-item">
        <div class="c-avatar">${(c.nombres||'?').charAt(0).toUpperCase()}</div>
        <div class="c-info">
          <h4>${c.nombreCompleto || c.nombres}${esHoy ? ' <span class="today-badge">¡Hoy!</span>' : ''}</h4>
          <p>${c.distrito || 'Comunidad Piurana'}</p>
        </div>
        <div class="c-date">${c.dia} ${mesNombre(c.mes)}</div>
      </div>`;
    }).join('');
  }).catch(() => { container.innerHTML = '<p class="empty-text">Error al cargar.</p>'; });
}

function loadCumpleanos() {
  const grid   = document.getElementById('cumpleGrid');
  const tabsEl = document.getElementById('monthTabs');
  const meses  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  let mesSeleccionado = hoy.getMonth() + 1;

  tabsEl.innerHTML = meses.map((m, i) =>
    `<button class="month-tab ${i+1===mesSeleccionado?'active':''}" data-mes="${i+1}">${m}</button>`
  ).join('');
  tabsEl.querySelectorAll('.month-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      tabsEl.querySelectorAll('.month-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mesSeleccionado = parseInt(btn.dataset.mes);
      renderCumplesMes(mesSeleccionado, grid);
    });
  });

  // Botón exportar solo admin
  const btnExp = document.getElementById('btnExportCumples');
  if (btnExp && isAdmin) {
    btnExp.style.display = 'flex';
    btnExp.onclick = exportarCumpleanosExcel;
  }

  renderCumplesMes(mesSeleccionado, grid);
}

function renderCumplesMes(mes, container) {
  container.innerHTML = '<div class="skeleton-list"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>';
  getDocs(collection(db, 'usuarios')).then(snap => {
    const cumples = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.fechaNac) {
        const parts = data.fechaNac.split('-');
        if (parseInt(parts[1]) === mes) {
          cumples.push({ id: d.id, ...data, dia: parseInt(parts[2]) });
        }
      }
    });
    cumples.sort((a,b) => a.dia - b.dia);
    if (!cumples.length) { container.innerHTML = '<p class="empty-text">Sin cumpleaños en este mes.</p>'; return; }

    const diaHoy = hoy.getDate();
    container.innerHTML = cumples.map(c => {
      const esHoy   = c.dia === diaHoy && mes === hoy.getMonth()+1;
      const diasFaltan = calcularDiasFaltan(c.dia, mes);
      const inicial = (c.nombres||'?').charAt(0).toUpperCase();
      return `<div class="cumple-card ${esHoy?'today':''}">
        <div class="cumple-avatar">${inicial}</div>
        <div class="cumple-info">
          <h4>${c.nombreCompleto || c.nombres}${esHoy ? ' <span class="today-badge">¡Hoy!</span>' : ''}</h4>
          <p>${c.dia} de ${mesNombreLargo(mes)}${c.distrito ? ' · ' + c.distrito : ''}</p>
        </div>
        <div class="cumple-dias">
          <span class="dias-num">${esHoy ? '🎂' : diasFaltan}</span>
          <span class="dias-label">${esHoy ? 'es hoy' : 'días'}</span>
        </div>
      </div>`;
    }).join('');
  });
}

function calcularDiasFaltan(dia, mes) {
  const anio  = hoy.getFullYear();
  let fechaCumple = new Date(anio, mes - 1, dia);
  if (fechaCumple < hoy) fechaCumple = new Date(anio + 1, mes - 1, dia);
  const diff = Math.ceil((fechaCumple - hoy) / (1000*60*60*24));
  return diff;
}

async function exportarCumpleanosExcel() {
  const snap = await getDocs(collection(db, 'usuarios'));
  const cumples = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.fechaNac) {
      const parts = data.fechaNac.split('-');
      const dia = parseInt(parts[2]), mes = parseInt(parts[1]);
      const diasFaltan = calcularDiasFaltan(dia, mes);
      cumples.push({
        Nombre: data.nombreCompleto || data.nombres || '—',
        'Fecha de Cumpleaños': `${dia} de ${mesNombreLargo(mes)}`,
        'Días que Faltan': diasFaltan
      });
    }
  });
  cumples.sort((a,b) => a['Días que Faltan'] - b['Días que Faltan']);

  // Exportar CSV con BOM para Excel (compatible sin librerías)
  const BOM = '\uFEFF';
  const headers = Object.keys(cumples[0]);
  const csvContent = BOM + [
    headers.join(','),
    ...cumples.map(row => headers.map(h => `"${row[h]}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'cumpleanos-comunidad-piurana.csv';
  a.click(); URL.revokeObjectURL(url);
}

// ====================================================
//  EVENTOS
// ====================================================
function loadEventosPreview() {
  const container = document.getElementById('eventosPreview');
  getDocs(query(collection(db, 'eventos'), orderBy('fecha'), limit(3))).then(snap => {
    if (snap.empty) { container.innerHTML = '<p class="empty-text">Sin eventos próximos.</p>'; return; }
    container.innerHTML = snap.docs.map(d => eventoItemHTML(d.data())).join('');
  }).catch(() => { container.innerHTML = '<p class="empty-text">No se pudo cargar.</p>'; });
}

function loadEventos() {
  const container = document.getElementById('eventosList');
  container.innerHTML = '<div class="skeleton-list"><div class="skel"></div><div class="skel"></div></div>';
  getDocs(query(collection(db, 'eventos'), orderBy('fecha'))).then(snap => {
    if (snap.empty) { container.innerHTML = '<p class="empty-text">No hay eventos registrados.</p>'; return; }
    container.innerHTML = snap.docs.map(d => {
      const ev = d.data();
      return `<div class="evento-item">
        <div class="evento-date"><span>${ev.dia||'--'}</span><small>${ev.mes||'--'}</small></div>
        <div class="evento-info"><h4>${ev.titulo||'Sin título'}</h4><p>${ev.descripcion||''}</p></div>
        <span class="evento-tag">${ev.tipo||'Evento'}</span>
      </div>`;
    }).join('');
  }).catch(() => { container.innerHTML = '<p class="empty-text">Error al cargar eventos.</p>'; });
}

function eventoItemHTML(ev) {
  return `<div class="cumple-item">
    <div class="c-avatar" style="background:linear-gradient(135deg,#0891b2,#0e7490)"><i class="fa-solid fa-calendar-day" style="font-size:.85rem"></i></div>
    <div class="c-info"><h4>${ev.titulo||'Evento'}</h4><p>${ev.descripcion||''}</p></div>
    <div class="c-date">${ev.dia||''} ${ev.mes||''}</div>
  </div>`;
}

// ====================================================
//  ANUNCIOS
// ====================================================
function loadAnunciosPreview() {
  const container = document.getElementById('anunciosPreview');
  getDocs(query(collection(db, 'anuncios'), orderBy('creadoEn', 'desc'), limit(3))).then(snap => {
    if (snap.empty) { container.innerHTML = '<p class="empty-text">Sin anuncios.</p>'; return; }
    container.innerHTML = snap.docs.map(d => anuncioItemHTML(d.data())).join('');
  }).catch(() => { container.innerHTML = '<p class="empty-text">No se pudo cargar.</p>'; });
}

function loadAnuncios() {
  const container = document.getElementById('anunciosList');
  container.innerHTML = '<div class="skeleton-list"><div class="skel"></div><div class="skel"></div></div>';
  getDocs(query(collection(db, 'anuncios'), orderBy('creadoEn', 'desc'))).then(snap => {
    if (snap.empty) { container.innerHTML = '<p class="empty-text">No hay anuncios.</p>'; return; }
    container.innerHTML = snap.docs.map(d => anuncioItemHTML(d.data())).join('');
  }).catch(() => { container.innerHTML = '<p class="empty-text">Error al cargar.</p>'; });
}

function anuncioItemHTML(an) {
  const fecha = an.creadoEn?.toDate?.()?.toLocaleDateString('es-PE') || '';
  return `<div class="anuncio-item">
    <div class="anuncio-item__header"><h4>${an.titulo||'Anuncio'}</h4><span class="anuncio-item__fecha">${fecha}</span></div>
    <p>${an.cuerpo||''}</p>
  </div>`;
}

// ====================================================
//  MIEMBROS
// ====================================================
function loadMiembros() {
  const container = document.getElementById('miembrosGrid');
  const searchInput = document.getElementById('searchMiembro');
  container.innerHTML = '<div class="skeleton-list"><div class="skel"></div><div class="skel"></div></div>';
  getDocs(collection(db, 'usuarios')).then(snap => {
    const miembros = [];
    snap.forEach(d => miembros.push(d.data()));
    function render(lista) {
      if (!lista.length) { container.innerHTML = '<p class="empty-text">Sin resultados.</p>'; return; }
      container.innerHTML = lista.map(m => {
        const inicial = (m.nombres||'?').charAt(0).toUpperCase();
        return `<div class="miembro-card">
          <div class="big-avatar">${inicial}</div>
          <h4>${m.nombreCompleto||m.nombres}</h4>
          <p>@${m.username||'—'}</p>
          <p>${m.distrito||''}</p>
        </div>`;
      }).join('');
    }
    render(miembros);
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      render(miembros.filter(m =>
        (m.nombreCompleto||'').toLowerCase().includes(q) ||
        (m.username||'').toLowerCase().includes(q)
      ));
    });
  }).catch(() => { container.innerHTML = '<p class="empty-text">Error al cargar.</p>'; });
}

// ====================================================
//  RECONOCIMIENTOS
// ====================================================
function loadReconocimientos() {
  const container = document.getElementById('reconocimientosGrid');
  container.innerHTML = '<div class="skeleton-list"><div class="skel"></div><div class="skel"></div></div>';
  getDocs(collection(db, 'reconocimientos')).then(snap => {
    if (snap.empty) {
      container.innerHTML = `
        <div class="reconocimiento-card"><div class="trophy">🥇</div><h4>Miembro del Mes</h4><p>Por destacar en torneos y actividades comunitarias</p><div class="medal">Próximamente</div></div>
        <div class="reconocimiento-card"><div class="trophy">🥈</div><h4>Mejor Deportista</h4><p>Reconocimiento al atleta más comprometido</p><div class="medal">Próximamente</div></div>
        <div class="reconocimiento-card"><div class="trophy">🥉</div><h4>Espíritu Piurano</h4><p>Por promover la cultura y tradiciones de Piura</p><div class="medal">Próximamente</div></div>`;
      return;
    }
    container.innerHTML = snap.docs.map(d => {
      const r = d.data();
      return `<div class="reconocimiento-card">
        <div class="trophy">${r.emoji||'🏆'}</div>
        <h4>${r.nombre||'—'}</h4>
        <p>${r.razon||''}</p>
        <div class="medal">${r.periodo||''}</div>
      </div>`;
    }).join('');
  }).catch(() => { container.innerHTML = '<p class="empty-text">Error al cargar.</p>'; });
}

// ====================================================
//  FORO
// ====================================================
let foroUnsubscribe = null;
function initForo() {
  const messagesEl = document.getElementById('foroMessages');
  const inputEl    = document.getElementById('foroMsgInput');
  const sendBtn    = document.getElementById('foroSend');
  if (foroUnsubscribe) foroUnsubscribe();
  const q = query(collection(db, 'foro'), orderBy('creadoEn'), limit(50));
  foroUnsubscribe = onSnapshot(q, (snap) => {
    if (snap.empty) { messagesEl.innerHTML = '<p class="empty-text">Sé el primero en escribir.</p>'; return; }
    messagesEl.innerHTML = snap.docs.map(d => {
      const m = d.data();
      const esPropio = m.uid === currentUser?.uid;
      const hora = m.creadoEn?.toDate?.()?.toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' }) || '';
      return `<div class="foro-msg ${esPropio?'own':''}">
        <div class="foro-avatar">${(m.autor||'?').charAt(0).toUpperCase()}</div>
        <div class="foro-msg__body">
          <div class="foro-msg__header"><span class="foro-msg__name">${m.autor||'Anónimo'}</span><span class="foro-msg__time">${hora}</span></div>
          <div class="foro-msg__text">${m.texto}</div>
        </div>
      </div>`;
    }).join('');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
  async function sendMsg() {
    const texto = inputEl.value.trim();
    if (!texto || !currentUser) return;
    inputEl.value = '';
    await addDoc(collection(db, 'foro'), {
      texto, uid: currentUser.uid,
      autor: currentUserData?.nombres || currentUser.displayName || 'Miembro',
      creadoEn: serverTimestamp(),
    });
  }
  sendBtn.onclick = sendMsg;
  inputEl.onkeydown = (e) => { if (e.key === 'Enter') sendMsg(); };
}

// ====================================================
//  PERFIL
// ====================================================
function loadPerfil() {
  const container = document.getElementById('perfilCard');
  if (!currentUserData) { container.innerHTML = '<p class="empty-text">No se pudo cargar el perfil.</p>'; return; }
  const d = currentUserData;
  const inicial = (d.nombres||'?').charAt(0).toUpperCase();
  container.innerHTML = `
    <div class="big-avatar">${inicial}</div>
    <h2>${d.nombreCompleto||d.nombres||'—'}</h2>
    <p class="username">@${d.username||'—'}</p>
    <div class="perfil-data">
      <div class="perfil-row"><label>Correo</label><span>${d.email||'—'}</span></div>
      <div class="perfil-row"><label>Fecha de nacimiento</label><span>${formatFecha(d.fechaNac)}</span></div>
      <div class="perfil-row"><label>Género</label><span>${capitalize(d.genero)||'—'}</span></div>
      <div class="perfil-row"><label>Teléfono</label><span>${d.telefono||'—'}</span></div>
      <div class="perfil-row"><label>Distrito</label><span>${d.distrito||'—'}</span></div>
      <div class="perfil-row"><label>Rol</label><span>${capitalize(d.rol)||'Miembro'}</span></div>
    </div>`;
}

// ====================================================
//  SORTEO
// ====================================================
async function loadSorteo() {
  // Mostrar panel admin si es admin
  const adminPanel = document.getElementById('adminSorteoPanel');
  if (isAdmin) adminPanel.style.display = 'block';

  // Cargar datos actuales del sorteo
  try {
    const sorteoSnap = await getDoc(doc(db, 'sorteo', 'actual'));
    if (sorteoSnap.exists()) {
      renderSorteoPublico(sorteoSnap.data());
    }
  } catch(e) { console.log('Sin sorteo guardado'); }

  // Admin: manejar formulario
  if (isAdmin) {
    setupAdminSorteo();
  }
}

function renderSorteoPublico(data) {
  if (data.imagenBase64) {
    document.getElementById('sorteoImgDisplay').src = data.imagenBase64;
    document.getElementById('sorteoImgDisplay').style.display = 'block';
    document.getElementById('sorteoNoImg').style.display = 'none';
  }
  if (data.premio) document.getElementById('sorteoNombrePremio').textContent = data.premio;
  if (data.descripcion) document.getElementById('sorteoDescPublic').textContent = data.descripcion;
  if (data.fecha) {
    const d = new Date(data.fecha + 'T00:00:00');
    document.getElementById('sorteoFechaDisplay').textContent = d.toLocaleDateString('es-PE', { day:'numeric', month:'long', year:'numeric' });
    iniciarCountdown(new Date(data.fecha + 'T23:59:59'));
  }
  if (data.precio) document.getElementById('sorteoPrecioDisplay').textContent = data.precio;

  // Generar link WhatsApp
  const premioPalabraWA = data.premio || 'el sorteo';
  const msg = encodeURIComponent(
    `Hola Anghelo! 👋 Quiero participar en el sorteo de *${premioPalabraWA}*.\n\nAquí dejo la captura del pago 📸\n\nMi nombre es: \nTeléfono: \nDistrito: `
  );
  document.getElementById('btnWhatsapp').href = `https://wa.me/51XXXXXXXXX?text=${msg}`;
  // 👆 Reemplaza 51XXXXXXXXX con tu número de WhatsApp real
}

function iniciarCountdown(fechaObjetivo) {
  if (countdownInterval) clearInterval(countdownInterval);
  function actualizar() {
    const ahora = new Date();
    const diff  = fechaObjetivo - ahora;
    if (diff <= 0) {
      document.getElementById('cdDias').textContent = '00';
      document.getElementById('cdHoras').textContent = '00';
      document.getElementById('cdMin').textContent = '00';
      document.getElementById('cdSeg').textContent = '00';
      clearInterval(countdownInterval);
      return;
    }
    const dias  = Math.floor(diff / (1000*60*60*24));
    const horas = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
    const min   = Math.floor((diff % (1000*60*60)) / (1000*60));
    const seg   = Math.floor((diff % (1000*60)) / 1000);
    document.getElementById('cdDias').textContent  = String(dias).padStart(2,'0');
    document.getElementById('cdHoras').textContent = String(horas).padStart(2,'0');
    document.getElementById('cdMin').textContent   = String(min).padStart(2,'0');
    document.getElementById('cdSeg').textContent   = String(seg).padStart(2,'0');
  }
  actualizar();
  countdownInterval = setInterval(actualizar, 1000);
}

function setupAdminSorteo() {
  const fileInput     = document.getElementById('sorteoImgInput');
  const fileLabel     = document.querySelector('.file-upload-label');
  const previewWrap   = document.getElementById('sorteoImgPreview');
  const previewImg    = document.getElementById('sorteoImgPreviewImg');
  const removeBtn     = document.getElementById('removeSorteoImg');
  const btnSave       = document.getElementById('btnSaveSorteo');
  let imagenBase64    = null;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      imagenBase64 = ev.target.result;
      previewImg.src = imagenBase64;
      previewWrap.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  removeBtn.addEventListener('click', () => {
    imagenBase64 = null;
    previewWrap.style.display = 'none';
    fileInput.value = '';
  });

  btnSave.addEventListener('click', async () => {
    const premio      = document.getElementById('sorteoPremio').value.trim();
    const descripcion = document.getElementById('sorteoDescripcion').value.trim();
    const fecha       = document.getElementById('sorteoFecha').value;
    const precio      = document.getElementById('sorteoPrecio').value.trim();

    if (!premio) { alert('Ingresa el nombre del premio'); return; }

    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando…';

    try {
      const sorteoData = { premio, descripcion, fecha, precio, actualizadoEn: serverTimestamp() };
      if (imagenBase64) sorteoData.imagenBase64 = imagenBase64;

      await setDoc(doc(db, 'sorteo', 'actual'), sorteoData, { merge: true });
      renderSorteoPublico(sorteoData);
      btnSave.innerHTML = '<i class="fa-solid fa-check"></i> ¡Publicado!';
      setTimeout(() => {
        btnSave.disabled = false;
        btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar y publicar';
      }, 2500);
    } catch(err) {
      console.error(err);
      alert('Error al guardar: ' + err.message);
      btnSave.disabled = false;
      btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar y publicar';
    }
  });
}

// ====================================================
//  JUEGOS — PUPILETRAS
// ====================================================
const PALABRAS_PIURA = [
  'PIURA', 'SULLANA', 'TUMBES', 'CATACAOS', 'MANCORA',
  'CEBICHE', 'SECO', 'TORTILLA', 'NATILLAS', 'CLARITO',
  'COMUNIDAD', 'PIURANO', 'FUTBOL', 'CULTURA', 'FIESTA'
];

const COLS = 14, ROWS = 12;
let selectedCells = [];
let foundWords     = [];
let isDragging     = false;
let placedWords    = [];

document.querySelectorAll('.btn-jugar').forEach(btn => {
  btn.addEventListener('click', () => {
    const game = btn.dataset.game;
    if (game === 'pupiletras') launchPupiletras();
  });
});

document.getElementById('btnBackJuegos').addEventListener('click', () => {
  document.getElementById('juegosView').style.display = 'block';
  document.getElementById('panelPupiletras').style.display = 'none';
  foundWords = []; selectedCells = [];
});

function launchPupiletras() {
  document.getElementById('juegosView').style.display = 'none';
  document.getElementById('panelPupiletras').style.display = 'block';
  generarPupiletras();
}

function generarPupiletras() {
  foundWords = []; selectedCells = []; placedWords = [];
  const palabras = [...PALABRAS_PIURA].sort(() => Math.random() - .5).slice(0, 10);
  document.getElementById('wordsTotal').textContent = palabras.length;
  document.getElementById('wordsFound').textContent = 0;

  // Crear grilla vacía
  const grid = Array.from({length: ROWS}, () => Array(COLS).fill(''));

  // Direcciones posibles
  const dirs = [
    [0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]
  ];

  placedWords = [];
  for (const word of palabras) {
    let placed = false;
    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      const startRow = Math.floor(Math.random() * ROWS);
      const startCol = Math.floor(Math.random() * COLS);
      const cells = [];
      let valid = true;
      for (let i = 0; i < word.length; i++) {
        const r = startRow + dir[0]*i;
        const c = startCol + dir[1]*i;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) { valid = false; break; }
        if (grid[r][c] !== '' && grid[r][c] !== word[i]) { valid = false; break; }
        cells.push({r, c});
      }
      if (valid) {
        cells.forEach((cell, i) => { grid[cell.r][cell.c] = word[i]; });
        placedWords.push({ word, cells });
        placed = true;
      }
    }
  }

  // Rellenar con letras aleatorias
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] === '') grid[r][c] = letras[Math.floor(Math.random()*26)];

  // Renderizar grilla
  const gridEl = document.getElementById('letterGrid');
  gridEl.style.gridTemplateColumns = `repeat(${COLS}, 34px)`;
  gridEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'letter-cell';
      cell.textContent = grid[r][c];
      cell.dataset.r = r; cell.dataset.c = c;
      gridEl.appendChild(cell);
    }
  }

  // Lista de palabras
  const wordListEl = document.getElementById('wordList');
  wordListEl.innerHTML = placedWords.map(pw =>
    `<div class="word-item" id="word-${pw.word}">${pw.word}</div>`
  ).join('');

  // Eventos de selección
  setupGridEvents(gridEl);
}

function setupGridEvents(gridEl) {
  gridEl.addEventListener('mousedown', (e) => {
    const cell = e.target.closest('.letter-cell');
    if (!cell) return;
    isDragging = true;
    selectedCells = [cell];
    cell.classList.add('selected');
  });
  gridEl.addEventListener('mouseover', (e) => {
    if (!isDragging) return;
    const cell = e.target.closest('.letter-cell');
    if (!cell) return;
    const first = selectedCells[0];
    const r0 = parseInt(first.dataset.r), c0 = parseInt(first.dataset.c);
    const r1 = parseInt(cell.dataset.r),  c1 = parseInt(cell.dataset.c);
    // Limpiar selección anterior
    gridEl.querySelectorAll('.letter-cell.selected').forEach(c => {
      if (!c.classList.contains('found')) c.classList.remove('selected');
    });
    selectedCells = getCellsInLine(r0, c0, r1, c1, gridEl);
    selectedCells.forEach(c => { if (!c.classList.contains('found')) c.classList.add('selected'); });
  });
  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    checkSelection();
    gridEl.querySelectorAll('.letter-cell.selected').forEach(c => {
      if (!c.classList.contains('found')) c.classList.remove('selected');
    });
    selectedCells = [];
  });
  // Touch soporte básico
  gridEl.addEventListener('touchstart', (e) => {
    const cell = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)?.closest('.letter-cell');
    if (!cell) return;
    isDragging = true; selectedCells = [cell]; cell.classList.add('selected');
  }, {passive:true});
  gridEl.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const cell = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)?.closest('.letter-cell');
    if (!cell) return;
    const first = selectedCells[0];
    const r0 = parseInt(first.dataset.r), c0 = parseInt(first.dataset.c);
    const r1 = parseInt(cell.dataset.r),  c1 = parseInt(cell.dataset.c);
    gridEl.querySelectorAll('.letter-cell.selected').forEach(c => { if (!c.classList.contains('found')) c.classList.remove('selected'); });
    selectedCells = getCellsInLine(r0, c0, r1, c1, gridEl);
    selectedCells.forEach(c => { if (!c.classList.contains('found')) c.classList.add('selected'); });
  }, {passive:true});
  gridEl.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    checkSelection();
    gridEl.querySelectorAll('.letter-cell.selected').forEach(c => { if (!c.classList.contains('found')) c.classList.remove('selected'); });
    selectedCells = [];
  });
}

function getCellsInLine(r0, c0, r1, c1, gridEl) {
  const dr = r1 - r0, dc = c1 - c0;
  const len = Math.max(Math.abs(dr), Math.abs(dc));
  if (len === 0) return [gridEl.querySelector(`[data-r="${r0}"][data-c="${c0}"]`)].filter(Boolean);
  const cells = [];
  for (let i = 0; i <= len; i++) {
    const r = Math.round(r0 + dr * i / len);
    const c = Math.round(c0 + dc * i / len);
    const cell = gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (cell) cells.push(cell);
  }
  return cells;
}

function checkSelection() {
  const word = selectedCells.map(c => c.textContent).join('');
  const wordRev = word.split('').reverse().join('');
  const match = placedWords.find(pw => pw.word === word || pw.word === wordRev);
  if (match && !foundWords.includes(match.word)) {
    foundWords.push(match.word);
    selectedCells.forEach(c => { c.classList.remove('selected'); c.classList.add('found'); });
    const wordEl = document.getElementById(`word-${match.word}`);
    if (wordEl) wordEl.classList.add('found');
    document.getElementById('wordsFound').textContent = foundWords.length;
    if (foundWords.length === placedWords.length) {
      setTimeout(() => alert('🎉 ¡Encontraste todas las palabras! ¡Felicitaciones piurano!'), 300);
    }
  }
}

// ====================================================
//  UTILIDADES
// ====================================================
const MESES       = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function mesNombre(n)      { return MESES[n-1]||''; }
function mesNombreLargo(n) { return MESES_LARGO[n-1]||''; }
function capitalize(str)   { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }
function formatFecha(f) {
  if (!f) return '—';
  const [y,m,d] = f.split('-');
  return `${d} de ${mesNombreLargo(parseInt(m))} de ${y}`;
}
