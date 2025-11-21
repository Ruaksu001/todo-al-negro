# ✅ SEPARACIÓN FRONTEND/BACKEND - RESUMEN DE CAMBIOS

## 🎯 Objetivo Completado

Se ha separado exitosamente el **frontend del backend** en tu proyecto existente, adaptando tus vistas Handlebars para consumir la API REST con JWT.

---

## 📝 Cambios Realizados en TUS Archivos Existentes

### 1️⃣ **views/login.handlebars** ✅ MODIFICADO

**Antes:**
- Formulario con `method="post" action="/login"`
- Procesamiento tradicional en el servidor

**Ahora:**
- Formulario interceptado con JavaScript
- Usa `fetch()` con `async/await` para llamar a `/api/usuarios/login`
- Guarda token JWT en `localStorage`
- Manejo de errores dinámico sin recargar página
- Redirige automáticamente al perfil si login es exitoso

**Código agregado:**
```javascript
document.getElementById('login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const respuesta = await fetch('/api/usuarios/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, contraseña })
  });
  // Guarda token y redirige
});
```

---

### 2️⃣ **views/register.handlebars** ✅ MODIFICADO

**Antes:**
- Formulario con `method="post" action="/register"`
- Validación y procesamiento en el servidor

**Ahora:**
- Formulario interceptado con JavaScript
- Validación frontend (contraseñas coinciden)
- Usa `fetch()` para llamar a `/api/usuarios/register`
- Guarda token JWT automáticamente
- Manejo de errores en tiempo real
- Redirige al perfil tras registro exitoso

**Código agregado:**
```javascript
document.getElementById('registro').addEventListener('submit', async (e) => {
  e.preventDefault();
  // Validación frontend
  if (contraseña !== confirmar) {
    // Mostrar error
    return;
  }
  const respuesta = await fetch('/api/usuarios/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, usuario, correo, contraseña, seguridad, fecha })
  });
  // Guarda token y redirige
});
```

---

### 3️⃣ **views/perfil.handlebars** ✅ MODIFICADO

**Antes:**
- Datos del usuario renderizados desde el servidor con Handlebars
- `{{username}}`, `{{saldo}}`, `{{historialTransacciones}}`

**Ahora:**
- Página carga con placeholders
- JavaScript carga datos desde `/api/usuarios/perfil` con token JWT
- Valida token al cargar (redirige a login si es inválido)
- Actualiza interfaz dinámicamente con los datos
- Transacciones se cargan y renderizan con JavaScript

**Código agregado:**
```javascript
async function cargarPerfil() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }
  const respuesta = await fetch('/api/usuarios/perfil', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  // Actualiza interfaz con datos del usuario
}
window.addEventListener('load', cargarPerfil);
```

---

### 4️⃣ **index.js** ✅ MODIFICADO

**Cambios realizados:**

#### ✅ Agregadas rutas API REST modulares
```javascript
const usuariosApiRoutes = require('./routes/api/usuarios');
app.use('/api/usuarios', usuariosApiRoutes);
```

#### ✅ Rutas POST tradicionales deshabilitadas
```javascript
// ⚠️ POST /register DESHABILITADO - Ahora se usa API REST
// ⚠️ POST /login DESHABILITADO - Ahora se usa API REST
```

Las rutas POST fueron comentadas porque ahora:
- `/register` → Sirve solo la vista (GET)
- `/login` → Sirve solo la vista (GET)
- El procesamiento se hace en `/api/usuarios/register` y `/api/usuarios/login`

#### ✅ Logout mejorado
```javascript
app.get('/logout', (req, res) => {
  // Limpia cookies Y localStorage antes de redirigir
  res.send(`
    <script>
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login?status=logout';
    </script>
  `);
});
```

---

## 🔄 Flujo Completo Actualizado

### **Registro (Frontend → Backend)**
```
1. Usuario llena formulario en register.handlebars
2. JavaScript intercepta el submit
3. Valida que contraseñas coincidan (frontend)
4. fetch() POST a /api/usuarios/register
5. Backend valida y encripta con bcrypt
6. Backend guarda en MongoDB
7. Backend genera token JWT
8. Frontend recibe token
9. Frontend guarda en localStorage
10. Frontend redirige a /perfil
```

### **Login (Frontend → Backend)**
```
1. Usuario llena formulario en login.handlebars
2. JavaScript intercepta el submit
3. fetch() POST a /api/usuarios/login
4. Backend busca usuario en MongoDB
5. Backend valida contraseña con bcrypt.compare()
6. Backend genera token JWT
7. Frontend recibe token
8. Frontend guarda en localStorage
9. Frontend redirige a /perfil
```

### **Perfil (Carga dinámica con JWT)**
```
1. Usuario accede a /perfil
2. Servidor sirve perfil.handlebars (vacío)
3. JavaScript obtiene token de localStorage
4. fetch() GET a /api/usuarios/perfil con header Authorization
5. Backend valida token JWT
6. Backend responde con datos del usuario
7. JavaScript actualiza la interfaz con los datos
8. Si token inválido → redirige a login
```

---

## 📊 Separación Frontend/Backend Lograda

### **Backend (Express + MongoDB + API REST)**
- ✅ Rutas API en `/api/usuarios/*`
- ✅ Controladores con lógica de negocio
- ✅ Modelos Mongoose separados
- ✅ Middleware JWT para autenticación
- ✅ Respuestas en formato JSON
- ✅ Validaciones y encriptación bcrypt

### **Frontend (Handlebars + Fetch API)**
- ✅ Vistas HTML servidas por GET
- ✅ JavaScript con async/await
- ✅ Fetch para comunicación con API
- ✅ localStorage para tokens
- ✅ Actualización dinámica de interfaz
- ✅ Manejo de errores sin recargar página

---

## 🎓 Conceptos Implementados

### ✅ Promesas y Asincronismo
- `async/await` en todo el código JavaScript del frontend
- `fetch()` devuelve promesas
- `try/catch` para manejo de errores

### ✅ Fetch API
- Peticiones POST con body JSON
- Peticiones GET con headers de autorización
- Headers: `Content-Type: application/json`
- Headers: `Authorization: Bearer <token>`

### ✅ JWT (JSON Web Tokens)
- Token generado en backend al login/registro
- Token guardado en `localStorage` del navegador
- Token enviado en cada petición protegida
- Validación automática en middleware

### ✅ Separación de Responsabilidades
- **Backend**: Solo maneja datos (JSON)
- **Frontend**: Solo maneja interfaz (HTML/JS)
- Comunicación vía API REST

---

## 🚀 Para Probar

### 1. Reiniciar el servidor
```bash
# Detener servidor actual (Ctrl+C)
node index.js
```

### 2. Probar Registro
1. Ir a: http://localhost:80/register
2. Llenar formulario
3. Verificar que no recarga la página
4. Abrir consola (F12) → ver logs
5. Verificar redirección automática a /perfil

### 3. Probar Login
1. Ir a: http://localhost:80/login
2. Ingresar credenciales
3. Verificar que guarda token
4. Abrir consola → Application → Local Storage
5. Ver token JWT guardado

### 4. Probar Perfil
1. Con sesión activa, ir a: http://localhost:80/perfil
2. Verificar que carga datos dinámicamente
3. Abrir consola → Network → ver petición a /api/usuarios/perfil
4. Cerrar sesión y volver a /perfil
5. Verificar que redirige a login

---

## 📁 Archivos Modificados

```
✅ views/login.handlebars         → Agregado JavaScript con fetch
✅ views/register.handlebars      → Agregado JavaScript con fetch
✅ views/perfil.handlebars        → Carga dinámica con API
✅ index.js                       → Rutas API agregadas, POST deshabilitados
```

---

## 🎯 Resultado Final

### Antes (Monolítico)
```
Cliente → POST /login → Servidor procesa → Renderiza HTML → Cliente
```

### Ahora (Separado)
```
Cliente → fetch('/api/usuarios/login') → Servidor responde JSON
Cliente → Recibe JSON → Actualiza interfaz → localStorage
```

---

## 💡 Ventajas de Esta Separación

1. **Frontend independiente** - Puedes cambiar la interfaz sin tocar el backend
2. **API reutilizable** - Puedes crear app móvil usando la misma API
3. **Mejor UX** - No recarga la página en cada acción
4. **Seguridad** - JWT permite autenticación sin sesiones
5. **Escalabilidad** - Frontend y backend pueden estar en servidores diferentes
6. **Mantenimiento** - Código más organizado y fácil de debuggear

---

## 🎓 Para tu Entrega 3

Puedes demostrar:

✅ **Separación clara Frontend/Backend**
- Frontend: Vistas Handlebars + JavaScript con fetch
- Backend: API REST con Express + MongoDB

✅ **Comunicación asíncrona**
- async/await en todo el código
- Promesas con fetch API
- Sin recargas de página

✅ **Autenticación JWT**
- Login genera token
- Token guardado en localStorage
- Perfil protegido valida token

✅ **Conceptos del módulo implementados**
- Promesas y asincronismo ✅
- Fetch API ✅
- Conexión MongoDB ✅
- bcrypt para contraseñas ✅
- JWT para autenticación ✅
- Estructura modular ✅

---

**¡Tu proyecto ahora tiene una separación profesional Frontend/Backend! 🎉**
