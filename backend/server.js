const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const loanRoutes = require('./routes/loans');
const notificationRoutes = require('./routes/notifications'); // Added
const authMiddleware = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for JSON payloads
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Log HTTP requests

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/lending_platform')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/loans', authMiddleware, loanRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes); // Added

// Error Handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));