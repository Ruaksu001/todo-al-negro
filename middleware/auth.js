// ===============================
// Middleware de Autenticación JWT
// ===============================

const jwt = require('jsonwebtoken');

// Clave secreta para firmar tokens (En producción usar variable de entorno)
const SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_muy_segura_2025';

/**
 * Middleware para verificar token JWT
 * Protege rutas que requieren autenticación
 */
const verificarToken = (req, res, next) => {
  // Obtener el header de autorización
  const authHeader = req.headers.authorization;
  
  // Verificar que exista el header
  if (!authHeader) {
    return res.status(403).json({
      error: 'Token requerido',
      message: 'No se proporcionó un token de autenticación'
    });
  }

  // Extraer el token del formato "Bearer <token>"
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({
      error: 'Token inválido',
      message: 'Formato de token incorrecto'
    });
  }

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, SECRET);
    
    // Adjuntar información del usuario al request
    req.usuario = decoded;
    
    // Continuar con la siguiente función
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido o expirado',
      message: 'Por favor, inicie sesión nuevamente'
    });
  }
};

/**
 * Función para generar un nuevo token JWT
 * @param {Object} payload - Datos a incluir en el token
 * @param {String} expiresIn - Tiempo de expiración (ej: '1h', '7d')
 */
const generarToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, SECRET, { expiresIn });
};

module.exports = {
  verificarToken,
  generarToken,
  SECRET
};
