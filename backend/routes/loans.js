const express = require('express');
const auth = require('../middleware/auth');
const Loan = require('../models/Loan');
const User = require('../models/User');
const InterestRate = require('../models/InterestRate');
const Notification = require('../models/Notification'); // Added
const router = express.Router();

let systemProfits = 0;

router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching loans for user:', req.user.id, 'Role:', req.user.role);
    const query = req.user.role === 'customer' ? { customerId: req.user.id } : {};
    const loans = await Loan.find(query)
      .populate('customerId', 'name email creditScore netWorth idNumber licenseNumber')
      .populate('lenderId', 'name');
    const loansWithInterest = loans.map(loan => {
      const outstanding = loan.amount - loan.repaymentAmount;
      const interest = outstanding * (loan.interestRate / 100);
      return {
        ...loan._doc,
        outstandingWithInterest: outstanding + interest,
        interestAmount: interest
      };
    });
    res.json(loansWithInterest);
  } catch (err) {
    console.error('Error fetching loans:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/lender', auth, async (req, res) => {
  try {
    if (req.user.role !== 'lender' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    console.log('Fetching lender loans for:', req.user.id);
    const loans = await Loan.find({ lenderId: req.user.id })
      .populate('customerId', 'name email creditScore netWorth idNumber licenseNumber')
      .populate('lenderId', 'name');
    const loansWithInterest = loans.map(loan => {
      const outstanding = loan.amount - loan.repaymentAmount;
      const interest = outstanding * (loan.interestRate / 100);
      return {
        ...loan._doc,
        outstandingWithInterest: outstanding + interest,
        interestAmount: interest
      };
    });
    res.json(loansWithInterest);
  } catch (err) {
    console.error('Error fetching lender loans:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/balance', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied, admin only' });
    }
    console.log('Fetching balance');
    const loans = await Loan.find();
    const balance = loans.reduce((sum, loan) => {
      const outstanding = loan.amount - loan.repaymentAmount;
      const interest = outstanding * (loan.interestRate / 100);
      return sum + outstanding + interest;
    }, 0);
    res.json({ balance });
  } catch (err) {
    console.error('Error fetching balance:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/balance/update', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied, admin only' });
    }
    const { amount } = req.body;
    if (typeof amount !== 'number') {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    console.log('Updating balance with amount:', amount);
    const loans = await Loan.find();
    const currentBalance = loans.reduce((sum, loan) => {
      const outstanding = loan.amount - loan.repaymentAmount;
      const interest = outstanding * (loan.interestRate / 100);
      return sum + outstanding + interest;
    }, 0);
    const newBalance = currentBalance + amount;
    res.json({ balance: newBalance });
  } catch (err) {
    console.error('Error updating balance:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/reports', auth, async (req, res) => {
  try {
    console.log('Fetching reports for user:', req.user.id, 'Role:', req.user.role);
    const query = req.user.role === 'customer' ? { customerId: req.user.id } : req.user.role === 'lender' ? { lenderId: req.user.id } : {};
    const loans = await Loan.find(query);
    const reports = {
      totalLoans: loans.length,
      pending: loans.filter(l => l.status === 'pending').length,
      approved: loans.filter(l => l.status === 'approved' || l.status === 'active').length,
      completed: loans.filter(l => l.status === 'completed').length,
      defaulted: loans.filter(l => l.status === 'defaulted').length
    };
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/reports/detailed', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied, admin only' });
    }
    console.log('Fetching detailed reports');
    const loans = await Loan.find().populate('customerId', 'name idNumber licenseNumber');
    const byDate = loans.reduce((acc, loan) => {
      const date = new Date(loan.createdAt).toISOString().split('T')[0];
      acc[date] = acc[date] || { date, count: 0, totalAmount: 0, customers: [] };
      acc[date].count += 1;
      const outstanding = loan.amount - loan.repaymentAmount;
      const interest = outstanding * (loan.interestRate / 100);
      acc[date].totalAmount += outstanding + interest;
      acc[date].customers.push({
        name: loan.customerId?.name || 'Unknown',
        amount: outstanding + interest,
        idNumber: loan.customerId?.idNumber,
        licenseNumber: loan.customerId?.licenseNumber
      });
      return acc;
    }, {});
    const paymentTrends = loans.reduce((acc, loan) => {
      if (loan.repaymentAmount > 0) {
        const date = new Date(loan.createdAt).toISOString().split('T')[0];
        acc[date] = acc[date] || { date, totalRepaid: 0 };
        acc[date].totalRepaid += loan.repaymentAmount;
      }
      return acc;
    }, {});
    res.json({
      byDate: Object.values(byDate),
      paymentTrends: Object.values(paymentTrends)
    });
  } catch (err) {
    console.error('Error fetching detailed reports:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/profit-loss', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied, admin only' });
    }
    console.log('Fetching profit/loss');
    const loans = await Loan.find();
    const profits = loans.reduce((sum, loan) => {
      const outstanding = loan.amount - loan.repaymentAmount;
      const interest = outstanding * (loan.interestRate / 100);
      if (loan.status !== 'completed' && loan.status !== 'defaulted') {
        return sum + interest;
      }
      if (loan.status === 'completed' && loan.repaymentAmount > 0) {
        return sum + (loan.repaymentAmount - loan.amount);
      }
      return sum;
    }, 0);
    const losses = loans.reduce((sum, loan) => {
      if (loan.status === 'defaulted') {
        return sum + (loan.amount - loan.repaymentAmount);
      }
      return sum;
    }, 0);
    res.json({ profits, losses });
  } catch (err) {
    console.error('Error fetching profit/loss:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/interest-rules', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied, admin only' });
    }
    console.log('Fetching interest rules');
    const rules = await InterestRate.find();
    res.json(rules);
  } catch (err) {
    console.error('Error fetching interest rules:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/interest-rules', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied, admin only' });
    }
    const { minAmount, maxAmount, rate, timeFrame } = req.body;
    if (!minAmount || !maxAmount || !rate || !timeFrame) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (minAmount >= maxAmount || rate < 0 || timeFrame <= 0) {
      return res.status(400).json({ error: 'Invalid input values' });
    }
    console.log('Creating interest rule:', req.body);
    const rule = new InterestRate({ minAmount, maxAmount, rate, timeFrame });
    await rule.save();
    
    // Create notification
    const notification = new Notification({
      type: 'interestRule',
      message: `New interest rule set: ${rate}% for ${minAmount}-${maxAmount} over ${timeFrame} months`,
    });
    await notification.save();
    
    res.json(rule);
  } catch (err) {
    console.error('Error creating interest rule:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/apply', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { amount, lenderId, idNumber, licenseNumber } = req.body;
    if (!amount || !lenderId) {
      return res.status(400).json({ error: 'Amount and lender are required' });
    }
    console.log('Applying loan for user:', req.user.id, 'Amount:', amount, 'Lender:', lenderId);
    const user = await User.findById(req.user.id);
    const maxLoan = user.netWorth * 3;
    if (amount > maxLoan) {
      return res.status(400).json({ error: `Loan amount exceeds limit of M ${maxLoan.toLocaleString()}` });
    }
    const interestRule = await InterestRate.findOne({
      minAmount: { $lte: amount },
      maxAmount: { $gte: amount }
    });
    const loan = new Loan({
      customerId: req.user.id,
      lenderId,
      amount,
      status: 'pending',
      interestRate: interestRule ? interestRule.rate : 15,
      timeFrame: interestRule ? interestRule.timeFrame : 3
    });
    await loan.save();
    if (idNumber || licenseNumber) {
      await User.findByIdAndUpdate(req.user.id, { idNumber, licenseNumber });
    }
    
    // Create notification
    const notification = new Notification({
      type: 'loanApplication',
      message: `New loan application for M ${amount.toLocaleString()} by ${user.name}`,
      userId: req.user.id,
    });
    await notification.save();
    
    res.json(loan);
  } catch (err) {
    console.error('Error applying loan:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/repay', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { loanId, amount, lenderId } = req.body;
    if (!loanId || !amount || !lenderId) {
      return res.status(400).json({ error: 'Loan ID, amount, and lender ID are required' });
    }
    console.log('Repaying loan:', loanId, 'Amount:', amount, 'Lender:', lenderId);
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    if (loan.customerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (loan.lenderId?.toString() !== lenderId) {
      return res.status(400).json({ error: 'Invalid lender for this loan' });
    }
    const outstanding = loan.amount - loan.repaymentAmount;
    const interest = outstanding * (loan.interestRate / 100);
    const totalDue = outstanding + interest;
    if (amount > totalDue) {
      return res.status(400).json({ error: `Repayment amount exceeds M ${totalDue.toLocaleString()}` });
    }
    loan.repaymentAmount += amount;
    loan.repaymentHistory.push({ date: new Date(), amount });
    if (loan.repaymentAmount >= totalDue) {
      loan.status = 'completed';
      systemProfits += interest;
    } else if (loan.repaymentAmount > 0 && loan.repaymentAmount < totalDue) {
      loan.status = 'approved';
    }
    await loan.save();
    const user = await User.findById(req.user.id);
    user.creditScore = Math.min(300 + Math.floor(user.netWorth / 100) + Math.floor(amount / 100), 850);
    await user.save();
    
    // Create notification
    const notification = new Notification({
      type: 'loanPayment',
      message: `Payment of M ${amount.toLocaleString()} made for loan ${loanId} by ${user.name}`,
      userId: req.user.id,
    });
    await notification.save();
    
    res.json(loan);
  } catch (err) {
    console.error('Error making repayment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'lender') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { loanId, status } = req.body;
    if (!loanId || !status) {
      return res.status(400).json({ error: 'Loan ID and status are required' });
    }
    const validStatuses = ['pending', 'approved', 'rejected', 'active', 'completed', 'defaulted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    console.log('Updating loan status:', loanId, 'Status:', status);
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    if (req.user.role === 'lender' && loan.lenderId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    loan.status = status;
    if (status === 'approved') {
      loan.lenderId = req.user.id;
      loan.status = 'active';
      const interestRule = await InterestRate.findOne({
        minAmount: { $lte: loan.amount },
        maxAmount: { $gte: loan.amount }
      });
      loan.interestRate = interestRule ? interestRule.rate : 15;
      loan.timeFrame = interestRule ? interestRule.timeFrame : 3;
      await loan.save();
    }
    await loan.save();
    
    // Create notification for approval or rejection
    if (status === 'approved' || status === 'rejected') {
      const customer = await User.findById(loan.customerId);
      const notification = new Notification({
        type: status === 'approved' ? 'loanApproval' : 'loanRejection',
        message: `Loan ${loanId} ${status} for ${customer.name}`,
        userId: loan.customerId,
      });
      await notification.save();
    }
    
    res.json(loan);
  } catch (err) {
    console.error('Error updating loan status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;