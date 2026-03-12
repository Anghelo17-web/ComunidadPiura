// ============================================
//  COMUNIDAD PIURANA — LOGIN JS
//  Firebase Authentication
// ============================================

import { auth } from '../firebase/config.js';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ── Elementos del DOM ──
const emailInput  = document.getElementById('email');
const passInput   = document.getElementById('password');
const togglePass  = document.getElementById('togglePass');
const btnLogin    = document.getElementById('btnLogin');
const btnText     = document.getElementById('btnText');
const btnLoader   = document.getElementById('btnLoader');
const btnGoogle   = document.getElementById('btnGoogle');
const errorMsg    = document.getElementById('errorMsg');

// ── Toggle contraseña ──
togglePass.addEventListener('click', () => {
  const isPass = passInput.type === 'password';
  passInput.type = isPass ? 'text' : 'password';
  togglePass.textContent = isPass ? '🙈' : '👁';
});

// ── Mostrar error ──
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
}
function hideError() {
  errorMsg.style.display = 'none';
}

// ── Mensajes de error Firebase en español ──
function parseFirebaseError(code) {
  const messages = {
    'auth/user-not-found'   : 'No existe una cuenta con este correo.',
    'auth/wrong-password'   : 'Contraseña incorrecta.',
    'auth/invalid-email'    : 'El correo electrónico no es válido.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  };
  return messages[code] || 'Error al iniciar sesión. Intenta de nuevo.';
}

// ── Loading state ──
function setLoading(state) {
  btnText.style.display   = state ? 'none' : 'inline';
  btnLoader.style.display = state ? 'inline-block' : 'none';
  btnLogin.disabled       = state;
}

// ── Login con email/password ──
btnLogin.addEventListener('click', async () => {
  hideError();
  const email    = emailInput.value.trim();
  const password = passInput.value;

  if (!email || !password) {
    showError('Por favor completa todos los campos.');
    return;
  }

  setLoading(true);
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // ✅ Login exitoso → redirigir al dashboard
    window.location.href = '../dashboard/dashboard.html';
  } catch (err) {
    showError(parseFirebaseError(err.code));
  } finally {
    setLoading(false);
  }
});

// ── Login con Google ──
btnGoogle.addEventListener('click', async () => {
  hideError();
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    window.location.href = '../dashboard/dashboard.html';
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      showError('Error al iniciar con Google. Intenta de nuevo.');
    }
  }
});

// ── Enter en inputs ──
[emailInput, passInput].forEach(input => {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnLogin.click();
  });
});
