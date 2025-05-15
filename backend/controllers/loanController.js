const Loan = require('../models/Loan');
const User = require('../models/User');

const applyLoan = async (req, res) => {
  const { amount, interestRate, timeFrame } = req.body;
  const customerId = req.user.id;
  try {
    const loan = new Loan({ customerId, amount, interestRate, timeFrame });
    await loan.save();
    res.json(loan);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const getLoans = async (req, res) => {
  try {
    const loans = await Loan.find().populate('customerId lenderId');
    res.json(loans);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const getLenderLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ lenderId: req.user.id })
      .populate('customerId', 'name email creditScore netWorth idNumber licenseNumber')
      .populate('lenderId', 'name');
    res.json(loans);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const getLoanReports = async (req, res) => {
  try {
    const loans = await Loan.find({ lenderId: req.user.id });
    const reports = {
      totalLoans: loans.length,
      pending: loans.filter(loan => loan.status === 'pending').length,
      approved: loans.filter(loan => loan.status === 'approved' || loan.status === 'active').length,
      completed: loans.filter(loan => loan.status === 'paid').length,
      defaulted: loans.filter(loan => loan.status === 'defaulted').length,
    };
    res.json(reports);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const updateLoanStatus = async (req, res) => {
  const { loanId, status } = req.body;
  try {
    const loan = await Loan.findById(loanId);
    if (!loan) return res.status(404).json({ msg: 'Loan not found' });
    loan.status = status;
    if (status === 'approved') {
      loan.lenderId = req.user.id;
      loan.status = 'active'; // Set to active upon approval
    }
    await loan.save();
    res.json(loan);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const makeRepayment = async (req, res) => {
  const { loanId, amount } = req.body;
  try {
    const loan = await Loan.findById(loanId);
    if (!loan) return res.status(404).json({ msg: 'Loan not found' });
    loan.repaymentHistory.push({ date: new Date(), amount });
    loan.repaymentAmount = (loan.repaymentAmount || 0) + amount;
    if (loan.repaymentAmount >= loan.amount * (1 + loan.interestRate / 100)) {
      loan.status = 'paid';
    }
    await loan.save();
    res.json(loan);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { applyLoan, getLoans, getLenderLoans, getLoanReports, updateLoanStatus, makeRepayment };