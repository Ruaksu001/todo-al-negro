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

// 🔹 CONFIGURACIÓN CORREGIDA DE HANDLEBARS
app.engine('handlebars', engine({ 
    defaultLayout: 'main',
    helpers: {
        // Esta función es la que permite usar {{#section 'scripts'}} en tus vistas
        section: function(name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
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
  historialApuestas: { type: Array, default: [] }
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

app.get('/perfil', (req, res) => {
  if (!req.cookies.usuario) return res.redirect('/login');
  
  let mensaje = null;
  if (req.query.status === 'registrado') mensaje = '¡Te has registrado y tu sesión se ha iniciado exitosamente!';
  
  const saldo = req.cookies.saldo || 0;
  const username = req.cookies.nombre || 'Usuario';
  const usertag = req.cookies.usuario || 'usuario';

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
      mensaje: mensaje 
  });
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

app.post('/perfil/eliminar', async (req, res) => {
  try {
    const usuarioAEliminar = req.cookies.usuario;
    if (!usuarioAEliminar) return res.redirect('/login');
    
    await Usuario.deleteOne({ usuario: usuarioAEliminar });
    console.log(`✅ Usuario eliminado: ${usuarioAEliminar}`);

    res.clearCookie('usuario');
    res.clearCookie('nombre');
    res.clearCookie('saldo');
    return res.redirect('/');
  } catch (err) {
    console.error("❌ Error al eliminar el usuario:", err);
    return res.redirect('/perfil');
  }
});

app.get('/transacciones', (req, res) => res.render('transacciones', { title: 'Transacciones' }));
app.get('/about', (req, res) => res.render('about', { title: 'Acerca de' }));
app.get('/baseslegales', (req, res) => res.render('baseslegales', { title: 'Bases legales' }));
app.get('/forgot', (req, res) => res.render('forgot', { title: 'Recuperar contraseña' }));

// ===============================
//         LÓGICA DE SOCKET.IO
// ===============================
io.on('connection', (socket) => {
  console.log('✅ Un usuario se ha conectado al lobby');

  socket.on('nueva-jugada', async (data) => {
    try {
      await Usuario.updateOne({ usuario: data.usertag }, { $set: { saldo: data.saldo } });
      
      const updatedGameState = await GameState.findByIdAndUpdate(
        'main_game_state',
        { $set: { 
            historialGanadores: data.historialGanadores,
            historialApuestas: data.historialApuestas
          }},
        { new: true, upsert: true, lean: true }
      );
      
      io.emit('actualizar-historial', {
        historialGanadores: updatedGameState.historialGanadores,
        historialApuestas: updatedGameState.historialApuestas
      });

    } catch (error) {
      console.error('Error al procesar la jugada:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Un usuario se ha desconectado');
  });
});


// ===============================
// Iniciar Servidor
// ===============================
server.listen(port, () => console.log(`✅ Servidor corriendo en http://localhost:${port}`));
mongoose.connect('mongodb+srv://admin:admin123@miapp.qnclhil.mongodb.net/?retryWrites=true&w=majority&appName=miapp', {})
.then(() => console.log('✅ Conexión exitosa a MongoDB Atlas'))
.catch(err => console.error('❌ Error conectando a MongoDB', err));