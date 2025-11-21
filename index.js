// ===============================
// Servidor Express con Handlebars + Socket.IO
// ===============================

// Importación de módulos necesarios
const express = require('express'); // Framework web para Node.js
const { engine } = require('express-handlebars'); // Motor de plantillas para HTML dinámico
const bodyParser = require('body-parser'); // Middleware para leer datos de formularios
const path = require('path'); // Módulo para trabajar con rutas de archivos
const cookieParser = require('cookie-parser'); // Middleware para gestionar cookies (sesiones)
const mongoose = require('mongoose'); // Librería para interactuar con MongoDB
const http = require('http'); // Módulo Node.js para crear el servidor HTTP
const { Server } = require("socket.io"); // Librería para comunicación en tiempo real (WebSockets)
const bcrypt = require('bcrypt'); // Librería para encriptar contraseñas
const cors = require('cors'); // Middleware para permitir peticiones desde diferentes orígenes

// Inicialización de Express y servidor HTTP
const app = express();
const server = http.createServer(app); // Se crea el servidor HTTP usando Express
const io = new Server(server); // Se inicializa Socket.IO sobre el servidor HTTP

// Puerto en el que escuchará el servidor
const port = 80;

// ===============================
// Configuración y Middlewares (Funciones que se ejecutan en cada petición)
// ===============================

// Middleware para parsear cuerpos de petición en formato JSON
app.use(bodyParser.json());
// Middleware para parsear cuerpos de petición codificados en URL (formularios HTML)
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware CORS para permitir peticiones API desde diferentes orígenes
app.use(cors());
// Middleware para servir archivos estáticos (CSS, JS de cliente, imágenes) desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));
// Middleware para parsear cookies enviadas por el navegador
app.use(cookieParser());

// Configuración del motor de plantillas Handlebars
app.engine('handlebars', engine({
    defaultLayout: 'main', // Define el layout principal (plantilla base)
    helpers: {
        // Helper 'section': Permite insertar bloques de contenido (como scripts) desde vistas específicas en el layout principal
        section: function(name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        },
        // Helper 'formatDate': Formatea objetos Date a DD/MM/YY
        formatDate: function(date) {
            if (!date) return '';
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = String(d.getFullYear()).slice(-2);
            return `${day}/${month}/${year}`;
        }
    }
}));
app.set('view engine', 'handlebars'); // Establece Handlebars como motor de vistas
app.set('views', path.join(__dirname, 'views')); // Define la carpeta donde están los archivos .handlebars

// ===============================
// Modelos de Mongoose (Importados desde archivos modulares)
// ===============================

// Importar modelos desde la carpeta models/
const Usuario = require('./models/Usuario');
const GameState = require('./models/GameState');

// ===============================
// Rutas API REST (Separación Backend)
// ===============================

// Importar rutas de la API
const rutasUsuarios = require('./routes/api/usuarios');

// Montar rutas de la API bajo el prefijo /api
app.use('/api/usuarios', rutasUsuarios);


// ===============================
//         RUTAS (Manejo de peticiones HTTP GET y POST)
// ===============================

// ========== RUTAS API REST (JSON) ==========
// Importar rutas modulares de la API
const usuariosApiRoutes = require('./routes/api/usuarios');
app.use('/api/usuarios', usuariosApiRoutes);

// ========== RUTAS DE VISTAS (HTML con Handlebars) ==========

// Ruta para la página principal
app.get('/', (req, res) => res.render('home', { title: 'Inicio' }));

// Ruta para mostrar el formulario de registro
app.get('/register', (req, res) => res.render('register', { title: 'Registro' }));

// ⚠️ POST /register DESHABILITADO - Ahora se usa API REST /api/usuarios/register
// El formulario en register.handlebars usa fetch() para llamar a la API
/*
app.post('/register', async (req, res) => {
  const { nombre, usuario, correo, contraseña, confirmar, seguridad, fecha } = req.body;
  if (!nombre || !usuario || !correo || !contraseña || !confirmar || !seguridad || !fecha || contraseña !== confirmar) {
    return res.render('register', { error: 'Datos incompletos o las contraseñas no coinciden.', ...req.body });
  }
  try {
    const correoExistente = await Usuario.findOne({ correo: correo });
    if (correoExistente) return res.render('register', { error: 'Ya existe una cuenta registrada con este correo.', ...req.body });
    const usuarioExistente = await Usuario.findOne({ usuario: usuario });
    if (usuarioExistente) return res.render('register', { error: 'El nombre de usuario ya está en uso.', ...req.body });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contraseña, salt);
    const nuevoUsuario = new Usuario({ nombre, usuario, correo, contraseña: hashedPassword, seguridad, fecha });
    await nuevoUsuario.save();
    const opciones = { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 };
    res.cookie('usuario', nuevoUsuario.usuario, opciones);
    res.cookie('nombre', nuevoUsuario.nombre, opciones);
    res.cookie('saldo', nuevoUsuario.saldo, opciones);
    return res.redirect('/perfil?status=registrado');
  } catch (err) {
    console.error("Error al registrar:", err);
    return res.render('register', { error: 'Ocurrió un error en el servidor.', ...req.body });
  }
});
*/

// Ruta para mostrar el formulario de login
app.get('/login', (req, res) => {
  let mensaje = null;
  if (req.query.status === 'logout') mensaje = 'Has cerrado sesión exitosamente.';
  if (req.query.status === 'reset_ok') mensaje = 'Contraseña actualizada correctamente. Puedes iniciar sesión.';
  if (req.query.status === 'registro_exitoso') mensaje = '¡Registro exitoso! Inicia sesión con tu nueva cuenta.';
  res.render('login', { title: 'Iniciar sesión', mensaje });
});

// ⚠️ POST /login DESHABILITADO - Ahora se usa API REST /api/usuarios/login
// El formulario en login.handlebars usa fetch() para llamar a la API
/*
app.post('/login', async (req, res) => {
  const correo = (req.body.email || '').trim();
  const pass = (req.body.pass || '').trim();
  try {
    const usuarioEncontrado = await Usuario.findOne({ correo: correo });
    if (!usuarioEncontrado) return res.render('login', { title: 'Iniciar sesión', error: 'No existe ninguna cuenta registrada con este correo electrónico.', correo });
    const esCorrecta = await bcrypt.compare(pass, usuarioEncontrado.contraseña);
    if (!esCorrecta) {
      return res.render('login', { title: 'Iniciar sesión', error: 'Contraseña incorrecta.', correo });
    }
    console.log('Inicio de sesión exitoso:', usuarioEncontrado.usuario);
    const opciones = { httpOnly: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 };
    res.cookie('usuario', usuarioEncontrado.usuario, opciones);
    res.cookie('nombre', usuarioEncontrado.nombre, opciones);
    res.cookie('saldo', usuarioEncontrado.saldo, opciones);
    return res.redirect('/perfil');
  } catch (err) {
    console.error("Error en el login:", err);
    return res.render('login', { title: 'Iniciar sesión', error: 'Ocurrió un error en el servidor.', correo });
  }
});
*/

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
  // Limpiar cookies
  res.clearCookie('usuario');
  res.clearCookie('nombre');
  res.clearCookie('saldo');
  
  // Renderizar página que limpia localStorage y redirige
  res.send(`
    <html>
      <head><title>Cerrando sesión...</title></head>
      <body>
        <script>
          // Limpiar localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          
          // Limpiar cookies del cliente
          document.cookie = 'usuario=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'nombre=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'saldo=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          
          window.location.href = '/login?status=logout';
        </script>
      </body>
    </html>
  `);
});

// Ruta para mostrar el perfil del usuario (solo sirve la vista, datos desde API)
app.get('/perfil', (req, res) => {
  const mensaje = req.query.status === 'registrado' ? '¡Te has registrado y tu sesión se ha iniciado exitosamente!' : null;
  
  // Solo renderizar la vista vacía, los datos se cargarán desde /api/usuarios/perfil con JWT
  res.render('perfil', {
    title: 'Perfil',
    mensaje: mensaje
  });
});

// Ruta para mostrar el lobby del juego
app.get('/lobby', async (req, res) => {
    if (!req.cookies.usuario) return res.redirect('/login'); // Requiere login
    try {
        // Obtener datos del usuario y estado global del juego
        const [usuarioData, gameState] = await Promise.all([
            Usuario.findOne({ usuario: req.cookies.usuario }).lean(),
            GameState.findById('main_game_state').lean()
        ]);
        if (!usuarioData) return res.redirect('/login');
        const currentGameState = gameState || { historialGanadores: [], historialApuestas: [] };

        // Renderizar vista del lobby
        res.render('lobby', {
            title: 'Lobby',
            saldo: Number(usuarioData.saldo).toLocaleString('es-CL'),
            historialGanadores: JSON.stringify(currentGameState.historialGanadores),
            historialApuestas: JSON.stringify(currentGameState.historialApuestas),
            usertag: usuarioData.usuario
        });
    } catch (error) {
        console.error("Error al cargar el lobby:", error);
        res.redirect('/perfil');
    }
});

// Ruta para mostrar la página de transacciones
app.get('/transacciones', async (req, res) => {
    if (!req.cookies.usuario) return res.redirect('/login'); // Requiere login
    try {
        const usuarioData = await Usuario.findOne({ usuario: req.cookies.usuario }).lean();
        if (!usuarioData) return res.redirect('/login');
        res.cookie('saldo', usuarioData.saldo, { httpOnly: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });

        let mensajeRecarga = null, errorRecarga = null, mensajeRetiro = null, errorRetiro = null;
        // Asignar mensajes según el query 'status'
        const status = req.query.status;
        if (status === 'recarga_ok') mensajeRecarga = '¡Recarga exitosa!';
        else if (status === 'recarga_error_monto') errorRecarga = 'El monto debe ser un número positivo.';
        else if (status === 'recarga_error_tarjeta') errorRecarga = 'El número de tarjeta debe tener 16 dígitos.';
        else if (status === 'recarga_error_cvv') errorRecarga = 'El CVV debe tener 3 dígitos.';
        else if (status === 'recarga_error_fecha') errorRecarga = 'Formato de fecha inválido (MM/AA).';
        else if (status === 'recarga_error_nombre') errorRecarga = 'El nombre del titular solo puede contener letras y espacios.';
        else if (status === 'recarga_error_general') errorRecarga = 'Error al procesar la recarga.';
        else if (status === 'retiro_ok') mensajeRetiro = '¡Retiro exitoso!';
        else if (status === 'retiro_error_monto') errorRetiro = 'El monto debe ser un número positivo.';
        else if (status === 'retiro_error_cuenta') errorRetiro = 'El número de cuenta debe contener solo dígitos.';
        else if (status === 'saldo_insuficiente') errorRetiro = 'No tienes saldo suficiente para este retiro.';
        else if (status === 'retiro_error_general') errorRetiro = 'Error al procesar el retiro.';

        // Renderizar vista de transacciones
        res.render('transacciones', {
            title: 'Transacciones',
            saldo: Number(usuarioData.saldo).toLocaleString('es-CL'),
            mensajeRecarga, errorRecarga, mensajeRetiro, errorRetiro
        });
    } catch (error) {
        console.error("Error al cargar transacciones:", error);
        res.redirect('/perfil');
    }
});

// Ruta para procesar recarga de saldo
app.post('/transacciones/recargar', async (req, res) => {
    if (!req.cookies.usuario) return res.redirect('/login');
    try {
        const montoRecarga = Number(req.body.monto);
        const numeroTarjeta = req.body.numeroTarjeta.replace(/\s/g, '');
        const cvv = req.body.cvv;
        const fechaVencimiento = req.body.fv;
        const nombreTitular = req.body.nombreTitular;

        // Validaciones del servidor
        if (isNaN(montoRecarga) || montoRecarga <= 0) return res.redirect('/transacciones?status=recarga_error_monto');
        if (!/^\d{16}$/.test(numeroTarjeta)) return res.redirect('/transacciones?status=recarga_error_tarjeta');
        if (!/^\d{3}$/.test(cvv)) return res.redirect('/transacciones?status=recarga_error_cvv');
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(fechaVencimiento)) return res.redirect('/transacciones?status=recarga_error_fecha');
        if (!/^[a-zA-Z\s]+$/.test(nombreTitular)) return res.redirect('/transacciones?status=recarga_error_nombre');

        const usuario = req.cookies.usuario;
        const nuevaTransaccion = { tipo: 'Recarga', fecha: new Date(), monto: montoRecarga };

        // Incrementar saldo y añadir al historial en la BD
        const resultado = await Usuario.findOneAndUpdate(
            { usuario: usuario },
            { $inc: { saldo: montoRecarga }, $push: { historialTransacciones: { $each: [nuevaTransaccion], $slice: -5 } } },
            { new: true }
        );

        if (!resultado) return res.redirect('/login');
        res.cookie('saldo', resultado.saldo, { httpOnly: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
        console.log(`Recarga exitosa para ${usuario}: +${montoRecarga}`);
        return res.redirect('/transacciones?status=recarga_ok');
    } catch (error) {
        console.error("Error en la recarga:", error);
        return res.redirect('/transacciones?status=recarga_error_general');
    }
});

// Ruta para procesar retiro de saldo
app.post('/transacciones/retirar', async (req, res) => {
    if (!req.cookies.usuario) return res.redirect('/login');
    try {
        const montoRetiro = Number(req.body.monto);
        const numeroCuenta = req.body.numeroCuenta;

        // Validaciones
        if (isNaN(montoRetiro) || montoRetiro <= 0) return res.redirect('/transacciones?status=retiro_error_monto');
        if (!/^\d+$/.test(numeroCuenta)) return res.redirect('/transacciones?status=retiro_error_cuenta');

        const usuario = req.cookies.usuario;
        const usuarioData = await Usuario.findOne({ usuario: usuario });
        if (!usuarioData) return res.redirect('/login');
        if (usuarioData.saldo < montoRetiro) return res.redirect('/transacciones?status=saldo_insuficiente');

        const nuevaTransaccion = { tipo: 'Retiro', fecha: new Date(), monto: -montoRetiro };

        // Decrementar saldo y añadir al historial en la BD
        const resultado = await Usuario.findOneAndUpdate(
            { usuario: usuario },
            { $inc: { saldo: -montoRetiro }, $push: { historialTransacciones: { $each: [nuevaTransaccion], $slice: -5 } } },
            { new: true }
        );

        if (!resultado) return res.redirect('/login');
        res.cookie('saldo', resultado.saldo, { httpOnly: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
        console.log(`Retiro exitoso para ${usuario}: -${montoRetiro}`);
        return res.redirect('/transacciones?status=retiro_ok');
    } catch (error) {
        console.error("Error en el retiro:", error);
        return res.redirect('/transacciones?status=retiro_error_general');
    }
});

// Ruta para eliminar la cuenta del usuario
app.post('/perfil/eliminar', async (req, res) => {
  try {
    const usuarioAEliminar = req.cookies.usuario;
    if (!usuarioAEliminar) return res.redirect('/login');
    await Usuario.deleteOne({ usuario: usuarioAEliminar });
    console.log(`Usuario eliminado: ${usuarioAEliminar}`);
    res.clearCookie('usuario');
    res.clearCookie('nombre');
    res.clearCookie('saldo');
    return res.redirect('/');
  } catch (err) {
    console.error("Error al eliminar el usuario:", err);
    return res.redirect('/perfil');
  }
});

// Ruta para mostrar el formulario de olvido de contraseña
app.get('/forgot', (req, res) => {
    let error = null;
    if(req.query.status === 'reset_failed') error = 'No se pudo verificar el enlace para resetear la contraseña.';
    res.render('forgot', { title: 'Recuperar contraseña', error });
});

// Ruta para procesar la verificación de seguridad del olvido de contraseña
app.post('/forgot', async (req, res) => {
    const { correo, seguridad, fecha } = req.body;
    try {
        const usuario = await Usuario.findOne({ correo: correo.trim() });
        // Comprobar si existe y coinciden los datos de seguridad
        // Nota: La comparación de fechas como strings puede ser delicada si el formato no es exacto (YYYY-MM-DD)
        if (!usuario || usuario.seguridad !== seguridad.trim() || usuario.fecha !== fecha) {
             return res.render('forgot', { error: 'Los datos ingresados no coinciden o el correo no está registrado.', correo, seguridad, fecha });
        }
        // Redirigir a la página de reseteo (pasando correo como query param - método simple)
        res.redirect(`/reset-password?correo=${encodeURIComponent(correo)}`);
    } catch (error) {
        console.error("Error en /forgot:", error);
        res.render('forgot', { error: 'Error del servidor al verificar los datos.', correo, seguridad, fecha });
    }
});

// Ruta para mostrar el formulario de nueva contraseña
app.get('/reset-password', (req, res) => {
    const correo = req.query.correo;
    if (!correo) return res.redirect('/forgot?status=reset_failed'); // Si no hay correo, volver
    res.render('reset-password', { title: 'Establecer Nueva Contraseña', correo: correo });
});

// Ruta para procesar y guardar la nueva contraseña
app.post('/reset-password', async (req, res) => {
    const { correo, nuevaContraseña, confirmarContraseña } = req.body;
    if (!nuevaContraseña || nuevaContraseña !== confirmarContraseña) {
        return res.render('reset-password', { error: 'Las contraseñas no coinciden o están vacías.', correo: correo });
    }
    try {
        // Encriptar la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nuevaContraseña, salt);
        // Actualizar la contraseña en la base de datos
        const resultado = await Usuario.updateOne({ correo: correo }, { $set: { contraseña: hashedPassword } });
        if (resultado.modifiedCount === 0) {
            return res.render('reset-password', { error: 'No se pudo encontrar el usuario para actualizar.', correo });
        }
        console.log(`Contraseña actualizada para: ${correo}`);
        // Redirigir al login con mensaje de éxito
        res.redirect('/login?status=reset_ok');
    } catch (error) {
        console.error("Error en /reset-password POST:", error);
        res.render('reset-password', { error: 'Error del servidor al actualizar la contraseña.', correo });
    }
});

// Rutas estáticas adicionales
app.get('/about', (req, res) => res.render('about', { title: 'Acerca de' }));
app.get('/baseslegales', (req, res) => res.render('baseslegales', { title: 'Bases legales' }));

// ===============================
//         LÓGICA DE SOCKET.IO (Comunicación en Tiempo Real para el Lobby)
// ===============================
io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado al lobby');

  // Escucha el evento 'nueva-jugada' enviado por el cliente (ruleta.js)
  socket.on('nueva-jugada', async (data) => {
    try {
      // Actualiza el saldo del usuario que jugó
      await Usuario.updateOne({ usuario: data.usertag }, { $set: { saldo: data.saldo } });
      
      // Actualiza el estado global del juego (historiales de ruleta)
      const updatedGameState = await GameState.findByIdAndUpdate(
        'main_game_state',
        { $set: { 
            historialGanadores: data.historialGanadores,
            historialApuestas: data.historialApuestas
          }},
        { new: true, upsert: true, lean: true } // 'upsert' crea si no existe
      );
      
      // Emite el historial actualizado a TODOS los clientes conectados
      io.emit('actualizar-historial', {
        historialGanadores: updatedGameState.historialGanadores,
        historialApuestas: updatedGameState.historialApuestas
      });
      console.log(`Jugada procesada para ${data.usertag}. Saldo: ${data.saldo}. Historial emitido.`);

    } catch (error) {
      console.error('Error al procesar la jugada:', error);
    }
  });

  // Evento cuando un usuario se desconecta
  socket.on('disconnect', () => {
    console.log('Un usuario se ha desconectado');
  });
});

// ===============================
// Iniciar Servidor y Conexión a MongoDB
// ===============================
server.listen(port, () => console.log(`Servidor corriendo en http://localhost:${port}`));
mongoose.connect('mongodb+srv://admin:admin123@miapp.qnclhil.mongodb.net/?retryWrites=true&w=majority&appName=miapp', {})
.then(() => console.log('Conexión exitosa a MongoDB Atlas'))
.catch(err => console.error('Error conectando a MongoDB', err));