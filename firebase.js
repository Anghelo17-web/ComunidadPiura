// ============================================================
//  js/firebase.js
//  Configuración central de Firebase — compartida por todas las páginas
//  Reemplaza los valores con los de tu proyecto:
//  https://console.firebase.google.com
// ============================================================

import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }     from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyD23L7s-Qf7apNAQI0RTEnJQ92pZnSpMeE",
  authDomain:        "comunidadpiura-1af5d.firebaseapp.com",
  projectId:         "comunidadpiura-1af5d",
  storageBucket:     "comunidadpiura-1af5d.firebasestorage.app",
  messagingSenderId: "70654375387",
  appId:             "1:70654375387:web:a593be41b771a4585ae3fe",
  measurementId:     "G-FH3W8NRRWL"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
