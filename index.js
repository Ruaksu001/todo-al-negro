// ===============================
// Servidor Express con Handlebars + Socket.IO
// ===============================

// Importación de módulos necesarios
const express = require('express'); // Framework para crear el servidor web
const { engine } = require('express-handlebars'); // Motor de plantillas para las vistas HTML
const bodyParser = require('body-parser'); // Middleware para procesar datos de formularios
const path = require('path'); // Módulo para trabajar con rutas de archivos y directorios
const cookieParser = require('cookie-parser'); // Middleware para manejar cookies
const mongoose = require('mongoose'); // Librería para interactuar con MongoDB
const http = require('http'); // Módulo nativo de Node.js para crear un servidor HTTP
const { Server } = require("socket.io"); // Librería para comunicación en tiempo real (WebSockets)
const bcrypt = require('bcrypt'); // Librería para encriptar contraseñas

// Inicialización de Express y creación del servidor HTTP
const app = express();
const server = http.createServer(app);
const io = new Server(server); // Inicialización de Socket.IO

// Definición del puerto en el que escuchará el servidor
const port = 80;

// ===============================
// Configuración y Middlewares
// ===============================

// Configuración de body-parser para leer datos JSON y de formularios URL-encoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración para servir archivos estáticos (CSS, JS de cliente, imágenes) desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Habilitar el manejo de cookies
app.use(cookieParser());

// Configuración del motor de plantillas Handlebars
app.engine('handlebars', engine({
    defaultLayout: 'main', // Plantilla principal por defecto
    helpers: {
        // Helper 'section' para insertar scripts específicos en vistas individuales
        section: function(name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        },
        // Helper 'formatDate' para mostrar fechas en formato DD/MM/YY
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
app.set('view engine', 'handlebars'); // Establecer Handlebars como motor de vistas
app.set('views', path.join(__dirname, 'views')); // Directorio donde se encuentran las vistas (.handlebars)

// ===============================
// Modelos de Mongoose (Definición de la estructura de datos en MongoDB)
// ===============================

// Esquema para los usuarios
const UsuarioSchema = new mongoose.Schema({
  nombre: String, // Nombre completo del usuario
  usuario: { type: String, unique: true }, // Nombre de usuario (único)
  correo: { type: String, unique: true }, // Correo electrónico (único)
  contraseña: String, // Contraseña (se guarda encriptada)
  seguridad: String, // Respuesta a pregunta de seguridad
  fecha: String, // Fecha (posiblemente de nacimiento u otra relevante)
  saldo: { type: Number, default: 10000 }, // Saldo de fichas del usuario, 10000 por defecto
  historialTransacciones: { type: Array, default: [] } // Array para guardar las últimas transacciones (recargas/retiros)
});
const Usuario = mongoose.model('Usuario', UsuarioSchema); // Crear el modelo 'Usuario' a partir del esquema

// Esquema para el estado global del juego (historiales de la ruleta)
const GameStateSchema = new mongoose.Schema({
  _id: { type: String, default: 'main_game_state' }, // ID fijo para asegurar un único documento
  historialGanadores: { type: Array, default: [] }, // Array para los últimos números ganadores
  historialApuestas: { type: Array, default: [] } // Array para las últimas apuestas realizadas globalmente
});
const GameState = mongoose.model('GameState', GameStateSchema); // Crear el modelo 'GameState'

// ===============================
//         RUTAS (Endpoints de la aplicación web)
// ===============================

// Ruta Principal (Página de Inicio)
app.get('/', (req, res) => res.render('home', { title: 'Inicio' }));

// Rutas de Registro de Usuario
app.get('/register', (req, res) => res.render('register', { title: 'Registro' }));

app.post('/register', async (req, res) => {
  const { nombre, usuario, correo, contraseña, confirmar, seguridad, fecha } = req.body;
  // Validación de campos obligatorios y coincidencia de contraseñas
  if (!nombre || !usuario || !correo || !contraseña || !confirmar || !seguridad || !fecha || contraseña !== confirmar) {
    return res.render('register', { error: 'Datos incompletos o las contraseñas no coinciden.', ...req.body });
  }
  try {
    // Verificar si el correo o usuario ya existen en la base de datos
    const correoExistente = await Usuario.findOne({ correo: correo });
    if (correoExistente) return res.render('register', { error: 'Ya existe una cuenta registrada con este correo.', ...req.body });
    const usuarioExistente = await Usuario.findOne({ usuario: usuario });
    if (usuarioExistente) return res.render('register', { error: 'El nombre de usuario ya está en uso.', ...req.body });

    // Encriptar la contraseña antes de guardarla
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contraseña, salt);

    // Crear una nueva instancia del modelo Usuario
    const nuevoUsuario = new Usuario({
        nombre,
        usuario,
        correo,
        contraseña: hashedPassword, // Guardar la contraseña encriptada
        seguridad,
        fecha
    });

    // Guardar el nuevo usuario en la base de datos
    await nuevoUsuario.save();
    console.log('Usuario registrado en MongoDB con contraseña encriptada:', usuario);

    // Crear cookies para iniciar sesión automáticamente
    const opciones = { httpOnly: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 };
    res.cookie('usuario', nuevoUsuario.usuario, opciones);
    res.cookie('nombre', nuevoUsuario.nombre, opciones);
    res.cookie('saldo', nuevoUsuario.saldo, opciones);

    // Redirigir al perfil con un mensaje de éxito
    return res.redirect('/perfil?status=registrado');
  } catch (err) {
    console.error("Error al registrar:", err);
    return res.render('register', { error: 'Ocurrió un error en el servidor.', ...req.body });
  }
});

// Rutas de Inicio de Sesión (Login)
app.get('/login', (req, res) => {
  let mensaje = null;
  // Mostrar mensaje si viene de cerrar sesión
  if (req.query.status === 'logout') mensaje = 'Has cerrado sesión exitosamente.';
  res.render('login', { title: 'Iniciar sesión', mensaje });
});

app.post('/login', async (req, res) => {
  const correo = (req.body.email || '').trim();
  const pass = (req.body.pass || '').trim();
  try {
    // Buscar usuario por correo electrónico
    const usuarioEncontrado = await Usuario.findOne({ correo: correo });
    if (!usuarioEncontrado) return res.render('login', { title: 'Iniciar sesión', error: 'No existe ninguna cuenta registrada con este correo electrónico.', correo });

    // Comparar la contraseña ingresada con la encriptada almacenada
    const esCorrecta = await bcrypt.compare(pass, usuarioEncontrado.contraseña);
    if (!esCorrecta) {
      return res.render('login', { title: 'Iniciar sesión', error: 'Contraseña incorrecta.', correo });
    }

    // Si la contraseña es correcta, crear cookies de sesión
    console.log('Inicio de sesión exitoso:', usuarioEncontrado.usuario);
    const opciones = { httpOnly: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 };
    res.cookie('usuario', usuarioEncontrado.usuario, opciones);
    res.cookie('nombre', usuarioEncontrado.nombre, opciones);
    res.cookie('saldo', usuarioEncontrado.saldo, opciones);

    // Redirigir al perfil del usuario
    return res.redirect('/perfil');
  } catch (err) {
    console.error("Error en el login:", err);
    return res.render('login', { title: 'Iniciar sesión', error: 'Ocurrió un error en el servidor.', correo });
  }
});

// Ruta de Cierre de Sesión (Logout)
app.get('/logout', (req, res) => {
  // Limpiar las cookies de sesión
  res.clearCookie('usuario');
  res.clearCookie('nombre');
  res.clearCookie('saldo');
  // Redirigir al login con mensaje de éxito
  res.redirect('/login?status=logout');
});

// Ruta de Perfil de Usuario
app.get('/perfil', async (req, res) => {
  // Verificar si el usuario está logueado (si existe la cookie)
  if (!req.cookies.usuario) return res.redirect('/login');
  try {
      // Obtener los datos más recientes del usuario desde la base de datos
      const usuarioData = await Usuario.findOne({ usuario: req.cookies.usuario }).lean();
      if (!usuarioData) return res.redirect('/login'); // Si no se encuentra, redirigir

      let mensaje = null;
      // Mostrar mensaje si viene de un registro exitoso
      if (req.query.status === 'registrado') mensaje = '¡Te has registrado y tu sesión se ha iniciado exitosamente!';

      const saldo = usuarioData.saldo || 0;
      const username = usuarioData.nombre || 'Usuario';
      const usertag = usuarioData.usuario || 'usuario';

      // Generar un ID temporal basado en el usertag (para visualización)
      let hash = 0;
      for (let i = 0; i < usertag.length; i++) {
        hash = (hash * 31 + usertag.charCodeAt(i)) % 1000000;
      }
      const id = String(hash).padStart(6, '0');

      // Renderizar la vista del perfil con los datos del usuario
      res.render('perfil', {
          title: 'Perfil',
          username: username,
          usertag: `@${usertag}`,
          id: id,
          saldo: Number(saldo).toLocaleString('es-CL'),
          mensaje: mensaje,
          historialTransacciones: usuarioData.historialTransacciones // Pasar el historial de transacciones
      });
  } catch (error) {
      console.error("Error al cargar el perfil:", error);
      res.redirect('/login'); // Redirigir si hay un error
  }
});

// Ruta del Lobby (Mesa de Juego)
app.get('/lobby', async (req, res) => {
    // Verificar si está logueado
    if (!req.cookies.usuario) return res.redirect('/login');
    try {
        // Obtener datos del usuario y estado global del juego (historiales de ruleta)
        const [usuarioData, gameState] = await Promise.all([
            Usuario.findOne({ usuario: req.cookies.usuario }).lean(),
            GameState.findById('main_game_state').lean() // Usar .lean() para obtener un objeto JS simple
        ]);
        if (!usuarioData) return res.redirect('/login'); // Si no existe el usuario

        // Si no hay estado de juego guardado, usar uno vacío por defecto
        const currentGameState = gameState || { historialGanadores: [], historialApuestas: [] };

        // Renderizar la vista del lobby, pasando los datos necesarios
        res.render('lobby', {
            title: 'Lobby',
            saldo: Number(usuarioData.saldo).toLocaleString('es-CL'), // Saldo formateado
            // Pasar historiales como JSON para que el script del cliente los lea
            historialGanadores: JSON.stringify(currentGameState.historialGanadores),
            historialApuestas: JSON.stringify(currentGameState.historialApuestas),
            usertag: usuarioData.usuario // Nombre de usuario para identificar jugadas
        });
    } catch (error) {
        console.error("Error al cargar el lobby:", error);
        res.redirect('/perfil'); // Redirigir si hay error
    }
});

// Rutas de Transacciones (Recarga y Retiro)
app.get('/transacciones', async (req, res) => {
    if (!req.cookies.usuario) return res.redirect('/login'); // Requiere login
    try {
        // Obtener datos frescos del usuario
        const usuarioData = await Usuario.findOne({ usuario: req.cookies.usuario }).lean();
        if (!usuarioData) return res.redirect('/login');
        // Actualizar la cookie de saldo por si hubo cambios externos
        res.cookie('saldo', usuarioData.saldo, { httpOnly: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });

        let mensajeRecarga = null, errorRecarga = null, mensajeRetiro = null, errorRetiro = null;

        // Determinar qué mensaje mostrar según el parámetro 'status' en la URL
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

        // Renderizar la vista de transacciones con el saldo y mensajes
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

app.post('/transacciones/recargar', async (req, res) => {
    if (!req.cookies.usuario) return res.redirect('/login');
    try {
        const montoRecarga = Number(req.body.monto);
        const numeroTarjeta = req.body.numeroTarjeta.replace(/\s/g, ''); // Limpiar espacios
        const cvv = req.body.cvv;
        const fechaVencimiento = req.body.fv;
        const nombreTitular = req.body.nombreTitular;

        // Validaciones del lado del servidor
        if (isNaN(montoRecarga) || montoRecarga <= 0) return res.redirect('/transacciones?status=recarga_error_monto');
        if (!/^\d{16}$/.test(numeroTarjeta)) return res.redirect('/transacciones?status=recarga_error_tarjeta');
        if (!/^\d{3}$/.test(cvv)) return res.redirect('/transacciones?status=recarga_error_cvv');
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(fechaVencimiento)) return res.redirect('/transacciones?status=recarga_error_fecha');
        if (!/^[a-zA-Z\s]+$/.test(nombreTitular)) return res.redirect('/transacciones?status=recarga_error_nombre');

        const usuario = req.cookies.usuario;
        const nuevaTransaccion = { tipo: 'Recarga', fecha: new Date(), monto: montoRecarga };

        // Actualizar el saldo y el historial de transacciones en la BD
        const resultado = await Usuario.findOneAndUpdate(
            { usuario: usuario },
            {
                $inc: { saldo: montoRecarga }, // Incrementar saldo
                $push: { historialTransacciones: { $each: [nuevaTransaccion], $slice: -5 } } // Añadir al historial (últimos 5)
            },
            { new: true } // Devolver el documento actualizado
        );

        if (!resultado) return res.redirect('/login'); // Si no se encuentra el usuario
        // Actualizar la cookie de saldo
        res.cookie('saldo', resultado.saldo, { httpOnly: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
        console.log(`Recarga exitosa para ${usuario}: +${montoRecarga}`);
        // Redirigir con mensaje de éxito
        return res.redirect('/transacciones?status=recarga_ok');

    } catch (error) {
        console.error("Error en la recarga:", error);
        return res.redirect('/transacciones?status=recarga_error_general');
    }
});

app.post('/transacciones/retirar', async (req, res) => {
    if (!req.cookies.usuario) return res.redirect('/login');
    try {
        const montoRetiro = Number(req.body.monto);
        const numeroCuenta = req.body.numeroCuenta;

        // Validaciones
        if (isNaN(montoRetiro) || montoRetiro <= 0) return res.redirect('/transacciones?status=retiro_error_monto');
        if (!/^\d+$/.test(numeroCuenta)) return res.redirect('/transacciones?status=retiro_error_cuenta');

        const usuario = req.cookies.usuario;
        // Buscar al usuario para verificar su saldo actual
        const usuarioData = await Usuario.findOne({ usuario: usuario });
        if (!usuarioData) return res.redirect('/login');
        // Verificar si tiene saldo suficiente
        if (usuarioData.saldo < montoRetiro) return res.redirect('/transacciones?status=saldo_insuficiente');

        const nuevaTransaccion = { tipo: 'Retiro', fecha: new Date(), monto: -montoRetiro }; // Monto negativo para retiros

        // Actualizar saldo y historial en la BD
        const resultado = await Usuario.findOneAndUpdate(
            { usuario: usuario },
            {
                $inc: { saldo: -montoRetiro }, // Decrementar saldo
                $push: { historialTransacciones: { $each: [nuevaTransaccion], $slice: -5 } }
            },
            { new: true }
        );

        if (!resultado) return res.redirect('/login'); // Si hay error actualizando
        // Actualizar cookie de saldo
        res.cookie('saldo', resultado.saldo, { httpOnly: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
        console.log(`Retiro exitoso para ${usuario}: -${montoRetiro}`);
        // Redirigir con mensaje de éxito
        return res.redirect('/transacciones?status=retiro_ok');

    } catch (error) {
        console.error("Error en el retiro:", error);
        return res.redirect('/transacciones?status=retiro_error_general');
    }
});

// Ruta para Eliminar Cuenta de Usuario
app.post('/perfil/eliminar', async (req, res) => {
  try {
    const usuarioAEliminar = req.cookies.usuario;
    if (!usuarioAEliminar) return res.redirect('/login'); // Requiere estar logueado
    
    // Eliminar el usuario de la base de datos
    await Usuario.deleteOne({ usuario: usuarioAEliminar });
    console.log(`Usuario eliminado: ${usuarioAEliminar}`);

    // Limpiar cookies de sesión
    res.clearCookie('usuario');
    res.clearCookie('nombre');
    res.clearCookie('saldo');
    // Redirigir a la página principal
    return res.redirect('/');
  } catch (err) {
    console.error("Error al eliminar el usuario:", err);
    return res.redirect('/perfil'); // Si hay error, volver al perfil
  }
});

// Otras Rutas Estáticas (About, Bases Legales, Recuperar Contraseña)
app.get('/about', (req, res) => res.render('about', { title: 'Acerca de' }));
app.get('/baseslegales', (req, res) => res.render('baseslegales', { title: 'Bases legales' }));
app.get('/forgot', (req, res) => res.render('forgot', { title: 'Recuperar contraseña' }));
// (Aquí faltaría la lógica POST para /forgot si se implementara)

// ===============================
//         LÓGICA DE SOCKET.IO (Comunicación en Tiempo Real)
// ===============================
io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado al lobby');

  // Evento que se recibe desde el cliente (ruleta.js) cuando termina una jugada
  socket.on('nueva-jugada', async (data) => {
    try {
      // Actualiza el saldo del usuario que jugó en la base de datos
      await Usuario.updateOne({ usuario: data.usertag }, { $set: { saldo: data.saldo } });
      
      // Actualiza el estado global del juego (historiales de ruleta) en la base de datos
      const updatedGameState = await GameState.findByIdAndUpdate(
        'main_game_state', // ID fijo del documento
        { $set: { 
            historialGanadores: data.historialGanadores,
            historialApuestas: data.historialApuestas
          }},
        { new: true, upsert: true, lean: true } // 'upsert' crea el documento si no existe la primera vez
      );
      
      // Emite (envía) el historial actualizado a TODOS los clientes conectados al lobby
      io.emit('actualizar-historial', {
        historialGanadores: updatedGameState.historialGanadores,
        historialApuestas: updatedGameState.historialApuestas
      });
      console.log(`Jugada procesada para ${data.usertag}. Saldo: ${data.saldo}. Historial emitido.`);

    } catch (error) {
      console.error('Error al procesar la jugada:', error);
    }
  });

  // Evento cuando un usuario cierra la pestaña o se desconecta
  socket.on('disconnect', () => {
    console.log('Un usuario se ha desconectado');
  });
});

// ===============================
// Iniciar Servidor y Conexión a MongoDB
// ===============================
server.listen(port, () => console.log(`Servidor corriendo en http://localhost:${port}`)); // Iniciar el servidor HTTP
// Conexión a la base de datos MongoDB Atlas
mongoose.connect('mongodb+srv://admin:admin123@miapp.qnclhil.mongodb.net/?retryWrites=true&w=majority&appName=miapp', {})
.then(() => console.log('Conexión exitosa a MongoDB Atlas'))
.catch(err => console.error('Error conectando a MongoDB', err));