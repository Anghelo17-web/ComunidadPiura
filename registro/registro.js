// ============================================
//  COMUNIDAD PIURANA — REGISTRO JS
//  Firebase Authentication + Firestore
// ============================================

import { auth, db } from '../firebase/config.js';
import { createUserWithEmailAndPassword, updateProfile }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Elementos DOM ──
const step1      = document.getElementById('step1');
const step2      = document.getElementById('step2');
const btnNext    = document.getElementById('btnNext');
const btnBack    = document.getElementById('btnBack');
const btnRegister= document.getElementById('btnRegister');
const btnText    = document.getElementById('btnText');
const btnLoader  = document.getElementById('btnLoader');
const errorMsg   = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');
const passInput  = document.getElementById('password');
const togglePass = document.getElementById('togglePass');
const passStrength= document.getElementById('passStrength');
const strengthFill= document.getElementById('strengthFill');
const strengthLabel= document.getElementById('strengthLabel');

// ── Mensajes ──
function showError(msg) { errorMsg.textContent = msg; errorMsg.style.display = 'block'; successMsg.style.display = 'none'; }
function showSuccess(msg) { successMsg.textContent = msg; successMsg.style.display = 'block'; errorMsg.style.display = 'none'; }
function hideMessages() { errorMsg.style.display = 'none'; successMsg.style.display = 'none'; }

// ── Toggle contraseña ──
togglePass.addEventListener('click', () => {
  const isPass = passInput.type === 'password';
  passInput.type = isPass ? 'text' : 'password';
  togglePass.textContent = isPass ? '🙈' : '👁';
});

// ── Fuerza de contraseña ──
passInput.addEventListener('input', () => {
  const val = passInput.value;
  if (!val) { passStrength.style.display = 'none'; return; }
  passStrength.style.display = 'block';

  let score = 0;
  if (val.length >= 8)  score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { w: '25%',  color: '#ef4444', label: 'Muy débil' },
    { w: '50%',  color: '#f97316', label: 'Débil' },
    { w: '75%',  color: '#eab308', label: 'Media' },
    { w: '100%', color: '#22c55e', label: 'Fuerte' },
  ];
  const lvl = levels[Math.max(score - 1, 0)];
  strengthFill.style.width    = lvl.w;
  strengthFill.style.background = lvl.color;
  strengthLabel.textContent   = lvl.label;
  strengthLabel.style.color   = lvl.color;
});

// ── Paso 1 → Paso 2 ──
btnNext.addEventListener('click', () => {
  hideMessages();
  const nombres   = document.getElementById('nombres').value.trim();
  const apellidos = document.getElementById('apellidos').value.trim();
  const username  = document.getElementById('username').value.trim();
  const fechaNac  = document.getElementById('fechaNac').value;

  if (!nombres || !apellidos || !username || !fechaNac) {
    showError('Por favor completa los campos obligatorios (*).');
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    showError('El nombre de usuario solo puede tener letras, números y guiones bajos.');
    return;
  }

  // Validar edad mínima (6 años)
  const hoy   = new Date();
  const nacimiento = new Date(fechaNac);
  const edad  = hoy.getFullYear() - nacimiento.getFullYear();
  if (edad < 6) {
    showError('La edad mínima para registrarse es 6 años.');
    return;
  }

  step1.style.display = 'none';
  step2.style.display = 'block';
});

// ── Paso 2 → Paso 1 ──
btnBack.addEventListener('click', () => {
  hideMessages();
  step2.style.display = 'none';
  step1.style.display = 'block';
});

// ── Loading ──
function setLoading(state) {
  btnText.style.display   = state ? 'none' : 'inline';
  btnLoader.style.display = state ? 'inline-block' : 'none';
  btnRegister.disabled    = state;
}

// ── Firebase error messages ──
function parseError(code) {
  const msgs = {
    'auth/email-already-in-use': 'Este correo ya está registrado.',
    'auth/invalid-email'       : 'El correo no es válido.',
    'auth/weak-password'       : 'La contraseña es muy débil (mínimo 6 caracteres).',
  };
  return msgs[code] || 'Error al crear la cuenta. Intenta de nuevo.';
}

// ── Registro ──
btnRegister.addEventListener('click', async () => {
  hideMessages();

  const email       = document.getElementById('email').value.trim();
  const password    = document.getElementById('password').value;
  const confirmPass = document.getElementById('confirmPass').value;
  const acepta      = document.getElementById('aceptaTerminos').checked;

  // Validaciones
  if (!email || !password || !confirmPass) {
    showError('Completa todos los campos obligatorios.'); return;
  }
  if (password !== confirmPass) {
    showError('Las contraseñas no coinciden.'); return;
  }
  if (password.length < 8) {
    showError('La contraseña debe tener al menos 8 caracteres.'); return;
  }
  if (!acepta) {
    showError('Debes aceptar los términos y condiciones.'); return;
  }

  // Datos del paso 1
  const nombres   = document.getElementById('nombres').value.trim();
  const apellidos = document.getElementById('apellidos').value.trim();
  const username  = document.getElementById('username').value.trim();
  const fechaNac  = document.getElementById('fechaNac').value;
  const genero    = document.getElementById('genero').value;
  const telefono  = document.getElementById('telefono').value.trim();
  const distrito  = document.getElementById('distrito').value;

  setLoading(true);
  try {
    // 1. Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Actualizar displayName
    await updateProfile(user, { displayName: `${nombres} ${apellidos}` });

    // 3. Guardar datos en Firestore
    await setDoc(doc(db, 'usuarios', user.uid), {
      uid       : user.uid,
      nombres,
      apellidos,
      nombreCompleto: `${nombres} ${apellidos}`,
      username,
      email,
      fechaNac,           // formato "YYYY-MM-DD" — usado para cumpleaños
      genero,
      telefono,
      distrito,
      rol       : 'miembro',
      activo    : true,
      creadoEn  : serverTimestamp(),
      fotoURL   : '',
    });

    showSuccess('¡Cuenta creada exitosamente! Redirigiendo...');
    setTimeout(() => {
      window.location.href = '../dashboard/dashboard.html';
    }, 1800);
  } catch (err) {
    showError(parseError(err.code));
  } finally {
    setLoading(false);
  }
});
