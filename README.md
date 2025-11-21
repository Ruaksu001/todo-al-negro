# 🎰 Casino Online - Todo al Negro

Sistema de casino online con autenticación JWT, ruleta interactiva y gestión de transacciones en tiempo real.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [API REST](#api-rest)
- [Arquitectura](#arquitectura)

---

## ✨ Características

- 🔐 **Autenticación JWT** - Login y registro con tokens seguros
- 🎲 **Ruleta Interactiva** - Sistema de apuestas en tiempo real
- 💰 **Gestión de Saldo** - Control de transacciones y historial
- 👤 **Perfiles de Usuario** - Información personal y seguridad
- 🔄 **Comunicación Asíncrona** - Frontend separado del backend
- 📱 **Responsive** - Interfaz adaptable a dispositivos móviles
- ⚡ **Socket.IO** - Actualizaciones en tiempo real

---

## 🛠️ Tecnologías

### Backend
- **Node.js** - Entorno de ejecución
- **Express 5.1.0** - Framework web
- **MongoDB + Mongoose 8.19.1** - Base de datos NoSQL
- **JWT (jsonwebtoken)** - Autenticación con tokens
- **bcrypt 6.0.0** - Encriptación de contraseñas
- **Socket.IO 4.8.1** - WebSockets para tiempo real
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **Handlebars 8.0.3** - Motor de plantillas
- **Fetch API** - Peticiones HTTP asíncronas
- **JavaScript ES6+** - async/await, Promesas
- **CSS3** - Estilos personalizados

---

## 📁 Estructura del Proyecto

```
miapp/
├── 📂 controllers/           # Lógica de negocio
│   └── usuariosController.js
├── 📂 middleware/            # Middleware de autenticación
│   └── auth.js
├── 📂 models/                # Modelos de base de datos
│   ├── Usuario.js
│   └── GameState.js
├── 📂 routes/                # Rutas de la API
│   └── api/
│       └── usuarios.js
├── 📂 views/                 # Vistas Handlebars
│   ├── layouts/
│   │   └── main.handlebars
│   ├── login.handlebars
│   ├── register.handlebars
│   ├── perfil.handlebars
│   ├── lobby.handlebars
│   ├── transacciones.handlebars
│   └── ...
├── 📂 public/                # Archivos estáticos
│   ├── css/
│   │   └── estilos.css
│   ├── js/
│   │   ├── ruleta.js
│   │   └── transacciones.js
│   └── img/
├── 📄 index.js               # Archivo principal del servidor
├── 📄 package.json           # Dependencias del proyecto
├── 📄 .env                   # Variables de entorno
└── 📄 SEPARACION_FRONTEND_BACKEND.md  # Documentación técnica
```

---

## 🚀 Instalación

### Prerrequisitos
- Node.js v14+ instalado
- MongoDB instalado y corriendo
- Git (opcional)

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/Ruaksu001/todo-al-negro.git
cd miapp
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env
touch .env
```

Agregar al archivo `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/casino
JWT_SECRET=tu_clave_secreta_super_segura
PORT=80
```

4. **Iniciar MongoDB** (si no está corriendo)
```bash
# Linux/Mac
sudo systemctl start mongodb

# Windows
net start MongoDB
```

---

## ⚙️ Configuración

### Base de Datos

El proyecto se conecta automáticamente a MongoDB. Asegúrate de que:
- MongoDB esté corriendo en `localhost:27017`
- La base de datos se llame `casino` (o modifica en `.env`)

### Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `MONGODB_URI` | URI de conexión a MongoDB | `mongodb://localhost:27017/casino` |
| `JWT_SECRET` | Clave secreta para JWT | (requerido) |
| `PORT` | Puerto del servidor | `80` |

---

## 🎮 Uso

### Iniciar el servidor

```bash
node index.js
```

El servidor estará disponible en `http://localhost:80`

### Rutas principales

- **`/`** - Página de inicio
- **`/register`** - Registro de usuarios
- **`/login`** - Inicio de sesión
- **`/perfil`** - Perfil del usuario (requiere autenticación)
- **`/lobby`** - Lobby del casino (requiere autenticación)
- **`/transacciones`** - Historial de transacciones

### Flujo de Usuario

1. **Registrarse** en `/register`
2. **Iniciar sesión** en `/login`
3. **Acceder al perfil** para ver saldo
4. **Jugar en la ruleta** desde el lobby
5. **Ver historial** en transacciones

---

## 🔌 API REST

### Endpoints Públicos

#### `POST /api/usuarios/register`
Registrar nuevo usuario

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "usuario": "juanperez",
  "correo": "juan@example.com",
  "contraseña": "password123",
  "seguridad": "mi_pregunta_secreta",
  "fecha": "1990-01-15"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Pérez",
    "usuario": "juanperez",
    "correo": "juan@example.com"
  }
}
```

#### `POST /api/usuarios/login`
Iniciar sesión

**Body:**
```json
{
  "usuario": "juanperez",
  "contraseña": "password123"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "507f1f77bcf86cd799439011",
    "usuario": "juanperez",
    "saldo": 1000
  }
}
```

---

### Endpoints Protegidos

Requieren header: `Authorization: Bearer <token>`

#### `GET /api/usuarios/perfil`
Obtener información del perfil

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "usuario": {
    "id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Pérez",
    "usuario": "juanperez",
    "correo": "juan@example.com",
    "saldo": 1000,
    "fecha": "1990-01-15T00:00:00.000Z"
  }
}
```

#### `PUT /api/usuarios/saldo`
Actualizar saldo del usuario

**Body:**
```json
{
  "nuevoSaldo": 1500
}
```

#### `GET /api/usuarios/transacciones`
Obtener historial de transacciones

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "transacciones": [
    {
      "tipo": "apuesta",
      "monto": -100,
      "fecha": "2025-11-21T10:30:00.000Z",
      "descripcion": "Apuesta a número 7"
    }
  ]
}
```

---

## 🏗️ Arquitectura

### Separación Frontend/Backend

El proyecto implementa una **arquitectura desacoplada**:

```
┌─────────────────┐         ┌─────────────────┐
│   FRONTEND      │         │    BACKEND      │
│  (Handlebars)   │ ◄────► │  (Express API)  │
│                 │  fetch  │                 │
│  - Views HTML   │  JSON   │  - Controllers  │
│  - JavaScript   │         │  - Models       │
│  - localStorage │         │  - Middleware   │
└─────────────────┘         └─────────────────┘
                                    │
                                    ▼
                            ┌─────────────────┐
                            │    MongoDB      │
                            │   (Database)    │
                            └─────────────────┘
```

### Flujo de Autenticación

```
1. Usuario envía credenciales → POST /api/usuarios/login
2. Backend valida con bcrypt → Genera JWT
3. Frontend recibe token → Guarda en localStorage
4. Peticiones protegidas → Header Authorization: Bearer <token>
5. Middleware valida token → Permite acceso a recursos
```

### Modelos de Datos

#### Usuario
```javascript
{
  nombre: String,
  usuario: String (único),
  correo: String (único),
  contraseña: String (hash bcrypt),
  seguridad: String,
  fecha: Date,
  saldo: Number (default: 1000),
  historialTransacciones: Array
}
```

#### GameState
```javascript
{
  _id: 'main_game_state',
  historialGanadores: Array,
  historialApuestas: Array
}
```

---

## 🔒 Seguridad

- ✅ Contraseñas encriptadas con **bcrypt** (10 salt rounds)
- ✅ Tokens JWT con expiración de **24 horas**
- ✅ Validación de tokens en middleware
- ✅ CORS configurado para producción
- ✅ Variables sensibles en `.env`
- ✅ Validaciones en frontend y backend

---

## 📝 Conceptos Implementados

### ✅ Asincronismo
- `async/await` en todas las operaciones asíncronas
- Promesas con `fetch()` en el frontend
- Callbacks con Mongoose

### ✅ API REST
- Endpoints RESTful con Express
- Respuestas en formato JSON
- Códigos de estado HTTP apropiados

### ✅ Autenticación JWT
- Generación de tokens al login/registro
- Validación en middleware
- Almacenamiento en localStorage

### ✅ Base de Datos
- MongoDB con Mongoose
- Modelos y esquemas definidos
- Relaciones entre documentos

---

## 🤝 Contribuir

Si deseas contribuir:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto fue creado para fines educativos.

---

## 👤 Autor

**Ruaksu001**
- GitHub: [@Ruaksu001](https://github.com/Ruaksu001)
- Repositorio: [todo-al-negro](https://github.com/Ruaksu001/todo-al-negro)

---

## 📚 Documentación Adicional

Para más información técnica sobre la separación frontend/backend, consulta:
- [`SEPARACION_FRONTEND_BACKEND.md`](./SEPARACION_FRONTEND_BACKEND.md)

---

**🎰 ¡Buena suerte en el casino!**
