const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'prototype_secret_key';

// POST /api/verify-policy (mock dataset)
router.post('/verify-policy', (req, res) => {
  const { policyNumber, fullName } = req.body;
  // Mock logic: allow any policy starting with "ZK" (Zurich Kotak mock)
  if (policyNumber && policyNumber.startsWith('ZK')) {
    return res.json({ success: true, message: 'Policy verified successfully.' });
  }
  return res.status(400).json({ success: false, message: 'Invalid policy number. Use a policy starting with ZK.' });
});

// POST /api/signup
router.post('/signup', async (req, res) => {
  try {
    const { fullName, phone, dob, policyNumber, password } = req.body;

    let user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists with this phone number.' });
    }

    user = new User({ fullName, phone, dob, policyNumber, password });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token, userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token, userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
