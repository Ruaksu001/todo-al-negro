// ===============================
// Servidor Express con Handlebars
// ===============================

const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 80;

// Configuración de Handlebars
app.engine('handlebars', engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// "Base de datos" temporal (solo memoria)
const usuarios = [];

// ===============================
//          RUTAS DE VISTAS
// ===============================

// Home
app.get('/', (req, res) => res.render('home', { title: 'Inicio' }));

// -------- Registro --------
app.get('/register', (req, res) => res.render('register', { title: 'Registro' }));

app.post('/register', (req, res) => {
  const nombrecompleto =
    (req.body.nombrecompleto || req.body.nombre || req.body.fullname || '').trim();
  const usuario =
    (req.body.usuario || req.body.username || '').trim();
  const correo =
    (req.body.correo || req.body.email || '').trim();
  const contrasenia =
    (req.body.contraseña || req.body.contrasena || req.body.password || req.body.pass || '').trim();
  const confirmar =
    (req.body.confirmar || req.body.passwordConfirm || req.body.confirm || req.body.confirmar_contrasena || '').trim();
  const seguridad =
    (req.body.seguridad || '').trim();
  const fecha =
    (req.body.fecha || '').trim();

  // Validar campos vacíos
  if (!nombrecompleto || !usuario || !correo || !contrasenia || !confirmar || !seguridad || !fecha) {
    return res.render('register', {
      title: 'Registro',
      error: 'Faltan campos por completar.',
      nombrecompleto,
      usuario,
      correo,
      seguridad,
      fecha
    });
  }

  // Validar contraseñas
  if (contrasenia !== confirmar) {
    return res.render('register', {
      title: 'Registro',
      error: 'Las contraseñas no coinciden.',
      nombrecompleto,
      usuario,
      correo,
      seguridad,
      fecha
    });
  }

  // Verificar duplicados
  const correoExistente = usuarios.find(u => u.correo === correo);
  const usuarioExistente = usuarios.find(u => u.usuario === usuario);

  if (correoExistente) {
    return res.render('register', {
      title: 'Registro',
      error: 'Ya existe una cuenta registrada con este correo electrónico.',
      nombrecompleto,
      usuario,
      correo,
      seguridad,
      fecha
    });
  }

  if (usuarioExistente) {
    return res.render('register', {
      title: 'Registro',
      error: '👤 El nombre de usuario ya está en uso.',
      nombrecompleto,
      usuario,
      correo,
      seguridad,
      fecha
    });
  }

  // Guardar usuario nuevo
  usuarios.push({ nombrecompleto, usuario, correo, contrasenia, seguridad, fecha });
  console.log('Usuario registrado:', nombrecompleto, `(${usuario})`);

  // Redirigir al Home
  return res.redirect('/');
});

// -------- Login --------
app.get('/login', (req, res) => res.render('login', { title: 'Iniciar sesión' }));

app.post('/login', (req, res) => {
  const correo = (req.body.email || req.body.correo || '').trim();
  const pass = (req.body.pass || req.body.password || req.body.contraseña || req.body.contrasena || '').trim();

  const usuario = usuarios.find(u => u.correo === correo && u.contrasenia === pass);

  if (!usuario) {
    return res.render('login', {
      title: 'Iniciar sesión',
      error: 'Correo o contraseña incorrectos.',
      correo
    });
  }

  console.log('Inicio de sesión:', usuario.usuario);
  // Al loguear, mandamos los datos al perfil por querystring
  return res.redirect(`/perfil?name=${encodeURIComponent(usuario.nombrecompleto)}&user=${encodeURIComponent(usuario.usuario)}`);
});

// -------- Recuperar contraseña --------
app.get('/forgot', (req, res) => {
  res.render('forgot', { title: 'Recuperar contraseña' });
});

app.post('/forgot', (req, res) => {
  const correo = (req.body.correo || '').trim();
  const seguridad = (req.body.seguridad || '').trim();
  const fecha = (req.body.fecha || '').trim();

  // Buscar usuario por correo
  const usuario = usuarios.find(u => u.correo === correo);

  if (!usuario) {
    return res.render('forgot', {
      title: 'Recuperar contraseña',
      error: 'No existe ninguna cuenta registrada con este correo electrónico.',
      correo,
      seguridad,
      fecha
    });
  }

  // Verificar los otros datos
  if (usuario.seguridad !== seguridad || usuario.fecha !== fecha) {
    return res.render('forgot', {
      title: 'Recuperar contraseña',
      error: 'Los datos ingresados no coinciden con nuestra base de datos.',
      correo,
      seguridad,
      fecha
    });
  }

  // Si todo está correcto
  console.log(`Se envió un correo de recuperación a: ${correo}`);
  return res.render('forgot', {
    title: 'Recuperar contraseña',
    mensaje: 'Se ha enviado un correo con instrucciones para restablecer tu contraseña.',
  });
});

// -------- Lobby --------
app.get('/lobby', (req, res) => {
  const username = req.query.name || null;
  res.render('lobby', { title: 'Lobby', username });
});

// -------- Perfil --------
app.get('/perfil', (req, res) => {
  const username = (req.query.name || 'Usuario').trim();
  const usertag = (req.query.user || 'usuario').trim();

  // Generar ID único basado en el nombre de usuario
  let hash = 0;
  for (let i = 0; i < usertag.length; i++) {
    hash = (hash * 31 + usertag.charCodeAt(i)) % 1000000;
  }
  const id = String(hash).padStart(6, '0');

  res.render('perfil', {
    title: 'Perfil',
    username,
    usertag: `@${usertag}`,
    id,
    saldo: '45.000$',
  });
});

// -------- Otras vistas --------
app.get('/transacciones', (req, res) => res.render('transacciones', { title: 'Transacciones' }));
app.get('/about', (req, res) => res.render('about', { title: 'Acerca de' }));
app.get('/baseslegales', (req, res) => res.render('baseslegales', { title: 'Bases legales' }));

// ===============================
// Servidor en ejecución
// ===============================
app.listen(port, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${port}`);
});
