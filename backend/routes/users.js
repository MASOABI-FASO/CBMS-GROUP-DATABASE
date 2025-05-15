const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Loan = require('../models/Loan');
const router = express.Router();

// Get all users (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied, admin only' });
    }
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user (admin only)
router.put('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied, admin only' });
    }
    const { userId, name, email, role, userType, netWorth, idNumber, licenseNumber } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    if (userType === 'individual' && role === 'customer' && !idNumber) {
      return res.status(400).json({ error: 'ID Number is required for individual customers' });
    }
    if (userType === 'company' && !licenseNumber) {
      return res.status(400).json({ error: 'License Number is required for company users' });
    }
    const updateData = {
      name: name?.trim(),
      email: email?.trim().toLowerCase(),
      role,
      userType,
      netWorth: netWorth != null ? Number(netWorth) : 0,
      idNumber: userType === 'individual' ? (idNumber || '') : undefined,
      licenseNumber: userType === 'company' ? (licenseNumber || '') : undefined,
    };
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error updating user:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: `Invalid user data: ${err.message}` });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied, admin only' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get credit history (lender or admin)
router.get('/credit-history', auth, async (req, res) => {
  try {
    if (req.user.role !== 'lender' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    console.log('Fetching credit history for:', email);
    const user = await User.findOne({ email: email.toLowerCase() }).select('name email creditScore netWorth idNumber licenseNumber');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const loans = await Loan.find({ customerId: user._id }).select('amount repaymentAmount status repaymentHistory interestRate createdAt');
    // Derive credit score history from repayment history
    const creditHistory = loans.reduce((acc, loan) => {
      loan.repaymentHistory.forEach(repayment => {
        const date = new Date(repayment.date).toISOString().split('T')[0];
        // Assume credit score increases by (repayment.amount / 100) per repayment, capped at 850
        const creditImpact = Math.floor(repayment.amount / 100);
        const baseScore = user.creditScore || 300;
        const score = Math.min(baseScore + creditImpact, 850);
        acc.push({
          date,
          creditScore: score,
          repaymentAmount: repayment.amount,
          loanId: loan._id
        });
      });
      // Add initial score at loan creation if no repayments
      if (loan.repaymentHistory.length === 0) {
        const date = new Date(loan.createdAt).toISOString().split('T')[0];
        acc.push({
          date,
          creditScore: user.creditScore || 300,
          repaymentAmount: 0,
          loanId: loan._id
        });
      }
      return acc;
    }, []);
    // Sort by date
    creditHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({
      email: user.email,
      creditScore: user.creditScore || 300,
      netWorth: user.netWorth || 0,
      idNumber: user.idNumber,
      licenseNumber: user.licenseNumber,
      loans: loans.map(loan => ({
        _id: loan._id,
        amount: loan.amount,
        repaymentAmount: loan.repaymentAmount,
        status: loan.status,
        interestRate: loan.interestRate,
        createdAt: loan.createdAt
      })),
      creditHistory // Array of { date, creditScore, repaymentAmount, loanId }
    });
  } catch (err) {
    console.error('Error fetching credit history:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all lenders (for customer loan applications)
router.get('/lenders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const lenders = await User.find({ role: 'lender' }).select('name email');
    res.json(lenders);
  } catch (err) {
    console.error('Error fetching lenders:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;