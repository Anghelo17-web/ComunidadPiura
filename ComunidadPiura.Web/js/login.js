// js/login.js — Autenticación Firebase (sin onclick en HTML)

import { auth, db } from './firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── ESPERAR A QUE EL DOM ESTÉ LISTO ──
document.addEventListener('DOMContentLoaded', () => {

  // Si ya hay sesión activa → dashboard
  onAuthStateChanged(auth, user => {
    if (user) window.location.href = 'dashboard.html';
  });

  // Abrir tab según hash en la URL
  if (window.location.hash === '#registro') switchTab('registro');

  // ── TABS ──
  document.getElementById('tabA').addEventListener('click', () => switchTab('login'));
  document.getElementById('tabB').addEventListener('click', () => switchTab('registro'));
  document.getElementById('goToRegister')?.addEventListener('click', () => switchTab('registro'));
  document.getElementById('goToLogin')?.addEventListener('click',    () => switchTab('login'));

  // ── OJO (mostrar/ocultar contraseña) ──
  document.getElementById('eyeLogin').addEventListener('click', () => toggleEye('loginPass'));
  document.getElementById('eyeReg').addEventListener('click',   () => toggleEye('regPass'));

  // ── FUERZA DE CONTRASEÑA ──
  document.getElementById('regPass').addEventListener('input', e => checkPassStrength(e.target.value));

  // ── BOTÓN INGRESAR ──
  document.getElementById('btnLogin').addEventListener('click', doLogin);

  // ── BOTÓN REGISTRARSE ──
  document.getElementById('btnRegister').addEventListener('click', doRegister);

  // ── OLVIDÉ CONTRASEÑA — modal dinámico ──
  document.getElementById('btnForgot').addEventListener('click', openForgotModal);
  document.getElementById('modalClose').addEventListener('click', closeForgotModal);
  document.getElementById('forgotModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeForgotModal(); });
  document.getElementById('btnSendReset').addEventListener('click', forgotPass);
});

// ────────────────────────────────────────────
// FUNCIONES
// ────────────────────────────────────────────

function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('fLogin').classList.toggle('hidden', !isLogin);
  document.getElementById('fReg').classList.toggle('hidden',    isLogin);
  document.getElementById('tabA').classList.toggle('active',    isLogin);
  document.getElementById('tabB').classList.toggle('active',   !isLogin);
  document.getElementById('tabInd').classList.toggle('right',  !isLogin);
}

function toggleEye(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

function checkPassStrength(v) {
  let s = 0;
  if (v.length >= 8)           s++;
  if (/[A-Z]/.test(v))         s++;
  if (/[0-9]/.test(v))         s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  const cols = ['#e05252', '#e08852', '#c9a84c', '#52c97a'];
  const ws   = ['25%', '50%', '75%', '100%'];
  const fill = document.getElementById('passFill');
  fill.style.width      = v.length ? ws[Math.max(0, s - 1)]   : '0';
  fill.style.background = v.length ? cols[Math.max(0, s - 1)] : '';
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value;

  if (!email || !pass) { toast('⚠️ Completa todos los campos'); return; }
  loader(true);
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    toast('✅ ¡Bienvenido!');
    setTimeout(() => { loader(false); window.location.href = 'dashboard.html'; }, 800);
  } catch (e) {
    loader(false);
    const msgs = {
      'auth/user-not-found':     'Usuario no encontrado',
      'auth/wrong-password':     'Contraseña incorrecta',
      'auth/invalid-email':      'Correo inválido',
      'auth/invalid-credential': 'Credenciales incorrectas'
    };
    toast('❌ ' + (msgs[e.code] || e.message));
  }
}

async function doRegister() {
  // Validar términos
  if (!document.getElementById('termsChk').checked) {
    toast('⚠️ Debes aceptar los términos y condiciones');
    return;
  }

  const nombre   = document.getElementById('regNombre').value.trim();
  const apellido = document.getElementById('regApellido').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const phone    = document.getElementById('regPhone').value.trim();
  const distrito = document.getElementById('regDistrito').value;
  const birthday = document.getElementById('regBirthday').value;
  const pass     = document.getElementById('regPass').value;

  // Validar campos vacíos
  if (!nombre || !apellido || !email || !phone || !distrito || !birthday || !pass) {
    toast('⚠️ Completa todos los campos del formulario');
    return;
  }
  if (pass.length < 8) {
    toast('⚠️ La contraseña debe tener mínimo 8 caracteres');
    return;
  }

  loader(true);
  try {
    // Crear usuario en Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    // Guardar perfil en Firestore
    await setDoc(doc(db, 'usuarios', cred.user.uid), {
      nombre,
      apellido,
      email,
      phone,
      distrito,
      birthday,
      role:      'miembro',
      createdAt: serverTimestamp()
    });

    toast('🎉 ¡Cuenta creada! Bienvenido a Comunidad Piura');
    setTimeout(() => { loader(false); window.location.href = 'dashboard.html'; }, 900);

  } catch (e) {
    loader(false);
    const msgs = {
      'auth/email-already-in-use': 'Ese correo ya está registrado',
      'auth/weak-password':        'La contraseña es muy débil',
      'auth/invalid-email':        'El correo no es válido'
    };
    toast('❌ ' + (msgs[e.code] || e.message));
  }
}

function openForgotModal() {
  document.getElementById('forgotForm').style.display = 'block';
  document.getElementById('forgotSuccess').style.display = 'none';
  document.getElementById('forgotEmail').value = '';
  document.getElementById('forgotModal').classList.add('open');
}

function closeForgotModal() {
  document.getElementById('forgotModal').classList.remove('open');
}

async function forgotPass() {
  const email = document.getElementById('forgotEmail').value.trim();
  if (!email) { toast('⚠️ Ingresa tu correo'); return; }
  const btn = document.getElementById('btnSendReset');
  btn.disabled = true; btn.textContent = 'Enviando...';
  try {
    await sendPasswordResetEmail(auth, email);
    document.getElementById('forgotForm').style.display = 'none';
    document.getElementById('forgotSuccess').style.display = 'block';
    setTimeout(closeForgotModal, 3500);
  } catch (e) {
    toast('❌ ' + (e.code === 'auth/user-not-found' ? 'Correo no registrado' : e.message));
  } finally {
    btn.disabled = false; btn.textContent = 'Enviar enlace →';
  }
}

// ── HELPERS ──
function toast(msg) {
  const el = document.getElementById('toast');
  el.innerHTML = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3200);
}

function loader(show) {
  document.getElementById('loader').classList.toggle('show', show);
}
