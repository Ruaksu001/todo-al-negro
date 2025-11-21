# 📂 Estructura del Proyecto - Casino Online

## ✅ Estructura Organizada y Limpia

```
miapp/
│
├── 📂 controllers/                    # Lógica de negocio
│   └── usuariosController.js          # Controlador de usuarios (register, login, perfil)
│
├── 📂 middleware/                     # Middleware de autenticación
│   └── auth.js                        # Verificación de tokens JWT
│
├── 📂 models/                         # Modelos de MongoDB
│   ├── Usuario.js                     # Esquema de usuarios (nombre, saldo, transacciones)
│   └── GameState.js                   # Esquema de estado del juego (ruleta)
│
├── 📂 routes/                         # Rutas de la API REST
│   └── api/
│       └── usuarios.js                # Endpoints: /register, /login, /perfil, /saldo, /transacciones
│
├── 📂 views/                          # Vistas Handlebars del Casino
│   ├── layouts/
│   │   └── main.handlebars            # Layout principal
│   ├── index.handlebars               # Página de inicio
│   ├── login.handlebars               # Login con fetch API ✅
│   ├── register.handlebars            # Registro con fetch API ✅
│   ├── perfil.handlebars              # Perfil con carga dinámica JWT ✅
│   ├── lobby.handlebars               # Lobby del casino
│   ├── transacciones.handlebars       # Historial de transacciones
│   ├── home.handlebars                # Home
│   ├── welcome.handlebars             # Bienvenida
│   ├── about.handlebars               # Acerca de
│   ├── baseslegales.handlebars        # Bases legales
│   ├── forgot.handlebars              # Recuperar contraseña
│   └── reset-password.handlebars      # Resetear contraseña
│
├── 📂 public/                         # Archivos estáticos
│   ├── css/
│   │   └── estilos.css                # Estilos del casino
│   ├── js/
│   │   ├── ruleta.js                  # Lógica de la ruleta
│   │   └── transacciones.js           # Lógica de transacciones
│   └── img/
│       ├── Logo.png
│       ├── logo blanco.png
│       ├── ojo_abierto.png
│       ├── ojo_cerrado.png
│       └── ruleta.png
│
├── 📄 index.js                        # ⚡ Servidor principal (Express + Socket.IO)
├── 📄 package.json                    # Dependencias del proyecto
├── 📄 package-lock.json               # Lock de versiones
│
├── 📄 .env                            # Variables de entorno (MongoDB, JWT_SECRET)
├── 📄 .gitignore                      # Archivos ignorados por Git
│
├── 📄 README.md                       # 📖 Documentación principal
└── 📄 SEPARACION_FRONTEND_BACKEND.md  # 📖 Documentación técnica de la separación
```

---

## 🗑️ Archivos Eliminados (No interactuaban con el casino)

### ❌ Carpeta `public/ejemplos/` completa
- `api-moneda.html`
- `index.html`
- `login-jwt.html`
- `perfil-jwt.html`
- `promesas-ejemplos.html`

### ❌ Documentación redundante
- `API.md`
- `GUIA_VERIFICACION.md`
- `README_MODULO.md`
- `RESUMEN_IMPLEMENTACION.md`

### ❌ Backups antiguos
- `index.backup-2025-10-09-1832.js`

---

## ✅ Archivos que SÍ interactúan con el Casino

### 🎯 Backend (API REST + Base de Datos)

| Archivo | Propósito | Interacción |
|---------|-----------|-------------|
| `controllers/usuariosController.js` | Lógica de negocio | Procesa registro, login, perfil, saldo |
| `middleware/auth.js` | Autenticación JWT | Protege rutas del casino |
| `models/Usuario.js` | Modelo de usuario | Guarda datos de jugadores |
| `models/GameState.js` | Estado del juego | Guarda historial de ruleta |
| `routes/api/usuarios.js` | Endpoints REST | API para login, registro, perfil |
| `index.js` | Servidor principal | Maneja todas las rutas y Socket.IO |

### 🎨 Frontend (Vistas del Casino)

| Vista | Propósito | Interacción |
|-------|-----------|-------------|
| `login.handlebars` | Inicio de sesión | Llama a `/api/usuarios/login` |
| `register.handlebars` | Registro | Llama a `/api/usuarios/register` |
| `perfil.handlebars` | Perfil de usuario | Carga datos con JWT |
| `lobby.handlebars` | Lobby del casino | Acceso a juegos |
| `transacciones.handlebars` | Historial | Muestra apuestas y ganancias |
| `home.handlebars` | Inicio | Navegación principal |
| `welcome.handlebars` | Bienvenida | Primera pantalla |

### 🎲 JavaScript del Casino

| Archivo | Propósito |
|---------|-----------|
| `public/js/ruleta.js` | Lógica de la ruleta, apuestas, giros |
| `public/js/transacciones.js` | Manejo de historial de transacciones |
| `public/css/estilos.css` | Estilos visuales del casino |

---

## 🔧 Configuración Actual

### Variables de Entorno (`.env`)
```env
MONGODB_URI=mongodb://localhost:27017/casino
JWT_SECRET=tu_clave_secreta
PORT=80
```

### Dependencias Principales (`package.json`)
```json
{
  "express": "^5.1.0",
  "mongoose": "^8.19.1",
  "handlebars": "^8.0.3",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^6.0.0",
  "socket.io": "^4.8.1",
  "cors": "^2.8.5"
}
```

---

## 📊 Estadísticas del Proyecto

- **Total de archivos:** 33 archivos
- **Líneas de código:** ~2000+ líneas
- **Modelos:** 2 (Usuario, GameState)
- **Controladores:** 1 (Usuarios)
- **Rutas API:** 5 endpoints
- **Vistas:** 13 páginas Handlebars
- **Scripts frontend:** 2 archivos JS
- **Imágenes:** 5 archivos

---

## 🎯 Flujo de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO DEL CASINO                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (Views + JS)                      │
│  • login.handlebars    • perfil.handlebars                   │
│  • register.handlebars • lobby.handlebars                    │
│  • ruleta.js           • transacciones.js                    │
└─────────────────────────────────────────────────────────────┘
                            │
                    fetch() + JWT token
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 API REST (/api/usuarios/*)                   │
│  • POST /register     • GET  /perfil                         │
│  • POST /login        • PUT  /saldo                          │
│  • GET  /transacciones                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                    Middleware JWT
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONTROLADORES                             │
│  • register()  • login()  • getProfile()                     │
│  • updateBalance()  • getTransactions()                      │
└─────────────────────────────────────────────────────────────┘
                            │
                    Mongoose ODM
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     MONGODB DATABASE                         │
│  Collection: usuarios                                        │
│  Collection: gamestates                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Resultado Final

✨ **Proyecto limpio y organizado**
- ❌ Sin archivos de ejemplo
- ❌ Sin documentación redundante
- ❌ Sin backups antiguos
- ✅ Solo código que interactúa con el casino
- ✅ Estructura modular y profesional
- ✅ Separación clara Frontend/Backend

🎰 **¡Listo para producción!**
