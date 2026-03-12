// =====================================================
//  CONFIGURACIÓN FIREBASE - COMUNIDAD PIURANA
//  Reemplaza los valores con los de tu proyecto Firebase
//  Guía: https://console.firebase.google.com
// =====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD23L7s-Qf7apNAQI0RTEnJQ92pZnSpMeE",
  authDomain: "comunidadpiura-1af5d.firebaseapp.com",
  projectId: "comunidadpiura-1af5d",
  storageBucket: "comunidadpiura-1af5d.firebasestorage.app",
  messagingSenderId: "70654375387",
  appId: "1:70654375387:web:b94f90b587ad8ab75ae3fe",
  measurementId: "G-TND0Z325B4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
