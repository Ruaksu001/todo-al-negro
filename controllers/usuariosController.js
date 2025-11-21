// ===============================
// Controlador de Usuarios
// ===============================

const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const { generarToken } = require('../middleware/auth');

/**
 * Registrar nuevo usuario con contraseña encriptada
 * POST /api/usuarios/register
 */
exports.register = async (req, res) => {
  try {
    const { nombre, usuario, correo, contraseña, seguridad, fecha } = req.body;

    // Validar datos requeridos
    if (!nombre || !usuario || !correo || !contraseña || !seguridad) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Todos los campos son obligatorios'
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({
      $or: [{ usuario }, { correo }]
    });

    if (usuarioExistente) {
      return res.status(400).json({
        error: 'Usuario ya existe',
        message: 'El nombre de usuario o correo ya están registrados'
      });
    }

    // Encriptar la contraseña con bcrypt (10 rounds)
    const hashContraseña = await bcrypt.hash(contraseña, 10);
    const hashSeguridad = await bcrypt.hash(seguridad, 10);

    // Generar userId único (número entre 10000 y 99999)
    let userId;
    let userIdExiste = true;
    while (userIdExiste) {
      userId = Math.floor(10000 + Math.random() * 90000);
      const usuarioConId = await Usuario.findOne({ userId });
      userIdExiste = !!usuarioConId;
    }

    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      usuario,
      userId,
      correo,
      contraseña: hashContraseña,
      seguridad: hashSeguridad,
      fecha: fecha || '',
      saldo: 10000 // Saldo inicial por defecto
    });

    // Guardar en la base de datos
    await nuevoUsuario.save();

    // Generar token JWT
    const token = generarToken({
      id: nuevoUsuario._id,
      usuario: nuevoUsuario.usuario,
      correo: nuevoUsuario.correo
    });

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      token,
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        usuario: nuevoUsuario.usuario,
        correo: nuevoUsuario.correo,
        saldo: nuevoUsuario.saldo
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'No se pudo registrar el usuario'
    });
  }
};

/**
 * Login con verificación bcrypt y generación de token JWT
 * POST /api/usuarios/login
 */
exports.login = async (req, res) => {
  try {
    const { usuario, contraseña } = req.body;

    // Validar datos
    if (!usuario || !contraseña) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Usuario y contraseña son requeridos'
      });
    }

    // Buscar usuario por nombre de usuario o correo
    const usuarioEncontrado = await Usuario.findOne({
      $or: [{ usuario }, { correo: usuario }]
    });

    if (!usuarioEncontrado) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Usuario no encontrado'
      });
    }

    // Comparar contraseña con bcrypt
    const contraseñaValida = await bcrypt.compare(
      contraseña,
      usuarioEncontrado.contraseña
    );

    if (!contraseñaValida) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Contraseña incorrecta'
      });
    }

    // Generar token JWT
    const token = generarToken({
      id: usuarioEncontrado._id,
      usuario: usuarioEncontrado.usuario,
      correo: usuarioEncontrado.correo
    });

    res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuarioEncontrado._id,
        nombre: usuarioEncontrado.nombre,
        usuario: usuarioEncontrado.usuario,
        correo: usuarioEncontrado.correo,
        saldo: usuarioEncontrado.saldo
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'No se pudo iniciar sesión'
    });
  }
};

/**
 * Obtener perfil del usuario autenticado (ruta protegida)
 * GET /api/usuarios/perfil
 */
exports.getProfile = async (req, res) => {
  try {
    // req.usuario viene del middleware verificarToken
    const usuario = await Usuario.findById(req.usuario.id).select('-contraseña -seguridad');

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No se encontró el usuario en la base de datos'
      });
    }

    res.json({
      usuario: {
        id: usuario._id,
        userId: usuario.userId,
        nombre: usuario.nombre,
        usuario: usuario.usuario,
        correo: usuario.correo,
        saldo: usuario.saldo,
        fecha: usuario.fecha,
        historialTransacciones: usuario.historialTransacciones,
        createdAt: usuario.createdAt
      }
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'No se pudo obtener el perfil'
    });
  }
};

/**
 * Actualizar saldo del usuario (ruta protegida)
 * PUT /api/usuarios/saldo
 */
exports.updateBalance = async (req, res) => {
  try {
    const { tipo, monto, descripcion } = req.body;

    // Validar datos
    if (!tipo || !monto) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Tipo y monto son requeridos'
      });
    }

    if (!['recarga', 'retiro', 'apuesta', 'ganancia'].includes(tipo)) {
      return res.status(400).json({
        error: 'Tipo inválido',
        message: 'Tipo debe ser: recarga, retiro, apuesta o ganancia'
      });
    }

    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Calcular nuevo saldo
    let nuevoSaldo = usuario.saldo;
    
    if (tipo === 'recarga' || tipo === 'ganancia') {
      nuevoSaldo += parseFloat(monto);
    } else if (tipo === 'retiro' || tipo === 'apuesta') {
      nuevoSaldo -= parseFloat(monto);
      
      // Verificar saldo suficiente
      if (nuevoSaldo < 0) {
        return res.status(400).json({
          error: 'Saldo insuficiente',
          message: 'No tienes suficiente saldo para esta operación'
        });
      }
    }

    // Registrar transacción
    const transaccion = {
      tipo,
      monto: parseFloat(monto),
      descripcion: descripcion || `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} de $${monto}`,
      fecha: new Date(),
      saldoAnterior: usuario.saldo,
      saldoNuevo: nuevoSaldo
    };

    // Actualizar usuario
    usuario.saldo = nuevoSaldo;
    usuario.historialTransacciones.push(transaccion);
    await usuario.save();

    res.json({
      message: 'Saldo actualizado correctamente',
      saldoAnterior: transaccion.saldoAnterior,
      saldoNuevo: nuevoSaldo,
      transaccion
    });

  } catch (error) {
    console.error('Error al actualizar saldo:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'No se pudo actualizar el saldo'
    });
  }
};

/**
 * Obtener historial de transacciones (ruta protegida)
 * GET /api/usuarios/transacciones
 */
exports.getTransactions = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('historialTransacciones');

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Ordenar por fecha más reciente primero
    const transacciones = usuario.historialTransacciones.reverse();

    res.json({
      total: transacciones.length,
      transacciones
    });

  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'No se pudieron obtener las transacciones'
    });
  }
};
