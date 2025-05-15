const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification'); // Added
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, userType, netWorth, idNumber, licenseNumber } = req.body;

    // Validate required fields
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!email?.trim()) return res.status(400).json({ error: 'Email is required' });
    if (!password?.trim()) return res.status(400).json({ error: 'Password is required' });
    if (!['admin', 'lender', 'customer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, lender, or customer' });
    }
    if (!['individual', 'company'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type. Must be individual or company' });
    }
    if (userType === 'individual' && role === 'customer' && !idNumber?.trim()) {
      return res.status(400).json({ error: 'ID Number is required for individual customers' });
    }
    if (userType === 'company' && !licenseNumber?.trim()) {
      return res.status(400).json({ error: 'License Number is required for company users' });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(400).json({ error: 'User already exists' });

    // Create new user
    user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      userType,
      netWorth: netWorth != null ? Number(netWorth) : 0,
      idNumber: userType === 'individual' ? (idNumber || '') : '',
      licenseNumber: userType === 'company' ? (licenseNumber || '') : '',
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    await user.save();

    // Create notification
    const notification = new Notification({
      type: 'newUser',
      message: `New user ${name} (${role}) created`,
      userId: user._id,
    });
    await notification.save();

    // Generate JWT
    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        netWorth: user.netWorth,
        idNumber: user.idNumber,
        licenseNumber: user.licenseNumber,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: `Invalid user data: ${err.message}` });
    }
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        netWorth: user.netWorth,
        idNumber: user.idNumber,
        licenseNumber: user.licenseNumber,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;