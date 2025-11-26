// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Portfolio = require('../models/Portfolio'); // import Portfolio here

const JWT_SECRET = process.env.JWT_SECRET || 'test';
const TOKEN_EXPIRES = process.env.JWT_EXPIRES || '7d';

// REGISTER
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email & password required' });

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'email already used' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash: hash, name: name || '' });

    // create default portfolio for the new user so frontend can immediately fetch it
    await Portfolio.create({ user: user._id, name: 'Main' });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES }
    );

    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ error: 'registration failed' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email & password required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES }
    );

    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'login failed' });
  }
});

module.exports = router;
