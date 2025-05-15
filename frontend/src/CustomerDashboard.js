import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import SocialIcons from './SocialIcons';

const CustomerDashboard = ({ user, onLogout }) => {
  const [loans, setLoans] = useState([]);
  const [lenders, setLenders] = useState([]);
  const [creditScore, setCreditScore] = useState(350); // Initialize with minimum score
  const [netWorth, setNetWorth] = useState(0);
  const [newLoan, setNewLoan] = useState({ amount: '', lenderId: '', idNumber: '', licenseNumber: '' });
  const [repayment, setRepayment] = useState({ loanId: '', amount: '', lenderId: '' });
  const [activeSection, setActiveSection] = useState('dashboard');
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('default');
  const [layoutMode, setLayoutMode] = useState('grid');
  const [language, setLanguage] = useState('en');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        await Promise.all([
          fetchLoans(isMounted),
          fetchLenders(isMounted),
          fetchCreditScore(isMounted),
        ]);
      } catch (err) {
        if (isMounted) {
          setError('Failed to load dashboard data');
          console.error('Fetch data error:', {
            message: err.message,
            stack: err.stack,
          });
        }
      }
    };

    fetchData();

    const creditScoreUpdateInterval = setInterval(() => {
      if (isMounted && loans.length > 0 && loans.every(loan => loan.status !== 'defaulted')) {
        setCreditScore(prev => {
          const newScore = Math.min(prev + 10, 850);
          if (newScore !== prev) {
            updateCreditScore(newScore);
            return newScore;
          }
          return prev;
        });
      }
    }, 30 * 24 * 60 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(creditScoreUpdateInterval);
    };
  }, [loans]);

  const fetchLoans = async (isMounted) => {
    try {
      const response = await api.get('/loans');
      if (isMounted) {
        setLoans(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Error fetching loans:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      if (isMounted) {
        alert('Failed to fetch loans');
        setLoans([]);
      }
    }
  };

  const fetchLenders = async (isMounted) => {
    try {
      const response = await api.get('/users/lenders');
      if (isMounted) {
        setLenders(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Error fetching lenders:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      if (isMounted) {
        alert('Failed to fetch lenders');
        setLenders([]);
      }
    }
  };

  const fetchCreditScore = async (isMounted) => {
    try {
      const response = await api.get('/users/credit-score');
      if (isMounted) {
        const score = Math.min(Math.max(response.data.creditScore || 350, 300), 850);
        setCreditScore(score);
        setNetWorth(response.data.netWorth);
      }
    } catch (err) {
      console.error('Error fetching credit score:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      if (isMounted) {
        setCreditScore(350);
        setNetWorth(user.netWorth || 0);
      }
    }
  };

  const updateCreditScore = async (newScore) => {
    try {
      await api.patch('/users/credit-history', {
        email: user.email,
        creditScore: newScore,
      });
    } catch (err) {
      console.error('Error updating credit score:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
    }
  };

  const handleApplyLoan = async (e) => {
    e.preventDefault();
    const amount = parseFloat(newLoan.amount) || 0;
    const maxLoanAmount = netWorth * 3;
    if (amount <= 0 || amount > maxLoanAmount) {
      alert(`Loan amount must be between M0.00 and ${formatCurrency(maxLoanAmount)}`);
      return;
    }
    try {
      const loanResponse = await api.post('/loans/apply', {
        amount,
        lenderId: newLoan.lenderId,
        idNumber: newLoan.idNumber,
        licenseNumber: newLoan.licenseNumber,
        termMonths: 3,
      });
      const newScore = Math.max(creditScore - 10, 300);
      setCreditScore(newScore);
      await updateCreditScore(newScore);
      setNewLoan({ amount: '', lenderId: '', idNumber: '', licenseNumber: '' });
      fetchLoans(true);
      alert('Loan application submitted');
    } catch (err) {
      console.error('Error applying for loan:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      alert(err.response?.data?.error || 'Failed to apply for loan');
    }
  };

  const handleRepayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(repayment.amount) || 0;
    if (amount <= 0) {
      alert('Repayment amount must be greater than M0.00');
      return;
    }
    try {
      const loan = loans.find(l => l._id === repayment.loanId);
      const isLate = loan?.status === 'defaulted';
      const repaymentResponse = await api.post('/loans/repay', {
        loanId: repayment.loanId,
        amount,
        lenderId: repayment.lenderId,
      });
      let newScore = creditScore;
      if (isLate) {
        newScore = Math.min(creditScore + 50, 850);
      } else {
        newScore = Math.min(creditScore + 100, 850);
      }
      setCreditScore(newScore);
      await updateCreditScore(newScore);
      setRepayment({ loanId: '', amount: '', lenderId: '' });
      fetchLoans(true);
      fetchCreditScore(true);
      alert('Repayment successful');
    } catch (err) {
      console.error('Error making repayment:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      alert(err.response?.data?.error || 'Failed to make repayment');
    }
  };

  const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) {
      return 'M 0.00';
    }
    return `M ${amount.toLocaleString('en-LS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateOutstandingWithInterest = (loan) => {
    if (!loan || loan.status === 'completed') return 0;
    const interest = loan.amount * (loan.interestRate / 100) * (3 / 12);
    return Math.max(0, (loan.amount + interest) - (loan.repaymentAmount || 0));
  };

  const renderRepaymentBars = () => {
    const completedLoans = loans.filter(loan => loan.status === 'completed');
    if (!completedLoans.length) return <p>{t('noRepaymentData')}</p>;

    const maxRepayment = Math.max(...completedLoans.map(loan => loan.repaymentAmount || 0), 1);
    return (
      <div className="bar-container repayment-bars">
        {completedLoans.map((loan, index) => (
          <div
            key={index}
            className="bar repayment-bar"
            style={{ height: `${((loan.repaymentAmount || 0) / maxRepayment) * 180}px` }}
            title={`${t('loan')} ${loan._id}: ${formatCurrency(loan.repaymentAmount || 0)}`}
          >
            {formatCurrency(loan.repaymentAmount || 0)}
          </div>
        ))}
      </div>
    );
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const translations = {
    en: {
      dashboard: 'Dashboard',
      applyLoan: 'Apply for Loan',
      repayLoan: 'Repay Loan',
      changeMode: 'Change Mode',
      logout: 'Logout',
      welcome: 'Welcome',
      creditScore: 'Credit Score',
      netWorth: 'Net Worth',
      repaymentHistory: 'Repayment History',
      loanDetails: 'Loan Details',
      loanId: 'Loan ID',
      lender: 'Lender',
      amount: 'Amount',
      interestRate: 'Interest Rate',
      outstanding: 'Outstanding',
      status: 'Status',
      loanRange: 'You can get M0.00 to',
      idNumber: 'ID Number',
      licenseNumber: 'License Number',
      apply: 'Apply',
      outstandingAmount: 'Outstanding Amount',
      pay: 'Pay',
      noRepaymentData: 'No repayment data available',
      error: 'Error',
      retry: 'Retry',
      customerPanel: 'Customer Panel',
      language: 'Language',
    },
    st: {
      dashboard: 'Letlapa la Tsamaiso',
      applyLoan: 'Etsa Kopo ea Kalimo',
      repayLoan: 'Lefella Kalimo',
      changeMode: 'Fetola Mokhoa',
      logout: 'Tsoa',
      welcome: 'Amoheloa',
      creditScore: 'Lintlha tsa Mokitlane',
      netWorth: 'Boleng ba Letlooa',
      repaymentHistory: 'Nalane ea Pusetso',
      loanDetails: 'Lintlha tsa Kalimo',
      loanId: 'ID ea Kalimo',
      lender: 'Mokopeli',
      amount: 'Chelete',
      interestRate: 'Sekhahla sa Tsoala',
      outstanding: 'E Salang',
      status: 'Boemo',
      loanRange: 'U ka fumana M0.00 ho',
      idNumber: 'Nomoro ea Boitsebiso',
      licenseNumber: 'Nomoro ea Laesense',
      apply: 'Etsa Kopo',
      outstandingAmount: 'Chelete e Salang',
      pay: 'Lefa',
      noRepaymentData: 'Ha ho lintlha tsa pusetso tse fumanehang',
      error: 'Phoso',
      retry: 'Leka hape',
      customerPanel: 'Panel ea Moreki',
      language: 'Puo',
    },
  };

  const t = (key) => translations[language][key] || key;

  const maxLoanAmount = netWorth * 3;

  if (error) {
    return (
      <div className={`dashboard-container ${viewMode === 'vibrant' ? 'vibrant' : ''}`}>
        <aside className="sidebar">
          <div className="sidebar-header">
            <img src="/logo.png" alt="Logo" className="sidebar-logo" />
            <h1>{t('customerPanel')}</h1>
          </div>
          <nav>
            <ul>
              <li>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="sidebar-button"
                >
                  <option value="en">English</option>
                  <option value="st">Sesotho</option>
                </select>
              </li>
              <li>
                <button onClick={handleLogout} className="sidebar-button logout-button">
                  <i className="fas fa-sign-out-alt"></i> {t('logout')}
                </button>
              </li>
            </ul>
            <div className="social-icons-container">
              <SocialIcons role="customer" />
            </div>
          </nav>
        </aside>
        <main className="dashboard-main">
          <h2><i className="fas fa-exclamation-circle"></i> {t('error')}</h2>
          <p className="error">{error}</p>
          <button onClick={() => window.location.reload()} className="action-button approve">
            <i className="fas fa-redo"></i> {t('retry')}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${viewMode === 'vibrant' ? 'vibrant' : ''}`}>
      <style>
        {`
          .vibrant {
            background-color: #fff9e6;
            color: #333;
            font-weight: 600;
          }
          .vibrant .sidebar {
            background-color: #ffeb99;
            color: #333;
            box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
          }
          .vibrant .sidebar-button {
            background-color: #ffe066;
            color: #333;
          }
          .vibrant .sidebar-button:hover,
          .vibrant .sidebar-button.active {
            background-color: #ffd700;
          }
          .vibrant .logout-button {
            background-color: #ff9999;
          }
          .vibrant .logout-button:hover {
            background-color: #ff6666;
          }
          .vibrant .dashboard-main {
            background-color: #fff9e6;
          }
          .vibrant .card {
            background-color: #ffe4b5;
            color: #333;
            border: 2px solid #ffcc80;
            border-radius: 8px;
          }
          .vibrant .highlight {
            color: #ff5722;
            font-size: 1.2rem;
          }
          .vibrant .action-button.approve {
            background-color: #ff9800;
            border: 2px solid #f57c00;
          }
          .vibrant .action-button.approve:hover {
            background-color: #f57c00;
          }
          .vibrant .action-button.reject {
            background-color: #d32f2f;
            border: 2px solid #b71c1c;
          }
          .vibrant .action-button.reject:hover {
            background-color: #b71c1c;
          }
          .vibrant .error {
            color: #d32f2f;
          }
          .vibrant .repayment-bar {
            background: linear-gradient(45deg, #ff9800, #ff5722);
            border-radius: 5px;
          }
          .vibrant .social-icons a {
            color: #333;
          }
          .vibrant .social-icons a:hover {
            color: #ff5722;
          }
          .card-list {
            display: ${layoutMode === 'list' ? 'block' : 'none'};
            width: 100%;
          }
          .card-grid {
            display: ${layoutMode === 'grid' ? 'flex' : 'none'};
            gap: 1.5rem;
            justify-content: center;
          }
          .card-list .card {
            display: flex;
            flex-direction: column;
            padding: 1rem;
            width: 100%;
            box-sizing: border-box;
            margin-bottom: 1rem;
          }
          .card-list .card h3 {
            margin: 0 0 0.5rem 0;
          }
          .card-list .card p {
            margin: 0 0 0.5rem 0;
          }
          .social-icons-container {
            position: absolute;
            bottom: 20px;
            left: 20px;
          }
          .layout-buttons {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .layout-button {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #333;
            transition: color 0.3s;
          }
          .layout-button.active {
            color: #ff5722;
          }
          .layout-button:hover {
            color: #ff9800;
          }
          .loan-range {
            color: #ff5722;
            font-weight: bold;
            margin-bottom: 1rem;
          }
          .vibrant .loan-range {
            color: #d32f2f;
          }
        `}
      </style>
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="Logo" className="sidebar-logo" />
          <h1>{t('customerPanel')}</h1>
        </div>
        <nav>
          <ul>
            <li>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="sidebar-button"
              >
                <option value="en">English</option>
                <option value="st">Sesotho</option>
              </select>
            </li>
            <li>
              <button
                className={`sidebar-button ${activeSection === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveSection('dashboard')}
              >
                <i className="fas fa-tachometer-alt"></i> {t('dashboard')}
              </button>
            </li>
            <li>
              <button
                className={`sidebar-button ${activeSection === 'apply-loan' ? 'active' : ''}`}
                onClick={() => setActiveSection('apply-loan')}
              >
                <i className="fas fa-hand-holding-usd"></i> {t('applyLoan')}
              </button>
            </li>
            <li>
              <button
                className={`sidebar-button ${activeSection === 'repay-loan' ? 'active' : ''}`}
                onClick={() => setActiveSection('repay-loan')}
              >
                <i className="fas fa-money-bill-wave"></i> {t('repayLoan')}
              </button>
            </li>
            <li>
              <button
                className={`sidebar-button ${viewMode === 'vibrant' ? 'active' : ''}`}
                onClick={() => setViewMode(viewMode === 'default' ? 'vibrant' : 'default')}
              >
                <i className="fas fa-cog"></i> {t('changeMode')}
              </button>
            </li>
          </ul>
          <div className="social-icons-container">
            <button onClick={handleLogout} className="sidebar-button logout-button">
              <i className="fas fa-sign-out-alt"></i> {t('logout')}
            </button>
            <SocialIcons role="customer" />
          </div>
        </nav>
      </aside>
      <main className="dashboard-main">
        <h2><i className="fas fa-user"></i> {t('welcome')}, {user.name}</h2>
        <div className="layout-buttons">
          <button
            className={`layout-button ${layoutMode === 'grid' ? 'active' : ''}`}
            onClick={() => setLayoutMode('grid')}
          >
            <i className="fas fa-th"></i>
          </button>
          <button
            className={`layout-button ${layoutMode === 'list' ? 'active' : ''}`}
            onClick={() => setLayoutMode('list')}
          >
            <i className="fas fa-list"></i>
          </button>
        </div>

        <div className={`section ${activeSection === 'dashboard' ? 'active' : ''}`}>
          <h3><i className="fas fa-tachometer-alt"></i> {t('dashboard')}</h3>
          <div className="card-grid">
            <div className="card">
              <h3><i className="fas fa-credit-card"></i> {t('creditScore')}</h3>
              <p className="highlight">{creditScore}</p>
            </div>
            <div className="card">
              <h3><i className="fas fa-money-bill-wave"></i> {t('netWorth')}</h3>
              <p className="highlight currency">{formatCurrency(netWorth)}</p>
            </div>
            <div className="card wide-card">
              <h3><i className="fas fa-chart-bar"></i> {t('repaymentHistory')}</h3>
              {renderRepaymentBars()}
            </div>
          </div>
          <div className="card-list">
            <div className="card">
              <h3><i className="fas fa-credit-card"></i> {t('creditScore')}</h3>
              <p className="highlight">{creditScore}</p>
            </div>
            <div className="card">
              <h3><i className="fas fa-money-bill-wave"></i> {t('netWorth')}</h3>
              <p className="highlight currency">{formatCurrency(netWorth)}</p>
            </div>
            <div className="card wide-card">
              <h3><i className="fas fa-chart-bar"></i> {t('repaymentHistory')}</h3>
              {renderRepaymentBars()}
            </div>
          </div>
          <h3><i className="fas fa-file-alt"></i> {t('loanDetails')}</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('loanId')}</th>
                  <th>{t('lender')}</th>
                  <th>{t('amount')}</th>
                  <th>{t('interestRate')}</th>
                  <th>{t('outstanding')}</th>
                  <th>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan._id}>
                    <td>{loan._id}</td>
                    <td>{loan.lenderId?.name || '-'}</td>
                    <td>{formatCurrency(loan.amount)}</td>
                    <td>{loan.interestRate != null ? `${loan.interestRate.toFixed(2)}%` : 'N/A'}</td>
                    <td>{formatCurrency(calculateOutstandingWithInterest(loan))}</td>
                    <td>{loan.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`section ${activeSection === 'apply-loan' ? 'active' : ''}`}>
          <h3><i className="fas fa-hand-holding-usd"></i> {t('applyLoan')}</h3>
          <div className="card">
            <p className="loan-range">{t('loanRange')} {formatCurrency(maxLoanAmount)}</p>
            <form onSubmit={handleApplyLoan}>
              <div className="form-group">
                <label><i className="fas fa-money-bill-wave"></i> {t('amount')}</label>
                <input
                  type="number"
                  value={newLoan.amount}
                  onChange={(e) => setNewLoan({ ...newLoan, amount: e.target.value })}
                  required
                  min="0"
                  max={maxLoanAmount}
                />
              </div>
              <div className="form-group">
                <label><i className="fas fa-user-tie"></i> {t('lender')}</label>
                <select
                  value={newLoan.lenderId}
                  onChange={(e) => setNewLoan({ ...newLoan, lenderId: e.target.value })}
                  required
                >
                  <option value="">{t('selectLender')}</option>
                  {lenders.map((lender) => (
                    <option key={lender._id} value={lender._id}>{lender.name}</option>
                  ))}
                </select>
              </div>
              {user.userType === 'individual' && (
                <div className="form-group">
                  <label><i className="fas fa-id-card"></i> {t('idNumber')}</label>
                  <input
                    type="text"
                    value={newLoan.idNumber}
                    onChange={(e) => setNewLoan({ ...newLoan, idNumber: e.target.value })}
                    required
                  />
                </div>
              )}
              {user.userType === 'company' && (
                <div className="form-group">
                  <label><i className="fas fa-file-alt"></i> {t('licenseNumber')}</label>
                  <input
                    type="text"
                    value={newLoan.licenseNumber}
                    onChange={(e) => setNewLoan({ ...newLoan, licenseNumber: e.target.value })}
                    required
                  />
                </div>
              )}
              <button type="submit" className="action-button approve">
                <i className="fas fa-paper-plane"></i> {t('apply')}
              </button>
            </form>
          </div>
        </div>

        <div className={`section ${activeSection === 'repay-loan' ? 'active' : ''}`}>
          <h3><i className="fas fa-money-bill-wave"></i> {t('repayLoan')}</h3>
          <div className="card">
            <form onSubmit={handleRepayment}>
              <div className="form-group">
                <label><i className="fas fa-file-alt"></i> {t('loanId')}</label>
                <select
                  value={repayment.loanId}
                  onChange={(e) => {
                    const loan = loans.find(l => l._id === e.target.value);
                    setRepayment({
                      ...repayment,
                      loanId: e.target.value,
                      lenderId: loan?.lenderId?._id || '',
                    });
                  }}
                  required
                >
                  <option value="">{t('selectLoan')}</option>
                  {loans.filter(loan => calculateOutstandingWithInterest(loan) > 0).map((loan) => (
                    <option key={loan._id} value={loan._id}>
                      {`${loan._id} - ${loan.lenderId?.name || 'Unknown'} - ${formatCurrency(calculateOutstandingWithInterest(loan))}`}
                    </option>
                  ))}
                </select>
              </div>
              {repayment.loanId && (
                <div className="form-group">
                  <label><i className="fas fa-user-tie"></i> {t('lender')}</label>
                  <p>{loans.find(l => l._id === repayment.loanId)?.lenderId?.name || '-'}</p>
                </div>
              )}
              {repayment.loanId && (
                <div className="form-group">
                  <label><i className="fas fa-money-bill-wave"></i> {t('outstandingAmount')}</label>
                  <p>{formatCurrency(calculateOutstandingWithInterest(loans.find(l => l._id === repayment.loanId)))}</p>
                </div>
              )}
              <div className="form-group">
                <label><i className="fas fa-money-bill-wave"></i> {t('amount')}</label>
                <input
                  type="number"
                  value={repayment.amount}
                  onChange={(e) => setRepayment({ ...repayment, amount: e.target.value })}
                  required
                  min="0"
                />
              </div>
              <button type="submit" className="action-button approve">
                <i className="fas fa-check"></i> {t('pay')}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;