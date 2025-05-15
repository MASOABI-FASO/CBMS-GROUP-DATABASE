import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import './App.css';
import SocialIcons from './SocialIcons';

const LenderDashboard = ({ user, onLogout }) => {
  const [localUser, setLocalUser] = useState(user);
  const [loans, setLoans] = useState([]);
  const [loanFilter, setLoanFilter] = useState('all');
  const [creditCheckEmail, setCreditCheckEmail] = useState('');
  const [creditHistory, setCreditHistory] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState({
    loans: false,
    creditHistory: false,
    user: false,
  });
  const [viewMode, setViewMode] = useState('default'); // 'default' or 'vibrant'
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' or 'list'
  const [language, setLanguage] = useState('en'); // 'en' for English, 'st' for Sesotho
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      if (!localUser) {
        setLoading((prev) => ({ ...prev, user: true }));
        try {
          const response = await api.get('/users/me');
          if (isMounted) {
            setLocalUser(response.data);
          }
        } catch (err) {
          if (isMounted) {
            setError('Failed to fetch user data');
          }
        } finally {
          if (isMounted) {
            setLoading((prev) => ({ ...prev, user: false }));
          }
        }
      }
    };

    const fetchLoans = async () => {
      setLoading((prev) => ({ ...prev, loans: true }));
      try {
        const response = await api.get('/loans/lender');
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
          setError('Failed to fetch loans');
        }
      } finally {
        if (isMounted) {
          setLoading((prev) => ({ ...prev, loans: false }));
        }
      }
    };

    const fetchData = async () => {
      try {
        await Promise.all([fetchUser(), fetchLoans()]);
      } catch (err) {
        if (isMounted) {
          setError('Failed to load dashboard data');
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [localUser]);

  const handleLoanStatus = async (loanId, status) => {
    setLoading((prev) => ({ ...prev, loans: true }));
    try {
      await api.put('/loans/status', { loanId, status });
      const response = await api.get('/loans/lender');
      setLoans(Array.isArray(response.data) ? response.data : []);
      alert('Loan status updated');
    } catch (err) {
      console.error('Error updating loan status:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      alert(err.response?.data?.error || 'Failed to update loan status');
    } finally {
      setLoading((prev) => ({ ...prev, loans: false }));
    }
  };

  const handleCheckCredit = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, creditHistory: true }));
    try {
      const response = await api.get('/users/credit-history', {
        params: { email: creditCheckEmail },
      });
      setCreditHistory(response.data || null);
    } catch (err) {
      console.error('Error fetching credit history:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      alert(err.response?.data?.error || 'Failed to fetch credit history');
    } finally {
      setLoading((prev) => ({ ...prev, creditHistory: false }));
    }
  };

  const filteredLoans = loanFilter === 'all' ? loans : loans.filter((loan) => loan.status === loanFilter);

  const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) {
      return 'M 0.00';
    }
    return `M ${amount.toLocaleString('en-LS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateOutstandingWithInterest = (loan) => {
    if (!loan || loan.status === 'completed') return 0;
    const interest = loan.amount * (loan.interestRate / 100) * (3 / 12); // 3-month term
    return Math.max(0, (loan.amount + interest) - (loan.repaymentAmount || 0));
  };

  const translations = {
    en: {
      dashboard: 'Dashboard',
      creditCheck: 'Credit Check',
      toggleSettings: 'Change Mode',
      logout: 'Logout',
      welcome: 'Welcome',
      totalLoans: 'Total Loans',
      activeLoans: 'Active Loans',
      totalLent: 'Total Lent',
      totalOutstanding: 'Total Outstanding',
      outstandingLoans: 'Outstanding Loans',
      filterByStatus: 'Filter by Status',
      all: 'All',
      pending: 'Pending',
      approved: 'Approved',
      active: 'Active',
      completed: 'Completed',
      defaulted: 'Defaulted',
      loanId: 'Loan ID',
      customer: 'Customer',
      amount: 'Amount',
      interestRate: 'Interest Rate',
      outstanding: 'Outstanding',
      status: 'Status',
      actions: 'Actions',
      approve: 'Approve',
      reject: 'Reject',
      markDefaulted: 'Mark Defaulted',
      customerEmail: 'Customer Email',
      checkCredit: 'Check Credit',
      checking: 'Checking...',
      creditHistoryFor: 'Credit History for',
      creditScore: 'Credit Score',
      netWorth: 'Net Worth',
      idNumber: 'ID Number',
      licenseNumber: 'License Number',
      loanDetails: 'Loan Details',
      repayment: 'Repayment',
      creditScoreTrends: 'Credit Score Trends for',
      noCreditHistory: 'No credit history data available.',
      noActiveLoans: 'No active loan data available',
      error: 'Error',
      retry: 'Retry',
      language: 'Language',
    },
    st: {
      dashboard: 'Letlapa la Tsamaiso',
      creditCheck: 'Tlhatlhobo ea Mokitlane',
      toggleSettings: 'Fetola Litlhophiso',
      logout: 'Tsoa',
      welcome: 'Amoheloa',
      totalLoans: 'Kakaretso ea Likalimo',
      activeLoans: 'Likalimo tse Sebetsang',
      totalLent: 'Kakaretso e Alimiloeng',
      totalOutstanding: 'Kakaretso e Salang',
      outstandingLoans: 'Likalimo tse Salang',
      filterByStatus: 'Sefa ka Boemo',
      all: 'Tsohle',
      pending: 'E emetse',
      approved: 'E amohetsoe',
      active: 'E sebetsa',
      completed: 'E phethiloe',
      defaulted: 'E hlolehiloe',
      loanId: 'ID ea Kalimo',
      customer: 'Moreki',
      amount: 'Chelete',
      interestRate: 'Sekhahla sa Tsoala',
      outstanding: 'E Salang',
      status: 'Boemo',
      actions: 'Liketso',
      approve: 'Amohela',
      reject: 'Hana',
      markDefaulted: 'Tšoaea e Hlolehiloe',
      customerEmail: 'Imeile ea Moreki',
      checkCredit: 'Hlahloba Mokitlane',
      checking: 'E a Hlahloba...',
      creditHistoryFor: 'Nalane ea Mokitlane bakeng sa',
      creditScore: 'Lintlha tsa Mokitlane',
      netWorth: 'Boleng ba Letlooa',
      idNumber: 'Nomoro ea Boitsebiso',
      licenseNumber: 'Nomoro ea Laesense',
      loanDetails: 'Lintlha tsa Kalimo',
      repayment: 'Pusetso',
      creditScoreTrends: 'Mekhoa ea Lintlha tsa Mokitlane bakeng sa',
      noCreditHistory: 'Ha ho nalane ea mokitlane e fumanehang.',
      noActiveLoans: 'Ha ho lintlha tsa kalimo e sebetsang tse fumanehang',
      error: 'Phoso',
      retry: 'Leka hape',
      language: 'Puo',
    },
  };

  const t = (key) => translations[language][key] || key;

  const renderCreditBars = () => {
    const activeLoans = loans.filter(loan => loan.status === 'active' && loan.lenderId?._id === localUser?._id);
    if (!activeLoans.length) return <p>{t('noActiveLoans')}</p>;

    const maxOutstanding = Math.max(...activeLoans.map(loan => calculateOutstandingWithInterest(loan)), 1);
    return (
      <div style={{
        display: 'flex',
        gap: '10px',
        padding: viewMode === 'default' ? '10px' : '10px',
        backgroundColor: viewMode === 'default' ? '#e0e0e0' : '#ffe4b5',
        border: viewMode === 'default' ? '2px solid #ccc' : '2px solid #ffcc80',
        borderRadius: viewMode === 'default' ? '5px' : '8px',
      }}>
        {activeLoans.map((loan, index) => (
          <div
            key={index}
            style={{
              height: `${(calculateOutstandingWithInterest(loan) / maxOutstanding) * 180}px`,
              width: '40px',
              background: viewMode === 'default' ? '#3498db' : 'linear-gradient(45deg, #ff9800, #ff5722)',
              borderRadius: viewMode === 'default' ? '3px' : '5px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              color: viewMode === 'default' ? '#fff' : '#333',
              fontWeight: viewMode === 'default' ? 'normal' : '600',
              paddingBottom: '5px',
              fontSize: viewMode === 'default' ? '12px' : '14px',
            }}
            title={`Loan ${loan._id}: ${formatCurrency(calculateOutstandingWithInterest(loan))}`}
          >
            {formatCurrency(calculateOutstandingWithInterest(loan))}
          </div>
        ))}
      </div>
    );
  };

  const renderCreditTrendsVisualization = () => {
    if (!creditHistory || !creditHistory.creditHistory || creditHistory.creditHistory.length === 0) {
      return <p style={{
        color: viewMode === 'default' ? '#e74c3c' : '#d32f2f',
        padding: '10px',
        backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#ffe4b5',
        border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
        borderRadius: viewMode === 'default' ? '5px' : '8px',
        fontWeight: viewMode === 'default' ? 'normal' : '600',
        fontSize: viewMode === 'default' ? '14px' : '16px',
      }}>{t('noCreditHistory')}</p>;
    }
    const maxScore = Math.max(...creditHistory.creditHistory.map((t) => t.creditScore || 0), 850);
    const dataPoints = creditHistory.creditHistory.map((trend, index) => {
      const x = (index / (creditHistory.creditHistory.length - 1)) * 280;
      const y = 100 - ((trend.creditScore || 0) / maxScore) * 80;
      return `${x},${y}`;
    }).join(' ');

    const labels = creditHistory.creditHistory.map((trend, index) => {
      const x = (index / (creditHistory.creditHistory.length - 1)) * 280;
      return (
        <text key={index} x={x} y="120" fill={viewMode === 'default' ? '#2c3e50' : '#333'} fontSize={viewMode === 'default' ? '10' : '12'} textAnchor="middle" style={{ fontWeight: viewMode === 'default' ? 'normal' : '600' }}>
          {new Date(trend.date).toLocaleDateString(language === 'en' ? 'en-US' : 'st-ZA', { day: 'numeric', month: 'short' })}
        </text>
      );
    });

    const gridLines = Array.from({ length: 5 }, (_, i) => {
      const y = 20 + (i * 20);
      return <line key={i} x1="0" y1={y} x2="280" y2={y} stroke={viewMode === 'default' ? '#bdc3c7' : '#ffcc80'} strokeWidth="0.5" />;
    });

    return (
      <div style={{
        padding: '10px',
        backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#ffe4b5',
        border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
        borderRadius: viewMode === 'default' ? '5px' : '8px',
      }}>
        <h4 style={{
          color: viewMode === 'default' ? '#2c3e50' : '#333',
          fontWeight: viewMode === 'default' ? 'normal' : '600',
          marginBottom: '10px',
          fontSize: viewMode === 'default' ? '16px' : '18px',
          fontStyle: viewMode === 'default' ? 'normal' : 'italic',
        }}><i className="fas fa-credit-card"></i> {t('creditScoreTrends')} {creditHistory.email || 'Unknown'}</h4>
        <svg width="300" height="150" viewBox="0 0 300 150" style={{ backgroundColor: viewMode === 'default' ? '#fff' : '#fff9e6' }}>
          {gridLines}
          <line x1="0" y1="100" x2="280" y2="100" stroke={viewMode === 'default' ? '#bdc3c7' : '#ffcc80'} strokeWidth="1" />
          <text x="5" y="10" fill={viewMode === 'default' ? '#2c3e50' : '#333'} fontSize={viewMode === 'default' ? '10' : '12'} style={{ fontWeight: viewMode === 'default' ? 'normal' : '600' }}>{t('creditScore')}</text>
          <text x="140" y="130" fill={viewMode === 'default' ? '#2c3e50' : '#333'} fontSize={viewMode === 'default' ? '10' : '12'} textAnchor="middle" style={{ fontWeight: viewMode === 'default' ? 'normal' : '600' }}>Date</text>
          <polyline
            points={dataPoints}
            fill="none"
            stroke={viewMode === 'default' ? '#1abc9c' : '#ff5722'}
            strokeWidth={viewMode === 'default' ? '2' : '3'}
          />
          {creditHistory.creditHistory.map((trend, index) => {
            const x = (index / (creditHistory.creditHistory.length - 1)) * 280;
            const y = 100 - ((trend.creditScore || 0) / maxScore) * 80;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={viewMode === 'default' ? '3' : '4'}
                fill={viewMode === 'default' ? '#1abc9c' : '#ff5722'}
              >
                <title>{`Date: ${new Date(trend.date).toLocaleDateString(language === 'en' ? 'en-US' : 'st-ZA')}, Score: ${trend.creditScore}`}</title>
              </circle>
            );
          })}
          {labels}
          {Array.from({ length: 5 }, (_, i) => {
            const yValue = Math.round((maxScore * i) / 4);
            return <text key={i} x="285" y={100 - (i * 20)} fill={viewMode === 'default' ? '#2c3e50' : '#333'} fontSize={viewMode === 'default' ? '10' : '12'} textAnchor="end" style={{ fontWeight: viewMode === 'default' ? 'normal' : '600' }}>{yValue}</text>;
          })}
        </svg>
      </div>
    );
  };

  const handleLogout = () => {
    onLogout();
    navigate('/landing');
  };

  if (error) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#fff9e6',
        color: viewMode === 'default' ? '#2c3e50' : '#333',
        fontWeight: viewMode === 'default' ? 'normal' : '600',
      }}>
        <aside style={{
          width: '250px',
          backgroundColor: viewMode === 'default' ? '#34495e' : '#ffeb99',
          color: viewMode === 'default' ? '#fff' : '#333',
          boxShadow: '2px 0 5px rgba(0, 0, 0, 0.2)',
          padding: '20px',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100px', marginBottom: '10px' }} />
            <h1 style={{ fontSize: viewMode === 'default' ? '1.5rem' : '1.7rem', margin: '0', fontWeight: viewMode === 'default' ? 'normal' : '600' }}>Lender Panel</h1>
          </div>
          <nav>
            <ul style={{ listStyle: 'none', padding: '0' }}>
              <li>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: viewMode === 'default' ? '#3498db' : '#ffe066',
                    color: viewMode === 'default' ? '#fff' : '#333',
                    border: 'none',
                    padding: '10px',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    borderRadius: '5px',
                  }}
                >
                  <option value="en">English</option>
                  <option value="st">Sesotho</option>
                </select>
              </li>
              <li>
                <button onClick={handleLogout} style={{
                  width: '100%',
                  backgroundColor: viewMode === 'default' ? '#e74c3c' : '#ff9999',
                  color: viewMode === 'default' ? '#fff' : '#333',
                  border: 'none',
                  padding: '10px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  borderRadius: '5px',
                  ...(viewMode === 'default' && { ':hover': { backgroundColor: '#c0392b' } }),
                  ...(viewMode === 'vibrant' && { ':hover': { backgroundColor: '#ff6666' } }),
                }}>
                  <i className="fas fa-sign-out-alt"></i> {t('logout')}
                </button>
              </li>
            </ul>
          </nav>
          <SocialIcons role="lender" style={{ position: 'absolute', bottom: '20px', left: '20px' }} />
        </aside>
        <main style={{
          flex: '1',
          padding: '20px',
          backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#fff9e6',
        }}>
          <h2 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', marginBottom: '10px' }}><i className="fas fa-exclamation-circle"></i> {t('error')}</h2>
          <p style={{ color: viewMode === 'default' ? '#e74c3c' : '#d32f2f', marginBottom: '10px' }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{
            backgroundColor: viewMode === 'default' ? '#2ecc71' : '#ff9800',
            border: viewMode === 'default' ? '2px solid #27ae60' : '2px solid #f57c00',
            color: viewMode === 'default' ? '#fff' : '#333',
            padding: '10px 20px',
            cursor: 'pointer',
            borderRadius: '5px',
            ...(viewMode === 'default' && { ':hover': { backgroundColor: '#27ae60' } }),
            ...(viewMode === 'vibrant' && { ':hover': { backgroundColor: '#f57c00' } }),
          }}>
            <i className="fas fa-redo"></i> {t('retry')}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#fff9e6',
      color: viewMode === 'default' ? '#2c3e50' : '#333',
      fontWeight: viewMode === 'default' ? 'normal' : '600',
    }}>
      <aside style={{
        width: '250px',
        backgroundColor: viewMode === 'default' ? '#34495e' : '#ffeb99',
        color: viewMode === 'default' ? '#fff' : '#333',
        boxShadow: '2px 0 5px rgba(0, 0, 0, 0.2)',
        padding: '20px',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '100px', marginBottom: '10px' }} />
          <h1 style={{ fontSize: viewMode === 'default' ? '1.5rem' : '1.7rem', margin: '0', fontWeight: viewMode === 'default' ? 'normal' : '600' }}>Lender Panel</h1>
        </div>
        <nav>
          <ul style={{ listStyle: 'none', padding: '0' }}>
            <li>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: viewMode === 'default' ? '#3498db' : '#ffe066',
                  color: viewMode === 'default' ? '#fff' : '#333',
                  border: 'none',
                  padding: '10px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  borderRadius: '5px',
                }}
              >
                <option value="en">English</option>
                <option value="st">Sesotho</option>
              </select>
            </li>
            <li>
              <button
                style={{
                  width: '100%',
                  backgroundColor: viewMode === 'default' ? '#3498db' : '#ffe066',
                  color: viewMode === 'default' ? '#fff' : '#333',
                  border: 'none',
                  padding: '10px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  borderRadius: '5px',
                  ...(activeSection === 'dashboard' && { backgroundColor: viewMode === 'default' ? '#2980b9' : '#ffd700' }),
                  ...(viewMode === 'default' && { ':hover': { backgroundColor: '#2980b9' } }),
                  ...(viewMode === 'vibrant' && { ':hover': { backgroundColor: '#ffd700' } }),
                }}
                onClick={() => setActiveSection('dashboard')}
              >
                <i className="fas fa-tachometer-alt"></i> {t('dashboard')}
              </button>
            </li>
            <li>
              <button
                style={{
                  width: '100%',
                  backgroundColor: viewMode === 'default' ? '#3498db' : '#ffe066',
                  color: viewMode === 'default' ? '#fff' : '#333',
                  border: 'none',
                  padding: '10px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  borderRadius: '5px',
                  ...(activeSection === 'credit-check' && { backgroundColor: viewMode === 'default' ? '#2980b9' : '#ffd700' }),
                  ...(viewMode === 'default' && { ':hover': { backgroundColor: '#2980b9' } }),
                  ...(viewMode === 'vibrant' && { ':hover': { backgroundColor: '#ffd700' } }),
                }}
                onClick={() => setActiveSection('credit-check')}
              >
                <i className="fas fa-search"></i> {t('creditCheck')}
              </button>
            </li>
            <li>
              <button
                style={{
                  width: '100%',
                  backgroundColor: viewMode === 'default' ? '#3498db' : '#ffe066',
                  color: viewMode === 'default' ? '#fff' : '#333',
                  border: 'none',
                  padding: '10px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  borderRadius: '5px',
                  ...(viewMode === 'default' && { ':hover': { backgroundColor: '#2980b9' } }),
                  ...(viewMode === 'vibrant' && { ':hover': { backgroundColor: '#ffd700' } }),
                }}
                onClick={() => setViewMode(viewMode === 'default' ? 'vibrant' : 'default')}
              >
                <i className="fas fa-cog"></i> {t('toggleSettings')}
              </button>
            </li>
          </ul>
        </nav>
        <div style={{ position: 'absolute', bottom: '20px', left: '20px' }}>
          <button onClick={handleLogout} style={{
            backgroundColor: viewMode === 'default' ? '#e74c3c' : '#ff9999',
            color: viewMode === 'default' ? '#fff' : '#333',
            border: 'none',
            padding: '10px',
            cursor: 'pointer',
            borderRadius: '5px',
            marginBottom: '10px',
            width: '100%',
            ...(viewMode === 'default' && { ':hover': { backgroundColor: '#c0392b' } }),
            ...(viewMode === 'vibrant' && { ':hover': { backgroundColor: '#ff6666' } }),
          }}>
            <i className="fas fa-sign-out-alt"></i> {t('logout')}
          </button>
          <SocialIcons role="customer" />
        </div>
      </aside>
      <main style={{
        flex: '1',
        padding: '20px',
        backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#fff9e6',
      }}>
        <h2 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', marginBottom: '10px', fontSize: viewMode === 'default' ? '1.5rem' : '1.7rem' }}>
          <i className="fas fa-user"></i> {t('welcome')}, {localUser?.name || 'Lender'}
        </h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '10px' }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: viewMode === 'default' ? '#2c3e50' : '#333',
              ...(layoutMode === 'grid' && { color: viewMode === 'default' ? '#1abc9c' : '#ff5722' }),
              ...(viewMode === 'default' && { ':hover': { color: '#1abc9c' } }),
              ...(viewMode === 'vibrant' && { ':hover': { color: '#ff9800' } }),
            }}
            onClick={() => setLayoutMode('grid')}
          >
            <i className="fas fa-th"></i>
          </button>
          <button
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: viewMode === 'default' ? '#2c3e50' : '#333',
              ...(layoutMode === 'list' && { color: viewMode === 'default' ? '#1abc9c' : '#ff5722' }),
              ...(viewMode === 'default' && { ':hover': { color: '#1abc9c' } }),
              ...(viewMode === 'vibrant' && { ':hover': { color: '#ff9800' } }),
            }}
            onClick={() => setLayoutMode('list')}
          >
            <i className="fas fa-list"></i>
          </button>
        </div>

        <div style={{ display: activeSection === 'dashboard' ? 'block' : 'none' }}>
          <h3 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', marginBottom: '10px', fontSize: viewMode === 'default' ? '1.2rem' : '1.4rem' }}>
            <i className="fas fa-tachometer-alt"></i> {t('dashboard')}
          </h3>
          {loading.loans && <p style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', marginBottom: '10px' }}><i className="fas fa-spinner fa-spin"></i> {t('loadingLoans')}</p>}
          <div style={{ display: layoutMode === 'grid' ? 'flex' : 'none', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{
              backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#ffe4b5',
              color: viewMode === 'default' ? '#2c3e50' : '#333',
              border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
              borderRadius: viewMode === 'default' ? '5px' : '8px',
              padding: '10px',
              width: '200px',
              textAlign: 'center',
            }}>
              <h3 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', marginBottom: '5px', fontSize: viewMode === 'default' ? '1rem' : '1.2rem' }}>
                <i className="fas fa-file-alt"></i> {t('totalLoans')}
              </h3>
              <p style={{ color: viewMode === 'default' ? '#1abc9c' : '#ff5722', fontSize: viewMode === 'default' ? '1.1rem' : '1.2rem', margin: '0' }}>{loans.length}</p>
            </div>
            <div style={{
              backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#ffe4b5',
              color: viewMode === 'default' ? '#2c3e50' : '#333',
              border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
              borderRadius: viewMode === 'default' ? '5px' : '8px',
              padding: '10px',
              width: '200px',
              textAlign: 'center',
            }}>
              <h3 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', marginBottom: '5px', fontSize: viewMode === 'default' ? '1rem' : '1.2rem' }}>
                <i className="fas fa-tasks"></i> {t('activeLoans')}
              </h3>
              <p style={{ color: viewMode === 'default' ? '#1abc9c' : '#ff5722', fontSize: viewMode === 'default' ? '1.1rem' : '1.2rem', margin: '0' }}>{loans.filter((loan) => loan.status === 'active').length}</p>
            </div>
            <div style={{
              backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#ffe4b5',
              color: viewMode === 'default' ? '#2c3e50' : '#333',
              border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
              borderRadius: viewMode === 'default' ? '5px' : '8px',
              padding: '10px',
              width: '200px',
              textAlign: 'center',
            }}>
              <h3 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', marginBottom: '5px', fontSize: viewMode === 'default' ? '1rem' : '1.2rem' }}>
                <i className="fas fa-hand-holding-usd"></i> {t('totalLent')}
              </h3>
              <p style={{ color: viewMode === 'default' ? '#1abc9c' : '#ff5722', fontSize: viewMode === 'default' ? '1.1rem' : '1.2rem', margin: '0' }}>
                {formatCurrency(loans.reduce((sum, loan) => sum + (loan.amount || 0), 0))}
              </p>
            </div>
            <div style={{
              backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#ffe4b5',
              color: viewMode === 'default' ? '#2c3e50' : '#333',
              border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
              borderRadius: viewMode === 'default' ? '5px' : '8px',
              padding: '10px',
              width: '200px',
              textAlign: 'center',
            }}>
              <h3 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', marginBottom: '5px', fontSize: viewMode === 'default' ? '1rem' : '1.2rem' }}>
                <i className="fas fa-money-bill-wave"></i> {t('totalOutstanding')}
              </h3>
              <p style={{ color: viewMode === 'default' ? '#1abc9c' : '#ff5722', fontSize: viewMode === 'default' ? '1.1rem' : '1.2rem', margin: '0' }}>
                {formatCurrency(
                  loans
                    .filter((loan) => loan.status !== 'completed')
                    .reduce((sum, loan) => sum + Math.max(0, loan.outstandingWithInterest || 0), 0)
                )}
              </p>
            </div>
            <div style={{
              backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#ffe4b5',
              color: viewMode === 'default' ? '#2c3e50' : '#333',
              border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
              borderRadius: viewMode === 'default' ? '5px' : '8px',
              padding: '10px',
              width: '100%',
              maxWidth: '450px',
              textAlign: 'center',
            }}>
              <h3 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', marginBottom: '5px', fontSize: viewMode === 'default' ? '1rem' : '1.2rem' }}>
                <i className="fas fa-chart-bar"></i> {t('outstandingLoans')}
              </h3>
              {renderCreditBars()}
            </div>
          </div>
          <div style={{ display: layoutMode === 'list' ? 'block' : 'none', width: '100%' }}>
            <div style={{
              backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#ffe4b5',
              color: viewMode === 'default' ? '#2c3e50' : '#333',
              border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
              borderRadius: viewMode === 'default' ? '5px' : '8px',
              padding: '10px',
              marginBottom: '10px',
            }}>
              <h3 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', margin: '0 0 0.5rem 0', fontSize: viewMode === 'default' ? '1rem' : '1.2rem' }}>
                <i className="fas fa-file-alt"></i> {t('totalLoans')}
              </h3>
              <p style={{ color: viewMode === 'default' ? '#1abc9c' : '#ff5722', fontSize: viewMode === 'default' ? '1.1rem' : '1.2rem', margin: '0 0 0.5rem 0' }}>{loans.length}</p>
            </div>
            <div style={{
              backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#ffe4b5',
              color: viewMode === 'default' ? '#2c3e50' : '#333',
              border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
              borderRadius: viewMode === 'default' ? '5px' : '8px',
              padding: '10px',
              marginBottom: '10px',
            }}>
              <h3 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', margin: '0 0 0.5rem 0', fontSize: viewMode === 'default' ? '1rem' : '1.2rem' }}>
                <i className="fas fa-tasks"></i> {t('activeLoans')}
              </h3>
              <p style={{ color: viewMode === 'default' ? '#1abc9c' : '#ff5722', fontSize: viewMode === 'default' ? '1.1rem' : '1.2rem', margin: '0 0 0.5rem 0' }}>{loans.filter((loan) => loan.status === 'active').length}</p>
            </div>
            <div style={{
              backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#ffe4b5',
              color: viewMode === 'default' ? '#2c3e50' : '#333',
              border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
              borderRadius: viewMode === 'default' ? '5px' : '8px',
              padding: '10px',
              marginBottom: '10px',
            }}>
              <h3 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', margin: '0 0 0.5rem 0', fontSize: viewMode === 'default' ? '1rem' : '1.2rem' }}>
                <i className="fas fa-hand-holding-usd"></i> {t('totalLent')}
              </h3>
              <p style={{ color: viewMode === 'default' ? '#1abc9c' : '#ff5722', fontSize: viewMode === 'default' ? '1.1rem' : '1.2rem', margin: '0 0 0.5rem 0' }}>
                {formatCurrency(loans.reduce((sum, loan) => sum + (loan.amount || 0), 0))}
              </p>
            </div>
            <div style={{
              backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#ffe4b5',
              color: viewMode === 'default' ? '#2c3e50' : '#333',
              border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
              borderRadius: viewMode === 'default' ? '5px' : '8px',
              padding: '10px',
              marginBottom: '10px',
            }}>
              <h3 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', margin: '0 0 0.5rem 0', fontSize: viewMode === 'default' ? '1rem' : '1.2rem' }}>
                <i className="fas fa-money-bill-wave"></i> {t('totalOutstanding')}
              </h3>
              <p style={{ color: viewMode === 'default' ? '#1abc9c' : '#ff5722', fontSize: viewMode === 'default' ? '1.1rem' : '1.2rem', margin: '0 0 0.5rem 0' }}>
                {formatCurrency(
                  loans
                    .filter((loan) => loan.status !== 'completed')
                    .reduce((sum, loan) => sum + Math.max(0, loan.outstandingWithInterest || 0), 0)
                )}
              </p>
            </div>
            <div style={{
              backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#ffe4b5',
              color: viewMode === 'default' ? '#2c3e50' : '#333',
              border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
              borderRadius: viewMode === 'default' ? '5px' : '8px',
              padding: '10px',
              marginBottom: '10px',
            }}>
              <h3 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', margin: '0 0 0.5rem 0', fontSize: viewMode === 'default' ? '1rem' : '1.2rem' }}>
                <i className="fas fa-chart-bar"></i> {t('outstandingLoans')}
              </h3>
              {renderCreditBars()}
            </div>
          </div>
          <div style={{ margin: '10px 0', display: 'flex', alignItems: 'center' }}>
            <label style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', marginRight: '10px' }}><i className="fas fa-filter"></i> {t('filterByStatus')}:</label>
            <select
              value={loanFilter}
              onChange={(e) => setLoanFilter(e.target.value)}
              style={{
                padding: '5px',
                borderRadius: viewMode === 'default' ? '3px' : '5px',
                border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
                backgroundColor: viewMode === 'default' ? '#fff' : '#ffe4b5',
                color: viewMode === 'default' ? '#2c3e50' : '#333',
                fontWeight: viewMode === 'default' ? 'normal' : '600',
              }}
            >
              <option value="all">{t('all')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="approved">{t('approved')}</option>
              <option value="active">{t('active')}</option>
              <option value="completed">{t('completed')}</option>
              <option value="defaulted">{t('defaulted')}</option>
            </select>
          </div>
          <div style={{ marginTop: '10px', overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#ffe4b5',
              border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
              borderRadius: viewMode === 'default' ? '5px' : '8px',
            }}>
              <thead>
                <tr style={{ backgroundColor: viewMode === 'default' ? '#34495e' : '#ffeb99', color: viewMode === 'default' ? '#fff' : '#333' }}>
                  <th style={{ padding: '10px', borderBottom: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80' }}>{t('loanId')}</th>
                  <th style={{ padding: '10px', borderBottom: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80' }}>{t('customer')}</th>
                  <th style={{ padding: '10px', borderBottom: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80' }}>{t('amount')}</th>
                  <th style={{ padding: '10px', borderBottom: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80' }}>{t('interestRate')}</th>
                  <th style={{ padding: '10px', borderBottom: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80' }}>{t('outstanding')}</th>
                  <th style={{ padding: '10px', borderBottom: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80' }}>{t('status')}</th>
                  <th style={{ padding: '10px', borderBottom: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan) => (
                  <tr key={loan._id} style={{ borderBottom: viewMode === 'default' ? '1px solid #bdc3c7' : '1px solid #ffcc80' }}>
                    <td style={{ padding: '10px', textAlign: 'left', color: viewMode === 'default' ? '#2c3e50' : '#333' }}>{loan._id}</td>
                    <td style={{ padding: '10px', textAlign: 'left', color: viewMode === 'default' ? '#2c3e50' : '#333' }}>{loan.customerId?.name || '-'}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: viewMode === 'default' ? '#2c3e50' : '#333' }}>{formatCurrency(loan.amount || 0)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: viewMode === 'default' ? '#2c3e50' : '#333' }}>{loan.interestRate != null ? `${loan.interestRate.toFixed(2)}%` : 'N/A'}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: viewMode === 'default' ? '#2c3e50' : '#333' }}>{formatCurrency(Math.max(0, loan.outstandingWithInterest || 0))}</td>
                    <td style={{ padding: '10px', textAlign: 'left', color: viewMode === 'default' ? '#2c3e50' : '#333' }}>{loan.status || 'N/A'}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      {loan.status === 'pending' && (
                        <>
                          <button
                            style={{
                              backgroundColor: viewMode === 'default' ? '#2ecc71' : '#ff9800',
                              border: viewMode === 'default' ? '2px solid #27ae60' : '2px solid #f57c00',
                              color: viewMode === 'default' ? '#fff' : '#333',
                              padding: '5px 10px',
                              marginRight: '5px',
                              cursor: 'pointer',
                              borderRadius: viewMode === 'default' ? '3px' : '5px',
                              ...(viewMode === 'default' && { ':hover': { backgroundColor: '#27ae60' } }),
                              ...(viewMode === 'vibrant' && { ':hover': { backgroundColor: '#f57c00' } }),
                            }}
                            onClick={() => handleLoanStatus(loan._id, 'approved')}
                          >
                            <i className="fas fa-check"></i> {t('approve')}
                          </button>
                          <button
                            style={{
                              backgroundColor: viewMode === 'default' ? '#e74c3c' : '#d32f2f',
                              border: viewMode === 'default' ? '2px solid #c0392b' : '2px solid #b71c1c',
                              color: viewMode === 'default' ? '#fff' : '#333',
                              padding: '5px 10px',
                              cursor: 'pointer',
                              borderRadius: viewMode === 'default' ? '3px' : '5px',
                              ...(viewMode === 'default' && { ':hover': { backgroundColor: '#c0392b' } }),
                              ...(viewMode === 'vibrant' && { ':hover': { backgroundColor: '#b71c1c' } }),
                            }}
                            onClick={() => handleLoanStatus(loan._id, 'rejected')}
                          >
                            <i className="fas fa-times"></i> {t('reject')}
                          </button>
                        </>
                      )}
                      {loan.status === 'active' && (
                        <button
                          style={{
                            backgroundColor: viewMode === 'default' ? '#e74c3c' : '#d32f2f',
                            border: viewMode === 'default' ? '2px solid #c0392b' : '2px solid #b71c1c',
                            color: viewMode === 'default' ? '#fff' : '#333',
                            padding: '5px 10px',
                            cursor: 'pointer',
                            borderRadius: viewMode === 'default' ? '3px' : '5px',
                            ...(viewMode === 'default' && { ':hover': { backgroundColor: '#c0392b' } }),
                            ...(viewMode === 'vibrant' && { ':hover': { backgroundColor: '#b71c1c' } }),
                          }}
                          onClick={() => handleLoanStatus(loan._id, 'defaulted')}
                        >
                          <i className="fas fa-exclamation-triangle"></i> {t('markDefaulted')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: activeSection === 'credit-check' ? 'block' : 'none' }}>
          <h3 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', marginBottom: '10px', fontSize: viewMode === 'default' ? '1.2rem' : '1.4rem' }}>
            <i className="fas fa-search"></i> {t('creditCheck')}
          </h3>
          <div style={{
            backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#ffe4b5',
            border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
            borderRadius: viewMode === 'default' ? '5px' : '8px',
            padding: '10px',
          }}>
            <form onSubmit={handleCheckCredit} style={{ marginBottom: '10px' }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', marginRight: '10px' }}><i className="fas fa-envelope"></i> {t('customerEmail')}</label>
                <input
                  type="email"
                  value={creditCheckEmail}
                  onChange={(e) => setCreditCheckEmail(e.target.value)}
                  required
                  style={{
                    padding: '5px',
                    borderRadius: viewMode === 'default' ? '3px' : '5px',
                    border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
                    backgroundColor: viewMode === 'default' ? '#fff' : '#ffe4b5',
                    color: viewMode === 'default' ? '#2c3e50' : '#333',
                    fontWeight: viewMode === 'default' ? 'normal' : '600',
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  backgroundColor: viewMode === 'default' ? '#2ecc71' : '#ff9800',
                  border: viewMode === 'default' ? '2px solid #27ae60' : '2px solid #f57c00',
                  color: viewMode === 'default' ? '#fff' : '#333',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  borderRadius: viewMode === 'default' ? '3px' : '5px',
                  ...(loading.creditHistory && { opacity: '0.7', cursor: 'not-allowed' }),
                  ...(viewMode === 'default' && { ':hover': { backgroundColor: '#27ae60' } }),
                  ...(viewMode === 'vibrant' && { ':hover': { backgroundColor: '#f57c00' } }),
                }}
                disabled={loading.creditHistory}
              >
                {loading.creditHistory ? <><i className="fas fa-spinner fa-spin"></i> {t('checking')}</> : <><i className="fas fa-search"></i> {t('checkCredit')}</>}
              </button>
            </form>
            {creditHistory && (
              <div style={{ marginTop: '10px' }}>
                <h4 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', marginBottom: '5px', fontSize: viewMode === 'default' ? '1rem' : '1.2rem' }}>
                  <i className="fas fa-credit-card"></i> {t('creditHistoryFor')} {creditHistory.email || 'Unknown'}
                </h4>
                <p style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', margin: '5px 0' }}>{t('creditScore')}: {creditHistory.creditScore || 300}</p>
                <p style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', margin: '5px 0' }}>{t('netWorth')}: {formatCurrency(creditHistory.netWorth || 0)}</p>
                <p style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', margin: '5px 0' }}>{t('idNumber')}: {creditHistory.idNumber || '-'}</p>
                <p style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', margin: '5px 0' }}>{t('licenseNumber')}: {creditHistory.licenseNumber || '-'}</p>
                {creditHistory.loans && creditHistory.loans.length > 0 && (
                  <>
                    <h5 style={{ color: viewMode === 'default' ? '#2c3e50' : '#333', fontWeight: viewMode === 'default' ? 'normal' : '600', margin: '10px 0 5px 0', fontSize: viewMode === 'default' ? '0.9rem' : '1.1rem' }}>
                      <i className="fas fa-hand-holding-usd"></i> {t('loanDetails')}
                    </h5>
                    <div style={{ overflowX: 'auto', marginTop: '5px' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        backgroundColor: viewMode === 'default' ? '#ecf0f1' : '#ffe4b5',
                        border: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80',
                        borderRadius: viewMode === 'default' ? '5px' : '8px',
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: viewMode === 'default' ? '#34495e' : '#ffeb99', color: viewMode === 'default' ? '#fff' : '#333' }}>
                            <th style={{ padding: '10px', borderBottom: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80' }}>{t('loanId')}</th>
                            <th style={{ padding: '10px', borderBottom: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solidly #ffcc80' }}>{t('amount')}</th>
                            <th style={{ padding: '10px', borderBottom: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80' }}>{t('repayment')}</th>
                            <th style={{ padding: '10px', borderBottom: viewMode === 'default' ? '2px solid #bdc3c7' : '2px solid #ffcc80' }}>{t('status')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditHistory.loans.map((loan) => (
                            <tr key={loan._id} style={{ borderBottom: viewMode === 'default' ? '1px solid #bdc3c7' : '1px solid #ffcc80' }}>
                              <td style={{ padding: '10px', textAlign: 'left', color: viewMode === 'default' ? '#2c3e50' : '#333' }}>{loan._id}</td>
                              <td style={{ padding: '10px', textAlign: 'right', color: viewMode === 'default' ? '#2c3e50' : '#333' }}>{formatCurrency(loan.amount || 0)}</td>
                              <td style={{ padding: '10px', textAlign: 'right', color: viewMode === 'default' ? '#2c3e50' : '#333' }}>{formatCurrency(loan.repaymentAmount || 0)}</td>
                              <td style={{ padding: '10px', textAlign: 'left', color: viewMode === 'default' ? '#2c3e50' : '#333' }}>{loan.status || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                {renderCreditTrendsVisualization()}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LenderDashboard;