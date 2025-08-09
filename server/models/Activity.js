const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  completedAt: { type: Date, default: Date.now },
  pointsEarned: { type: Number, required: true }
});

module.exports = mongoose.model('Activity', activitySchema);