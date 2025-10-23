// ===============================
// Servidor Express con Handlebars + Socket.IO
// ===============================

const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require("socket.io");
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = 80;

// ===============================
// Configuración y Middlewares
// ===============================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.engine('handlebars', engine({
    defaultLayout: 'main',
    helpers: {
        section: function(name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        },
        // 🔹 Helper para formatear fechas
        formatDate: function(date) {
            if (!date) return '';
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0'); // Meses son 0-indexados
            const year = String(d.getFullYear()).slice(-2); // Últimos 2 dígitos del año
            return `${day}/${month}/${year}`;
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// ===============================
// Modelos de Mongoose
// ===============================
const UsuarioSchema = new mongoose.Schema({
  nombre: String,
  usuario: { type: String, unique: true },
  correo: { type: String, unique: true },
  contraseña: String,
  seguridad: String,
  fecha: String,
  saldo: { type: Number, default: 10000 },
  historialGanadores: { type: Array, default: [] },
  historialApuestas: { type: Array, default: [] },
  // 🔹 NUEVO: Campo para el historial de transacciones
  historialTransacciones: { type: Array, default: [] }
});
const Usuario = mongoose.model('Usuario', UsuarioSchema);

const GameStateSchema = new mongoose.Schema({
  _id: { type: String, default: 'main_game_state' },
  historialGanadores: { type: Array, default: [] },
  historialApuestas: { type: Array, default: [] }
});
const GameState = mongoose.model('GameState', GameStateSchema);


// ===============================
//         RUTAS
// ===============================

app.get('/', (req, res) => res.render('home', { title: 'Inicio' }));

app.get('/register', (req, res) => res.render('register', { title: 'Registro' }));

app.post('/register', async (req, res) => {
  const { nombre, usuario, correo, contraseña, confirmar, seguridad, fecha } = req.body;
  if (!nombre || !usuario || !correo || !contraseña || !confirmar || !seguridad || !fecha || contraseña !== confirmar) {
    return res.render('register', { error: 'Datos incompletos o las contraseñas no coinciden.', ...req.body });
  }
  try {
    const correoExistente = await Usuario.findOne({ correo: correo });
    if (correoExistente) return res.render('register', { error: 'Ya existe una cuenta registrada con este correo.', ...req.body });
    const usuarioExistente = await Usuario.findOne({ usuario: usuario });
    if (usuarioExistente) return res.render('register', { error: '👤 El nombre de usuario ya está en uso.', ...req.body });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contraseña, salt);

    const nuevoUsuario = new Usuario({
        nombre,
        usuario,
        correo,
        contraseña: hashedPassword,
        seguridad,
        fecha
    });

    await nuevoUsuario.save();
    console.log('Usuario registrado en MongoDB con contraseña encriptada:', usuario);

    const opciones = { httpOnly: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 };
    res.cookie('usuario', nuevoUsuario.usuario, opciones);
    res.cookie('nombre', nuevoUsuario.nombre, opciones);
    res.cookie('saldo', nuevoUsuario.saldo, opciones);

    return res.redirect('/perfil?status=registrado');
  } catch (err) {
    console.error("Error al registrar:", err);
    return res.render('register', { error: 'Ocurrió un error en el servidor.', ...req.body });
  }
});

app.get('/login', (req, res) => {
  let mensaje = null;
  if (req.query.status === 'logout') mensaje = 'Has cerrado sesión exitosamente.';
  res.render('login', { title: 'Iniciar sesión', mensaje });
});

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

app.get('/logout', (req, res) => {
  res.clearCookie('usuario');
  res.clearCookie('nombre');
  res.clearCookie('saldo');
  res.redirect('/login?status=logout');
});

// --- RUTA GET PARA PERFIL (MODIFICADA PARA CARGAR HISTORIAL) ---
app.get('/perfil', async (req, res) => { // 🔹 Convertida a async
  if (!req.cookies.usuario) return res.redirect('/login');
  
  try {
      // 🔹 Buscamos al usuario en la BD para obtener su historial
      const usuarioData = await Usuario.findOne({ usuario: req.cookies.usuario }).lean();
      if (!usuarioData) return res.redirect('/login'); // Si no existe, fuera

      let mensaje = null;
      if (req.query.status === 'registrado') mensaje = '¡Te has registrado y tu sesión se ha iniciado exitosamente!';
      
      const saldo = usuarioData.saldo || 0; // Usamos el saldo de la BD
      const username = usuarioData.nombre || 'Usuario';
      const usertag = usuarioData.usuario || 'usuario';

      // El ID temporal se genera igual
      let hash = 0;
      for (let i = 0; i < usertag.length; i++) {
        hash = (hash * 31 + usertag.charCodeAt(i)) % 1000000;
      }
      const id = String(hash).padStart(6, '0');
      
      res.render('perfil', {
          title: 'Perfil',
          username: username,
          usertag: `@${usertag}`,
          id: id,
          saldo: Number(saldo).toLocaleString('es-CL'),
          mensaje: mensaje,
          // 🔹 Pasamos el historial a la vista
          historialTransacciones: usuarioData.historialTransacciones 
      });

  } catch (error) {
      console.error("Error al cargar el perfil:", error);
      res.redirect('/login'); // En caso de error, redirigir al login
  }
});

app.get('/lobby', async (req, res) => {
    if (!req.cookies.usuario) return res.redirect('/login');
    try {
        const [usuarioData, gameState] = await Promise.all([
            Usuario.findOne({ usuario: req.cookies.usuario }).lean(),
            GameState.findById('main_game_state').lean()
        ]);
        if (!usuarioData) return res.redirect('/login');
        const currentGameState = gameState || { historialGanadores: [], historialApuestas: [] };
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

app.get('/transacciones', async (req, res) => {
    if (!req.cookies.usuario) return res.redirect('/login');
    try {
        const usuarioData = await Usuario.findOne({ usuario: req.cookies.usuario }).lean();
        if (!usuarioData) return res.redirect('/login');
        res.cookie('saldo', usuarioData.saldo, { httpOnly: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
        let mensajeRecarga = null, errorRecarga = null, mensajeRetiro = null, errorRetiro = null;
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
        res.render('transacciones', {
            title: 'Transacciones',
            saldo: Number(usuarioData.saldo).toLocaleString('es-CL'),
            mensajeRecarga, errorRecarga, mensajeRetiro, errorRetiro
        });
    } catch (error) {
        res.redirect('/perfil');
    }
});

// --- RUTA POST PARA RECARGAR (MODIFICADA PARA GUARDAR HISTORIAL) ---
app.post('/transacciones/recargar', async (req, res) => {
    if (!req.cookies.usuario) return res.redirect('/login');
    try {
        const montoRecarga = Number(req.body.monto);
        const numeroTarjeta = req.body.numeroTarjeta.replace(/\s/g, '');
        const cvv = req.body.cvv;
        const fechaVencimiento = req.body.fv;
        const nombreTitular = req.body.nombreTitular;

        // Validaciones
        if (isNaN(montoRecarga) || montoRecarga <= 0) return res.redirect('/transacciones?status=recarga_error_monto');
        if (!/^\d{16}$/.test(numeroTarjeta)) return res.redirect('/transacciones?status=recarga_error_tarjeta');
        if (!/^\d{3}$/.test(cvv)) return res.redirect('/transacciones?status=recarga_error_cvv');
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(fechaVencimiento)) return res.redirect('/transacciones?status=recarga_error_fecha');
        if (!/^[a-zA-Z\s]+$/.test(nombreTitular)) return res.redirect('/transacciones?status=recarga_error_nombre');

        const usuario = req.cookies.usuario;
        
        // 🔹 Crear el objeto de la transacción
        const nuevaTransaccion = {
            tipo: 'Recarga',
            fecha: new Date(),
            monto: montoRecarga
        };

        const resultado = await Usuario.findOneAndUpdate(
            { usuario: usuario },
            { 
                $inc: { saldo: montoRecarga },
                // 🔹 Añadir la transacción al historial, manteniendo solo las últimas 5
                $push: { 
                    historialTransacciones: {
                       $each: [nuevaTransaccion],
                       $slice: -5 // Mantiene los últimos 5 elementos del array
                    }
                }
            },
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

// --- RUTA POST PARA RETIRAR (MODIFICADA PARA GUARDAR HISTORIAL) ---
app.post('/transacciones/retirar', async (req, res) => {
    if (!req.cookies.usuario) return res.redirect('/login');
    try {
        const montoRetiro = Number(req.body.monto);
        const numeroCuenta = req.body.numeroCuenta;

        if (isNaN(montoRetiro) || montoRetiro <= 0) return res.redirect('/transacciones?status=retiro_error_monto');
        if (!/^\d+$/.test(numeroCuenta)) return res.redirect('/transacciones?status=retiro_error_cuenta');

        const usuario = req.cookies.usuario;
        const usuarioData = await Usuario.findOne({ usuario: usuario });
        if (!usuarioData) return res.redirect('/login');
        if (usuarioData.saldo < montoRetiro) return res.redirect('/transacciones?status=saldo_insuficiente');

        // 🔹 Crear el objeto de la transacción
        const nuevaTransaccion = {
            tipo: 'Retiro',
            fecha: new Date(),
            monto: -montoRetiro // Guardamos el monto como negativo para retiros
        };

        const resultado = await Usuario.findOneAndUpdate(
            { usuario: usuario },
            { 
                $inc: { saldo: -montoRetiro },
                // 🔹 Añadir la transacción al historial, manteniendo solo las últimas 5
                $push: {
                    historialTransacciones: {
                       $each: [nuevaTransaccion],
                       $slice: -5 
                    }
                }
            },
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

app.post('/perfil/eliminar', async (req, res) => { /* ... código sin cambios ... */ });
app.get('/about', (req, res) => res.render('about', { title: 'Acerca de' }));
app.get('/baseslegales', (req, res) => res.render('baseslegales', { title: 'Bases legales' }));
app.get('/forgot', (req, res) => res.render('forgot', { title: 'Recuperar contraseña' }));

// ===============================
//         LÓGICA DE SOCKET.IO
// ===============================
io.on('connection', (socket) => { /* ... código sin cambios ... */ });

// ===============================
// Iniciar Servidor
// ===============================
server.listen(port, () => console.log(`✅ Servidor corriendo en http://localhost:${port}`));
mongoose.connect('mongodb+srv://admin:admin123@miapp.qnclhil.mongodb.net/?retryWrites=true&w=majority&appName=miapp', {})
.then(() => console.log('✅ Conexión exitosa a MongoDB Atlas'))
.catch(err => console.error('❌ Error conectando a MongoDB', err));