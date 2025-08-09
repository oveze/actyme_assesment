const express = require('express');
const PrizeDraw = require('../models/PrizeDraw');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const draws = await PrizeDraw.find().populate('winner', 'username');
    res.json(draws);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/enter', auth, async (req, res) => {
  const { drawId } = req.body;
  try {
    const draw = await PrizeDraw.findById(drawId);
    if (!draw) return res.status(404).json({ msg: 'Prize draw not found' });
    const user = await User.findById(req.user.id);
    if (user.drawEntries <= 0) return res.status(400).json({ msg: 'No draw entries available' });

    draw.entries.push(req.user.id);
    user.drawEntries -= 1;
    await draw.save();
    await user.save();

    res.json({ msg: 'Entered prize draw', drawEntries: user.drawEntries });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/create', auth, async (req, res) => {
  const { name, drawDate } = req.body;
  try {
    const draw = new PrizeDraw({ name, drawDate });
    await draw.save();
    res.json({ msg: 'Prize draw created', draw });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;