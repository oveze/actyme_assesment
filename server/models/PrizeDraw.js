const mongoose = require('mongoose');

const prizeDrawSchema = new mongoose.Schema({
  name: { type: String, required: true },
  drawDate: { type: Date, required: true },
  entries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PrizeDraw', prizeDrawSchema);