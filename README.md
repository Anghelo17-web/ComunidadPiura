# 🌟 Comunidad Piurana — Guía de Instalación

## Estructura del proyecto

```
comunidad-piurana/
├── index.html              ← Página de inicio (landing)
├── css/index.css
├── js/index.js
├── login/
│   ├── login.html
│   ├── login.css
│   └── login.js
├── registro/
│   ├── registro.html
│   ├── registro.css
│   └── registro.js
├── dashboard/
│   ├── dashboard.html
│   ├── dashboard.css
│   └── dashboard.js
└── firebase/
    └── config.js           ← ⚠️ Aquí van tus credenciales
```

---

## 🔥 Paso a paso: Configurar Firebase

### 1. Crear proyecto en Firebase
1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Haz clic en **"Crear un proyecto"**
3. Ponle el nombre: `comunidad-piurana` (o el que prefieras)
4. Desactiva Google Analytics (opcional) → **Crear proyecto**

### 2. Habilitar Authentication
1. En el menú izquierdo: **Build → Authentication**
2. Clic en **"Comenzar"**
3. Pestaña **"Sign-in method"** → Habilita:
   - ✅ **Correo electrónico/contraseña**
   - ✅ **Google** (para el botón "Continuar con Google")

### 3. Crear Firestore Database
1. En el menú: **Build → Firestore Database**
2. Clic en **"Crear base de datos"**
3. Selecciona **"Modo de prueba"** (para empezar)
4. Elige la región más cercana (ej: `us-central1`)

### 4. Crear colecciones en Firestore
Crea estas colecciones manualmente desde la consola:
- `usuarios` — se llena automáticamente al registrarse
- `eventos` — agrega documentos con campos: `titulo`, `descripcion`, `dia`, `mes`, `fecha`, `tipo`
- `anuncios` — campos: `titulo`, `cuerpo`, `creadoEn`
- `reconocimientos` — campos: `nombre`, `razon`, `periodo`, `emoji`
- `foro` — se llena automáticamente con los mensajes

### 5. Obtener credenciales
1. Ve a **Configuración del proyecto** (ícono ⚙️)
2. Sección **"Tus apps"** → Haz clic en **"</>"** (Web)
3. Registra la app con el nombre que quieras
4. Copia el objeto `firebaseConfig`

### 6. Pegar credenciales en el proyecto
Abre `firebase/config.js` y reemplaza los valores:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 7. Reglas de Firestore (seguridad básica)
En Firebase Console → Firestore → **Reglas**, pega esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios: solo el dueño puede editar su perfil
    match /usuarios/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    // Foro, eventos, anuncios: cualquier autenticado puede leer
    match /{collection}/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🚀 Cómo ejecutar el proyecto

El proyecto usa módulos ES (import/export), así que necesitas un servidor local.

**Opción A — VS Code (recomendado):**
1. Instala la extensión **"Live Server"**
2. Clic derecho en `index.html` → **"Open with Live Server"**

**Opción B — Python:**
```bash
python -m http.server 8000
# Abre: http://localhost:8000
```

**Opción C — Node.js:**
```bash
npx serve .
```

---

## 📋 Colecciones de Firestore — Estructura

### `usuarios` (se crea al registrarse)
```json
{
  "uid": "...",
  "nombres": "Juan",
  "apellidos": "García",
  "nombreCompleto": "Juan García",
  "username": "juangarcia",
  "email": "juan@email.com",
  "fechaNac": "1995-04-22",
  "genero": "masculino",
  "telefono": "+51 999999999",
  "distrito": "Piura",
  "rol": "miembro",
  "activo": true,
  "creadoEn": "timestamp"
}
```

### `eventos` (crear manualmente o desde panel admin)
```json
{
  "titulo": "Torneo Interbarrios",
  "descripcion": "Fútbol masculino — Estadio Municipal",
  "dia": 15,
  "mes": "ABR",
  "fecha": "2025-04-15",
  "tipo": "Deporte"
}
```

### `anuncios`
```json
{
  "titulo": "Bienvenida a nuevos miembros",
  "cuerpo": "Este mes se unieron 12 nuevos miembros...",
  "creadoEn": "timestamp"
}
```

---

## ✅ Funcionalidades incluidas

- 🏠 Landing page elegante con animaciones
- 🔐 Login con email/contraseña + Google
- 📝 Registro en 2 pasos con validaciones
- 📊 Dashboard con sidebar de navegación
- 🎂 Sección de cumpleaños filtrable por mes
- 📅 Próximos eventos
- 👥 Directorio de miembros con búsqueda
- 📢 Anuncios de la comunidad
- 🏆 Reconocimientos
- 💬 Foro en tiempo real (Firebase Realtime)
- 👤 Perfil personal
- 📱 Diseño responsive (móvil/desktop)
