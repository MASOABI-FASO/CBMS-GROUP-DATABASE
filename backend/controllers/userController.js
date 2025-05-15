const User = require('../models/User');
const Loan = require('../models/Loan');

const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  const { userId, name, email } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.name = name || user.name;
    user.email = email || user.email;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  const { userId } = req.body;
  try {
    await User.findByIdAndDelete(userId);
    res.json({ msg: 'User deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const getCreditHistory = async (req, res) => {
  const { email } = req.query;
  try {
    const user = await User.findOne({ email }).select('name email creditScore netWorth idNumber licenseNumber');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const loans = await Loan.find({ customerId: user._id }).select('amount status repaymentAmount interestRate timeFrame');
    res.json({
      email: user.email,
      creditScore: user.creditScore,
      netWorth: user.netWorth,
      idNumber: user.idNumber,
      licenseNumber: user.licenseNumber,
      loans,
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getUsers, updateUser, deleteUser, getCreditHistory };