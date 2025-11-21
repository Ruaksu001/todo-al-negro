// ===============================
// Modelo de Estado del Juego
// ===============================

const mongoose = require('mongoose');

// Esquema para el estado global del juego (historiales de ruleta)
const GameStateSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'main_game_state'
  },
  historialGanadores: {
    type: Array,
    default: []
  },
  historialApuestas: {
    type: Array,
    default: []
  }
});

// Exportar el modelo
module.exports = mongoose.model('GameState', GameStateSchema);
