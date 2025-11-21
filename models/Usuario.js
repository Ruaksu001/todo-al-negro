// ===============================
// Modelo de Usuario con Mongoose
// ===============================

const mongoose = require('mongoose');

// Esquema para la colección de Usuarios
const UsuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  usuario: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: Number,
    unique: true,
    sparse: true
  },
  correo: {
    type: String,
    required: true,
    unique: true
  },
  contraseña: {
    type: String,
    required: true
  },
  seguridad: {
    type: String,
    required: true
  },
  fecha: {
    type: String
  },
  saldo: {
    type: Number,
    default: 10000
  },
  historialTransacciones: {
    type: Array,
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Exportar el modelo
module.exports = mongoose.model('Usuario', UsuarioSchema);
