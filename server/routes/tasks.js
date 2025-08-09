const express = require('express');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/complete', auth, async (req, res) => {
  const { taskId } = req.body;
  try {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    const activity = new Activity({
      userId: req.user.id,
      taskId,
      pointsEarned: task.points
    });
    await activity.save();

    const user = await User.findById(req.user.id);
    user.points += task.points;
    user.drawEntries += Math.floor(task.points / 10); // 1 entry per 10 points
    await user.save();

    res.json({ msg: 'Task completed', points: user.points, drawEntries: user.drawEntries });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/createTask', auth, async (req, res) => {
  const { title, description, points } = req.body;
  try {
    const task = new Task({ title, description, points });
    await task.save();
    res.json({ msg: 'Task created', task });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;