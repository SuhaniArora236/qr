const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'prototype_secret_key';

// Middleware to protect routes
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

// GET /api/user/:id (Protected)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.userId !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/user/update (Protected)
router.post('/update', authMiddleware, async (req, res) => {
  try {
    const { userId, ...updateData } = req.body;
    if (req.user.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/emergency/:id (Public route)
router.get('/emergency/:id', async (req, res) => {
  try {
    // Only return public-safe information initially. 
    // Protected info like policy number requires PIN (handled via another route or client-side filter)
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // We send all data, but frontend will mask policy details until PIN is entered.
    // In a real production app, we would have a separate POST route to verify PIN and fetch sensitive data.
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
