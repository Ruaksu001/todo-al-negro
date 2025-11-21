// ===============================
// Rutas API REST para Usuarios
// ===============================

const express = require('express');
const router = express.Router();
const usuariosController = require('../../controllers/usuariosController');
const { verificarToken } = require('../../middleware/auth');

// ========== Rutas Públicas (sin autenticación) ==========

/**
 * POST /api/usuarios/register
 * Registrar nuevo usuario
 * Body: { nombre, usuario, correo, contraseña, seguridad, fecha }
 */
router.post('/register', usuariosController.register);

/**
 * POST /api/usuarios/login
 * Iniciar sesión y obtener token JWT
 * Body: { usuario, contraseña }
 */
router.post('/login', usuariosController.login);


// ========== Rutas Protegidas (requieren token JWT) ==========

/**
 * GET /api/usuarios/perfil
 * Obtener información del perfil del usuario autenticado
 * Header: Authorization: Bearer <token>
 */
router.get('/perfil', verificarToken, usuariosController.getProfile);

/**
 * PUT /api/usuarios/saldo
 * Actualizar saldo del usuario (recarga, retiro, apuesta, ganancia)
 * Header: Authorization: Bearer <token>
 * Body: { tipo, monto, descripcion }
 */
router.put('/saldo', verificarToken, usuariosController.updateBalance);

/**
 * GET /api/usuarios/transacciones
 * Obtener historial de transacciones del usuario
 * Header: Authorization: Bearer <token>
 */
router.get('/transacciones', verificarToken, usuariosController.getTransactions);


module.exports = router;
