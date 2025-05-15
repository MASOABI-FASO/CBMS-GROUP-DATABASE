import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import './App.css';
import SocialIcons from './SocialIcons';

const AdminDashboard = ({ user, onLogout }) => {
  const [localUser, setLocalUser] = useState(user);
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [balance, setBalance] = useState(0);
  const [reports, setReports] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', userType: '', netWorth: '', idNumber: '', licenseNumber: '' });
  const [loanFilter, setLoanFilter] = useState('all');
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'customer', userType: 'individual', netWorth: '', idNumber: '', licenseNumber: '' });
  const [balanceAdjustment, setBalanceAdjustment] = useState('');
  const [interestRules, setInterestRules] = useState([]);
  const [newInterestRule, setNewInterestRule] = useState({ minAmount: '', maxAmount: '', rate: '', timeFrame: '' });
  const [profitLoss, setProfitLoss] = useState(null);
  const [detailedReports, setDetailedReports] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [error, setError] = useState(null);
  const [creditCheckEmail, setCreditCheckEmail] = useState('');
  const [creditHistory, setCreditHistory] = useState(null);
  const [viewMode, setViewMode] = useState('default'); // 'default' or 'modern'
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' or 'list'
  const [notifications, setNotifications] = useState([]);
  const [unseenNotifications, setUnseenNotifications] = useState([]); // Added for unseen notifications
  const [highRiskUsers, setHighRiskUsers] = useState([]);
  const [language, setLanguage] = useState('en'); // 'en' for English, 'st' for Sesotho
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      if (!localUser) {
        try {
          const response = await api.get('/users/me');
          if (isMounted) {
            setLocalUser(response.data);
          }
        } catch (err) {
          if (isMounted) {
            setError('Failed to fetch user data');
          }
        }
      }
    };

    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        if (isMounted) {
          const fetchedNotifications = Array.isArray(response.data) ? response.data : [];
          setNotifications(fetchedNotifications);
          setUnseenNotifications(fetchedNotifications);
        }
      } catch (err) {
        console.error('Error fetching notifications:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        if (isMounted) {
          alert('Failed to fetch notifications');
          setNotifications([]);
          setUnseenNotifications([]);
        }
      }
    };

    const fetchHighRiskUsers = async () => {
      try {
        const response = await api.get('/loans');
        if (isMounted) {
          const defaultedLoans = Array.isArray(response.data) ? response.data.filter(loan => loan.status === 'defaulted') : [];
          const highRisk = defaultedLoans.reduce((acc, loan) => {
            const customerId = loan.customerId?._id;
            if (customerId && !acc.find(u => u._id === customerId)) {
              acc.push({
                ...loan.customerId,
                defaultedLoans: defaultedLoans.filter(l => l.customerId?._id === customerId),
              });
            }
            return acc;
          }, []);
          setHighRiskUsers(highRisk);
        }
      } catch (err) {
        console.error('Error fetching high-risk users:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        if (isMounted) {
          alert('Failed to fetch high-risk users');
          setHighRiskUsers([]);
        }
      }
    };

    const fetchData = async () => {
      try {
        await Promise.all([
          fetchLoans(isMounted),
          fetchUsers(isMounted),
          fetchBalance(isMounted),
          fetchReports(isMounted),
          fetchInterestRules(isMounted),
          fetchProfitLoss(isMounted),
          fetchDetailedReports(isMounted),
          fetchUser(),
          fetchNotifications(),
          fetchHighRiskUsers(),
        ]);
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

  useEffect(() => {
    if (activeSection === 'notifications') {
      setUnseenNotifications([]);
    }
  }, [activeSection]);

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
      }
    }
  };

  const fetchUsers = async (isMounted) => {
    try {
      const response = await api.get('/users');
      if (isMounted) {
        if (Array.isArray(response.data)) {
          setUsers(response.data);
        } else {
          console.error('Unexpected users response:', response.data);
          setUsers([]);
          alert('Invalid user data received');
        }
      }
    } catch (err) {
      console.error('Error fetching users:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      if (isMounted) {
        alert('Failed to fetch users');
        setUsers([]);
      }
    }
  };

  const fetchBalance = async (isMounted) => {
    try {
      const response = await api.get('/loans/balance');
      if (isMounted) {
        setBalance(response.data.balance || 0);
      }
    } catch (err) {
      console.error('Error fetching balance:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      if (isMounted) {
        alert('Failed to fetch balance');
      }
    }
  };

  const fetchReports = async (isMounted) => {
    try {
      const response = await api.get('/loans/reports');
      if (isMounted) {
        setReports(response.data || null);
      }
    } catch (err) {
      console.error('Error fetching reports:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      if (isMounted) {
        alert('Failed to fetch reports');
      }
    }
  };

  const fetchInterestRules = async (isMounted) => {
    try {
      const response = await api.get('/loans/interest-rules');
      if (isMounted) {
        setInterestRules(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Error fetching interest rules:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      if (isMounted) {
        alert('Failed to fetch interest rules');
      }
    }
  };

  const fetchProfitLoss = async (isMounted) => {
    try {
      const response = await api.get('/loans/profit-loss');
      if (isMounted) {
        setProfitLoss(response.data || null);
      }
    } catch (err) {
      console.error('Error fetching profit/loss:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      if (isMounted) {
        alert('Failed to fetch profit/loss');
      }
    }
  };

  const fetchDetailedReports = async (isMounted) => {
    try {
      const response = await api.get('/loans/reports/detailed');
      if (isMounted) {
        setDetailedReports(response.data || null);
      }
    } catch (err) {
      console.error('Error fetching detailed reports:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      if (isMounted) {
        alert('Failed to fetch detailed reports');
      }
    }
  };

  const handleLoanStatus = async (loanId, status) => {
    try {
      await api.put('/loans/status', { loanId, status });
      fetchLoans(true);
      alert('Loan status updated');
    } catch (err) {
      console.error('Error updating loan status:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      alert('Failed to update loan status');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers(true);
      alert('User deleted');
    } catch (err) {
      console.error('Error deleting user:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      alert('Failed to delete user');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user._id);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || '',
      userType: user.userType || '',
      netWorth: user.netWorth != null ? user.netWorth.toString() : '',
      idNumber: user.idNumber || '',
      licenseNumber: user.licenseNumber || ''
    });
  };

  const handleUpdateUser = async (userId) => {
    try {
      await api.put('/users', { userId, ...editForm, netWorth: parseFloat(editForm.netWorth) || 0 });
      setEditingUser(null);
      fetchUsers(true);
      alert('User updated');
    } catch (err) {
      console.error('Error updating user:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      alert('Failed to update user');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        ...newUser,
        netWorth: parseFloat(newUser.netWorth) || 0,
        idNumber: newUser.role === 'customer' && newUser.userType === 'individual' ? newUser.idNumber : '',
        licenseNumber: newUser.userType === 'company' ? newUser.licenseNumber : ''
      };
      await api.post('/auth/register', userData);
      setNewUser({ name: '', email: '', password: '', role: 'customer', userType: 'individual', netWorth: '', idNumber: '', licenseNumber: '' });
      fetchUsers(true);
      alert('User created');
    } catch (err) {
      console.error('Error creating user:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      alert(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    try {
      await api.put('/loans/balance/update', { amount: parseFloat(balanceAdjustment) });
      setBalanceAdjustment('');
      fetchBalance(true);
      alert('Balance adjusted');
    } catch (err) {
      console.error('Error adjusting balance:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      alert('Failed to adjust balance');
    }
  };

  const handleSetInterestRule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/loans/interest-rules', {
        minAmount: parseFloat(newInterestRule.minAmount),
        maxAmount: parseFloat(newInterestRule.maxAmount),
        rate: parseFloat(newInterestRule.rate),
        timeFrame: parseInt(newInterestRule.timeFrame)
      });
      setNewInterestRule({ minAmount: '', maxAmount: '', rate: '', timeFrame: '' });
      fetchInterestRules(true);
      alert('Interest rule set');
    } catch (err) {
      console.error('Error setting interest rule:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      alert('Failed to set interest rule');
    }
  };

  const handleCheckCredit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.get('/users/credit-history', {
        params: { email: creditCheckEmail }
      });
      setCreditHistory(response.data || null);
    } catch (err) {
      console.error('Error fetching credit history:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      alert(err.response?.data?.error || 'Failed to fetch credit history');
    }
  };

  const filteredLoans = loanFilter === 'all' ? loans : loans.filter(loan => loan.status === loanFilter);

  const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) {
      return 'M 0.00';
    }
    return `M ${amount.toLocaleString('en-LS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateRepaymentRate = () => {
    if (!reports) return 0;
    const total = reports.totalLoans || 0;
    const completed = reports.completed || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const calculateActiveLoansPercentage = () => {
    if (!reports) return 0;
    const total = reports.totalLoans || 0;
    const active = reports.active || 0;
    return total > 0 ? Math.round((active / total) * 100) : 0;
  };

  const calculateAverageLoanDuration = () => {
    if (!loans || loans.length === 0) return '0 days';
    const completedLoans = loans.filter(loan => loan.status === 'completed');
    if (completedLoans.length === 0) return '0 days';

    const totalDuration = completedLoans.reduce((sum, loan) => {
      const created = new Date(loan.createdAt);
      const updated = new Date(loan.updatedAt || Date.now());
      const duration = (updated - created) / (1000 * 60 * 60 * 24); // Days
      return sum + duration;
    }, 0);

    const averageDays = Math.round(totalDuration / completedLoans.length);
    return `${averageDays} days`;
  };

  const renderLoanReportVisualization = () => {
    if (!reports) return null;
    const data = [
      { label: 'Total Loans', value: reports.totalLoans || 0, color: viewMode === 'modern' ? 'url(#modernPiePattern)' : '#26a69a' },
      { label: 'Pending', value: reports.pending || 0, color: viewMode === 'modern' ? 'url(#modernPiePattern2)' : '#ab47bc' },
      { label: 'Approved', value: reports.approved || 0, color: viewMode === 'modern' ? 'url(#modernPiePattern3)' : '#cddc39' },
      { label: 'Completed', value: reports.completed || 0, color: viewMode === 'modern' ? 'url(#modernPiePattern4)' : '#66bb6a' },
      { label: 'Defaulted', value: reports.defaulted || 0, color: viewMode === 'modern' ? 'url(#modernPiePattern5)' : '#ef5350' }
    ].filter(item => item.value > 0);

    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <p>No loan data available</p>;

    let startAngle = 0;
    const radius = 100;
    const slices = data.map((item, index) => {
      const percentage = item.value / total;
      const angle = percentage * 360;
      const endAngle = startAngle + angle;
      const largeArcFlag = angle > 180 ? 1 : 0;
      const startX = radius + radius * Math.cos((startAngle * Math.PI) / 180);
      const startY = radius + radius * Math.sin((startAngle * Math.PI) / 180);
      const endX = radius + radius * Math.cos((endAngle * Math.PI) / 180);
      const endY = radius + radius * Math.sin((endAngle * Math.PI) / 180);
      const path = `M ${radius},${radius} L ${startX},${startY} A ${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY} Z`;
      startAngle = endAngle;
      return (
        <path
          key={index}
          d={path}
          fill={item.color}
          stroke="#fff"
          strokeWidth="1"
        >
          <title>{`${item.label}: ${item.value}`}</title>
        </path>
      );
    });

    return (
      <div className="visualization pie-chart">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {viewMode === 'modern' && (
            <>
              <defs>
                <pattern id="modernPiePattern" patternUnits="userSpaceOnUse" width="10" height="10">
                  <rect width="10" height="10" fill="#26a69a"/>
                  <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="#fff" strokeWidth="2"/>
                </pattern>
                <pattern id="modernPiePattern2" patternUnits="userSpaceOnUse" width="10" height="10">
                  <rect width="10" height="10" fill="#ab47bc"/>
                  <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="#fff" strokeWidth="2"/>
                </pattern>
                <pattern id="modernPiePattern3" patternUnits="userSpaceOnUse" width="10" height="10">
                  <rect width="10" height="10" fill="#cddc39"/>
                  <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="#fff" strokeWidth="2"/>
                </pattern>
                <pattern id="modernPiePattern4" patternUnits="userSpaceOnUse" width="10" height="10">
                  <rect width="10" height="10" fill="#66bb6a"/>
                  <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="#fff" strokeWidth="2"/>
                </pattern>
                <pattern id="modernPiePattern5" patternUnits="userSpaceOnUse" width="10" height="10">
                  <rect width="10" height="10" fill="#ef5350"/>
                  <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="#fff" strokeWidth="2"/>
                </pattern>
              </defs>
            </>
          )}
          {slices}
          <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={viewMode === 'modern' ? '14' : '12'}>
            Total: {total}
          </text>
        </svg>
      </div>
    );
  };

  const renderUserRoleDistribution = () => {
    if (!users || users.length === 0) return null;
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, { admin: 0, lender: 0, customer: 0 });

    const data = [
      { label: 'Admins', value: roleCounts.admin, color: viewMode === 'modern' ? 'url(#modernPiePattern)' : '#26a69a' },
      { label: 'Lenders', value: roleCounts.lender, color: viewMode === 'modern' ? 'url(#modernPiePattern2)' : '#ab47bc' },
      { label: 'Customers', value: roleCounts.customer, color: viewMode === 'modern' ? 'url(#modernPiePattern3)' : '#cddc39' }
    ].filter(item => item.value > 0);

    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <p>No user data available</p>;

    let startAngle = 0;
    const radius = 100;
    const slices = data.map((item, index) => {
      const percentage = item.value / total;
      const angle = percentage * 360;
      const endAngle = startAngle + angle;
      const largeArcFlag = angle > 180 ? 1 : 0;
      const startX = radius + radius * Math.cos((startAngle * Math.PI) / 180);
      const startY = radius + radius * Math.sin((startAngle * Math.PI) / 180);
      const endX = radius + radius * Math.cos((endAngle * Math.PI) / 180);
      const endY = radius + radius * Math.sin((endAngle * Math.PI) / 180);
      const path = `M ${radius},${radius} L ${startX},${startY} A ${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY} Z`;
      startAngle = endAngle;
      return (
        <path
          key={index}
          d={path}
          fill={item.color}
          stroke="#fff"
          strokeWidth="1"
        >
          <title>{`${item.label}: ${item.value}`}</title>
        </path>
      );
    });

    return (
      <div className="visualization pie-chart">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {viewMode === 'modern' && (
            <>
              <defs>
                <pattern id="modernPiePattern" patternUnits="userSpaceOnUse" width="10" height="10">
                  <rect width="10" height="10" fill="#26a69a"/>
                  <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="#fff" strokeWidth="2"/>
                </pattern>
                <pattern id="modernPiePattern2" patternUnits="userSpaceOnUse" width="10" height="10">
                  <rect width="10" height="10" fill="#ab47bc"/>
                  <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="#fff" strokeWidth="2"/>
                </pattern>
                <pattern id="modernPiePattern3" patternUnits="userSpaceOnUse" width="10" height="10">
                  <rect width="10" height="10" fill="#cddc39"/>
                  <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="#fff" strokeWidth="2"/>
                </pattern>
              </defs>
            </>
          )}
          {slices}
          <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={viewMode === 'modern' ? '14' : '12'}>
            Total: {total}
          </text>
        </svg>
      </div>
    );
  };

  const renderLoanActivityOverTime = () => {
    if (!detailedReports || !detailedReports.byDate || detailedReports.byDate.length === 0) return <p>No loan activity data available</p>;

    const sortedData = [...detailedReports.byDate].sort((a, b) => new Date(a.date) - new Date(b.date));
    const maxCount = Math.max(...sortedData.map(item => item.count || 0), 1);
    const points = sortedData.map((item, index) => {
      const x = (index / (sortedData.length - 1)) * 280;
      const y = 100 - ((item.count || 0) / maxCount) * 80;
      return `${x},${y}`;
    }).join(' ');

    const labels = sortedData.map((item, index) => {
      const x = (index / (sortedData.length - 1)) * 280;
      return (
        <text key={index} x={x} y="120" fill={viewMode === 'modern' ? '#ab47bc' : '#2c3e50'} fontSize={viewMode === 'modern' ? '12' : '10'} textAnchor="middle">
          {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
        </text>
      );
    });

    const gridLines = Array.from({ length: 5 }, (_, i) => {
      const y = 20 + (i * 20);
      return <line key={i} x1="0" y1={y} x2="280" y2={y} stroke={viewMode === 'modern' ? '#ddd' : '#ddd'} strokeWidth="0.5" />;
    });

    return (
      <div className="visualization line-graph">
        <svg width="300" height="150" viewBox="0 0 300 150">
          {gridLines}
          <line x1="0" y1="100" x2="280" y2="100" stroke={viewMode === 'modern' ? '#ab47bc' : '#ccc'} strokeWidth="1" />
          <text x="5" y="10" fill={viewMode === 'modern' ? '#26a69a' : '#2c3e50'} fontSize={viewMode === 'modern' ? '12' : '10'}>Loans</text>
          <text x="140" y="130" fill={viewMode === 'modern' ? '#ab47bc' : '#2c3e50'} fontSize={viewMode === 'modern' ? '12' : '10'} textAnchor="middle">Date</text>
          <polyline
            points={points}
            fill="none"
            stroke={viewMode === 'modern' ? 'linear-gradient(to right, #26a69a, #66bb6a)' : '#1abc9c'}
            strokeWidth={viewMode === 'modern' ? '3' : '2'}
          />
          {sortedData.map((item, index) => {
            const x = (index / (sortedData.length - 1)) * 280;
            const y = 100 - ((item.count || 0) / maxCount) * 80;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={viewMode === 'modern' ? '4' : '3'}
                fill={viewMode === 'modern' ? '#cddc39' : '#1abc9c'}
              >
                <title>{`Date: ${new Date(item.date).toLocaleDateString('en-US')}, Loans: ${item.count}`}</title>
              </circle>
            );
          })}
          {labels}
          {Array.from({ length: 5 }, (_, i) => {
            const yValue = Math.round((maxCount * i) / 4);
            return <text key={i} x="285" y={100 - (i * 20)} fill={viewMode === 'modern' ? '#ab47bc' : '#2c3e50'} fontSize={viewMode === 'modern' ? '12' : '10'} textAnchor="end">{yValue}</text>;
          })}
        </svg>
      </div>
    );
  };

  const renderPaymentTrendsVisualization = () => {
    if (!detailedReports || !detailedReports.paymentTrends) return null;
    const maxRepaid = Math.max(...detailedReports.paymentTrends.map(t => t.totalRepaid || 0), 1);
    return (
      <div className="visualization bar-graph">
        <h4><i className="fas fa-chart-bar"></i> System-Wide Repayment Trends</h4>
        <svg width="300" height="150" viewBox="0 0 300 150">
          <line x1="0" y1="130" x2="300" y2="130" stroke={viewMode === 'modern' ? '#ab47bc' : '#ccc'} strokeWidth="1" />
          <line x1="0" y1="0" x2="0" y2="130" stroke={viewMode === 'modern' ? '#ab47bc' : '#ccc'} strokeWidth="1" />
          {Array.from({ length: 5 }, (_, i) => (
            <line key={i} x1={0} y1={130 - (i * 26)} x2="300" y2={130 - (i * 26)} stroke={viewMode === 'modern' ? '#ddd' : '#ddd'} strokeWidth="0.5" />
          ))}
          {detailedReports.paymentTrends.map((trend, index) => {
            const barHeight = ((trend.totalRepaid || 0) / maxRepaid) * 100;
            const x = (index / (detailedReports.paymentTrends.length - 1)) * 280;
            return (
              <rect
                key={index}
                x={x - 10}
                y={130 - barHeight}
                width="20"
                height={barHeight}
                fill={viewMode === 'modern' ? 'linear-gradient(to top, #26a69a, #66bb6a)' : '#3498db'}
              >
                <title>{`Date: ${trend.date}, Repaid: ${formatCurrency(trend.totalRepaid || 0)}`}</title>
              </rect>
            );
          })}
          {detailedReports.paymentTrends.map((trend, index) => {
            const x = (index / (detailedReports.paymentTrends.length - 1)) * 280 + 10;
            return (
              <text key={index} x={x} y="140" fill={viewMode === 'modern' ? '#ab47bc' : '#2c3e50'} fontSize={viewMode === 'modern' ? '12' : '10'} textAnchor="middle">
                {new Date(trend.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </text>
            );
          })}
          {Array.from({ length: 5 }, (_, i) => {
            const yValue = Math.round((maxRepaid * i) / 4);
            return <text key={i} x="-5" y={130 - (i * 26)} fill={viewMode === 'modern' ? '#ab47bc' : '#2c3e50'} fontSize={viewMode === 'modern' ? '12' : '10'} textAnchor="end">{formatCurrency(yValue)}</text>;
          })}
          <text x="150" y="-5" fill={viewMode === 'modern' ? '#ab47bc' : '#2c3e50'} fontSize={viewMode === 'modern' ? '12' : '10'} textAnchor="middle">Date</text>
          <text x="-5" y="65" fill={viewMode === 'modern' ? '#ab47bc' : '#2c3e50'} fontSize={viewMode === 'modern' ? '12' : '10'} textAnchor="end" transform="rotate(-90, -5, 65)">Amount (M)</text>
        </svg>
      </div>
    );
  };

  const renderCreditTrendsVisualization = () => {
    if (!creditHistory || !creditHistory.creditHistory) return null;
    const maxScore = Math.max(...creditHistory.creditHistory.map(t => t.creditScore || 0), 850);
    return (
      <div className="visualization bar-graph">
        <h4><i className="fas fa-credit-card"></i> Credit Score Trends for {creditHistory.email || 'Unknown'}</h4>
        <svg width="300" height="150" viewBox="0 0 300 150">
          <line x1="0" y1="130" x2="300" y2="130" stroke={viewMode === 'modern' ? '#ab47bc' : '#ccc'} strokeWidth="1" />
          <line x1="0" y1="0" x2="0" y2="130" stroke={viewMode === 'modern' ? '#ab47bc' : '#ccc'} strokeWidth="1" />
          {Array.from({ length: 5 }, (_, i) => (
            <line key={i} x1={0} y1={130 - (i * 26)} x2="300" y2={130 - (i * 26)} stroke={viewMode === 'modern' ? '#ddd' : '#ddd'} strokeWidth="0.5" />
          ))}
          {creditHistory.creditHistory.map((trend, index) => {
            const barHeight = ((trend.creditScore || 0) / maxScore) * 100;
            const x = (index / (creditHistory.creditHistory.length - 1)) * 280;
            return (
              <rect
                key={index}
                x={x - 10}
                y={130 - barHeight}
                width="20"
                height={barHeight}
                fill={viewMode === 'modern' ? 'linear-gradient(to top, #ab47bc, #ce93d8)' : '#e74c3c'}
              >
                <title>{`Date: ${trend.date}, Score: ${trend.creditScore}, Repayment: ${formatCurrency(trend.repaymentAmount || 0)}`}</title>
              </rect>
            );
          })}
          {creditHistory.creditHistory.map((trend, index) => {
            const x = (index / (creditHistory.creditHistory.length - 1)) * 280 + 10;
            return (
              <text key={index} x={x} y="140" fill={viewMode === 'modern' ? '#ab47bc' : '#2c3e50'} fontSize={viewMode === 'modern' ? '12' : '10'} textAnchor="middle">
                {new Date(trend.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </text>
            );
          })}
          {Array.from({ length: 5 }, (_, i) => {
            const yValue = Math.round((maxScore * i) / 4);
            return <text key={i} x="-5" y={130 - (i * 26)} fill={viewMode === 'modern' ? '#ab47bc' : '#2c3e50'} fontSize={viewMode === 'modern' ? '12' : '10'} textAnchor="end">{yValue}</text>;
          })}
          <text x="150" y="-5" fill={viewMode === 'modern' ? '#ab47bc' : '#2c3e50'} fontSize={viewMode === 'modern' ? '12' : '10'} textAnchor="middle">Date</text>
          <text x="-5" y="65" fill={viewMode建造 === 'modern' ? '#ab47bc' : '#2c3e50'} fontSize={viewMode === 'modern' ? '12' : '10'} textAnchor="end" transform="rotate(-90, -5, 65)">Score</text>
        </svg>
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
      createUsers: 'Create Users',
      setInterest: 'Set Interest',
      detailedReports: 'Detailed Reports',
      loanRequests: 'Loan Requests',
      changeMode: 'Change Mode',
      logout: 'Logout',
      welcome: 'Welcome',
      systemBalance: 'System Balance',
      totalUsers: 'Total Users',
      totalLoans: 'Total Loans',
      profitLoss: 'Profit & Loss',
      repaymentRate: 'Repayment Rate',
      activeLoans: 'Active Loans',
      avgLoanDuration: 'Avg Loan Duration',
      loanReports: 'Loan Reports',
      userRolesDistribution: 'User Roles Distribution',
      loanApplicationsOverTime: 'Loan Applications Over Time',
      systemWideRepaymentTrends: 'System-Wide Repayment Trends',
      creditScoreTrends: 'Credit Score Trends for',
      creditHistory: 'Credit History for',
      notifications: 'Notifications',
      highRiskUsers: 'High-Risk Users',
      language: 'Language',
      error: 'Error',
      retry: 'Retry',
      adminPanel: 'Admin Panel',
      date: 'Date',
      user: 'User',
      message: 'Message',
      loanApplication: 'Loan Application',
      loanPayment: 'Loan Payment',
      newUser: 'New User',
      interestRule: 'Interest Rule Set',
      loanApproval: 'Loan Approval',
      loanRejection: 'Loan Rejection',
      customer: 'Customer',
      defaultedLoans: 'Defaulted Loans',
      amount: 'Amount',
      status: 'Status',
    },
    st: {
      dashboard: 'Letlapa la Tsamaiso',
      createUsers: 'Theha Basebelisi',
      setInterest: 'Beha Tsoala',
      detailedReports: 'Litlaleho tse Hlophisitsoeng',
      loanRequests: 'Likopo tsa Kalimo',
      changeMode: 'Fetola Mokhoa',
      logout: 'Tsoa',
      welcome: 'Amoheloa',
      systemBalance: 'Tekanyo ea Sistimi',
      totalUsers: 'Kakaretso ea Basebelisi',
      totalLoans: 'Kakaretso ea Likalimo',
      profitLoss: 'Phaello le Tahlehelo',
      repaymentRate: 'Sekhahla sa Pusetso',
      activeLoans: 'Likalimo tse Sebetsang',
      avgLoanDuration: 'Karolelano ea Nako ea Kalimo',
      loanReports: 'Litlaleho tsa Kalimo',
      userRolesDistribution: 'Kabo ea Likarolo tsa Basebelisi',
      loanApplicationsOverTime: 'Likopo tsa Kalimo Ka Nako',
      systemWideRepaymentTrends: 'Mekhoa ea Pusetso ea Sistimi',
      creditScoreTrends: 'Mekhoa ea Lintlha tsa Mokitlane bakeng sa',
      creditHistory: 'Nalane ea Mokitlane bakeng sa',
      notifications: 'Litsebiso',
      highRiskUsers: 'Basebelisi ba Kotsing e Phahameng',
      language: 'Puo',
      error: 'Phoso',
      retry: 'Leka hape',
      adminPanel: 'Panel ea Tsamaiso',
      date: 'Letsatsi',
      user: 'Mosebelisi',
      message: 'Molaetsa',
      loanApplication: 'Kopo ea Kalimo',
      loanPayment: 'Tefo ea Kalimo',
      newUser: 'Mosebelisi e Mocha',
      interestRule: 'Molao oa Tsoala o Behiloe',
      loanApproval: 'Tumello ea Kalimo',
      loanRejection: 'Ho Hanoa ha Kalimo',
      customer: 'Moreki',
      defaultedLoans: 'Likalimo tse Defaulted',
      amount: 'Chelete',
      status: 'Boemo',
    },
  };

  const t = (key) => translations[language][key] || key;

  if (error) {
    return (
      <div className={`dashboard-container ${viewMode === 'modern' ? 'modern' : ''}`}>
        <style>
          {`
            .top-right {
              position: absolute;
              top: 1rem;
              right: 1rem;
              z-index: 10;
            }
            .logout-button {
              background-color: ${viewMode === 'modern' ? '#ff9999' : '#e74c3c'};
              color: #fff;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 5px;
              cursor: pointer;
              transition: background-color 0.3s;
            }
            .logout-button:hover {
              background-color: ${viewMode === 'modern' ? '#ff6666' : '#c0392b'};
            }
            .modern .logout-button {
              background-color: #ff9999;
            }
            .modern .logout-button:hover {
              background-color: #ff6666;
            }
          `}
        </style>
        <div className="top-right">
          <button onClick={handleLogout} className="logout-button">
            <i className="fas fa-sign-out-alt"></i> {t('logout')}
          </button>
        </div>
        <aside className="sidebar">
          <div className="sidebar-header">
            <img src="/logo.png" alt="Logo" className="sidebar-logo" />
            <h1>{t('adminPanel')}</h1>
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
              <li className="social-icons-bottom">
                <SocialIcons role="admin" />
              </li>
            </ul>
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
    <div className={`dashboard-container ${viewMode === 'modern' ? 'modern' : ''}`}>
      <style>
        {`
          .modern {
            background-color: #fff9e6;
            color: #333;
            font-style: italic;
          }
          .modern .sidebar {
            background-color: #ffeb99;
            color: #333;
            box-shadow: 2px 0 5px rgba(0, 0, 0, 0.3);
          }
          .modern .sidebar-button {
            background-color: #ffd700;
            color: #333;
          }
          .modern .sidebar-button:hover,
          .modern .sidebar-button.active {
            background-color: #ffca28;
          }
          .modern .logout-button {
            background-color: #ff9999;
          }
          .modern .logout-button:hover {
            background-color: #ff6666;
          }
          .modern .dashboard-main {
            background-color: #fff9e6;
          }
          .modern .metric-card,
          .modern .graph-card,
          .modern .wide-graph-card {
            background-color: #ffe4b5;
            color: #333;
            border: 2px solid #ffcc80;
            border-radius: 10px;
          }
          .modern .highlight {
            color: #ff5722;
            font-size: 1.3rem;
          }
          .modern .action-button.approve {
            background-color: #66bb6a;
            border: 2px solid #4caf50;
          }
          .modern .action-button.approve:hover {
            background-color: #4caf50;
          }
          .modern .action-button.reject {
            background-color: #ef5350;
            border: 2px solid #e53935;
          }
          .modern .action-button.reject:hover {
            background-color: #e53935;
          }
          .modern .error {
            color: #ef5350;
          }
          .modern .social-icons a {
            color: #333;
          }
          .modern .social-icons a:hover {
            color: #cddc39;
          }
          .modern .card h3,
          .modern .card h4 {
            font-size: 1.2rem;
            font-style: italic;
          }
          .modern .pie-chart svg text,
          .modern .line-graph svg text,
          .modern .bar-graph svg text {
            font-size: 12px;
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
          .top-right {
            position: absolute;
            top: 1rem;
            right: 1rem;
            z-index: 10;
          }
          .notification-bell {
            position: absolute;
            top: 1rem;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            cursor: pointer;
            z-index: 10;
          }
          .notification-bell .fas {
            font-size: 1.5rem;
            color: ${viewMode === 'modern' ? '#ff5722' : '#2c3e50'};
          }
          .notification-bell .badge {
            background-color: #ef5350;
            color: #fff;
            border-radius: 50%;
            padding: 0.2rem 0.5rem;
            font-size: 0.8rem;
            margin-left: 0.5rem;
            display: ${unseenNotifications.length > 0 ? 'inline-block' : 'none'};
          }
          .logout-button {
            background-color: ${viewMode === 'modern' ? '#ff9999' : '#e74c3c'};
            color: #fff;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
          }
          .logout-button:hover {
            background-color: ${viewMode === 'modern' ? '#ff6666' : '#c0392b'};
          }
          .notifications-table {
            margin-top: 1rem;
          }
          .high-risk-table {
            margin-top: 1rem;
          }
          .table-container {
            overflow-x: auto;
          }
          .modern .notifications-table th,
          .modern .notifications-table td,
          .modern .high-risk-table th,
          .modern .high-risk-table td {
            color: #333;
          }
          .sidebar select {
            width: 100%;
            padding: 0.5rem;
            margin-top: 0.5rem;
            border-radius: 5px;
            border: 1px solid #ccc;
            background-color: ${viewMode === 'modern' ? '#ffd700' : '#fff'};
            color: #333;
            cursor: pointer;
          }
          .sidebar select:hover {
            background-color: ${viewMode === 'modern' ? '#ffca28' : '#f0f0f0'};
          }
          .social-icons-bottom {
            margin-top: auto;
            padding: 1rem 0;
          }
          .dashboard-main h2 {
            position: relative;
            top: 1rem;
            left: 1rem;
          }
        `}
      </style>
      <div className="top-right">
        <button onClick={handleLogout} className="logout-button">
          <i className="fas fa-sign-out-alt"></i> {t('logout')}
        </button>
      </div>
      <div className="notification-bell" onClick={() => setActiveSection('notifications')}>
        <i className="fas fa-bell"></i>
        <span className="badge">{unseenNotifications.length}</span>
      </div>
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="Logo" className="sidebar-logo" />
          <h1>{t('adminPanel')}</h1>
        </div>
        <nav>
          <ul>
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
                className={`sidebar-button ${activeSection === 'create-users' ? 'active' : ''}`}
                onClick={() => setActiveSection('create-users')}
              >
                <i className="fas fa-user-plus"></i> {t('createUsers')}
              </button>
            </li>
            <li>
              <button
                className={`sidebar-button ${activeSection === 'set-interest' ? 'active' : ''}`}
                onClick={() => setActiveSection('set-interest')}
              >
                <i className="fas fa-percentage"></i> {t('setInterest')}
              </button>
            </li>
            <li>
              <button
                className={`sidebar-button ${activeSection === 'detailed-reports' ? 'active' : ''}`}
                onClick={() => setActiveSection('detailed-reports')}
              >
                <i className="fas fa-chart-bar"></i> {t('detailedReports')}
              </button>
            </li>
            <li>
              <button
                className={`sidebar-button ${activeSection === 'loan-requests' ? 'active' : ''}`}
                onClick={() => setActiveSection('loan-requests')}
              >
                <i className="fas fa-file-alt"></i> {t('loanRequests')}
              </button>
            </li>
            <li>
              <button
                className={`sidebar-button ${activeSection === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveSection('notifications')}
              >
                <i className="fas fa-bell"></i> {t('notifications')}
              </button>
            </li>
            <li>
              <button
                className={`sidebar-button ${activeSection === 'high-risk-users' ? 'active' : ''}`}
                onClick={() => setActiveSection('high-risk-users')}
              >
                <i className="fas fa-exclamation-triangle"></i> {t('highRiskUsers')}
              </button>
            </li>
            <li>
              <button
                className={`sidebar-button ${viewMode === 'modern' ? 'active' : ''}`}
                onClick={() => setViewMode(viewMode === 'default' ? 'modern' : 'default')}
              >
                <i className="fas fa-cog"></i> {t('changeMode')}
              </button>
            </li>
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
            <li className="social-icons-bottom">
              <SocialIcons role="admin" />
            </li>
          </ul>
        </nav>
      </aside>
      <main className="dashboard-main">
        <h2><i className="fas fa-user"></i> {t('welcome')}, {localUser?.name || 'Admin'}</h2>
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
          
          <div className={layoutMode === 'grid' ? 'card-grid' : 'card-list'}>
            <div className="metric-row">
              <div className="card metric-card">
                <h3><i className="fas fa-wallet"></i> {t('systemBalance')}</h3>
                <p className="highlight currency">{formatCurrency(balance)}</p>
                <form onSubmit={handleAdjustBalance} className="balance-form">
                  <input
                    type="number"
                    placeholder="Adjust Amount (+/-)"
                    value={balanceAdjustment}
                    onChange={(e) => setBalanceAdjustment(e.target.value)}
                    required
                  />
                  <button type="submit" className="action-button approve"><i className="fas fa-edit"></i> Adjust</button>
                </form>
              </div>
              <div className="card metric-card">
                <h3><i className="fas fa-users"></i> {t('totalUsers')}</h3>
                <p className="highlight">{users.length}</p>
              </div>
              <div className="card metric-card">
                <h3><i className="fas fa-hand-holding-usd"></i> {t('totalLoans')}</h3>
                <p className="highlight">{reports ? reports.totalLoans : 0}</p>
              </div>
              
              {profitLoss && (
                <div className="card metric-card">
                  <h3><i className="fas fa-balance-scale"></i> {t('profitLoss')}</h3>
                  <p>Profits (Interest): <span className="currency">{formatCurrency(profitLoss.profits || 0)}</span></p>
                  <p>Losses (Defaults): <span className="currency">{formatCurrency(profitLoss.losses || 0)}</span></p>
                </div>
              )}
            </div>
            <hr className="divider-bar" />

            <div className="metric-row">
              <div className="card metric-card">
                <h3><i className="fas fa-chart-line"></i> {t('repaymentRate')}</h3>
                <p className="highlight">{calculateRepaymentRate()}%</p>
              </div>
              <div className="card metric-card">
                <h3><i className="fas fa-tasks"></i> {t('activeLoans')}</h3>
                <p className="highlight">{calculateActiveLoansPercentage()}%</p>
              </div>
              <div className="card metric-card">
                <h3><i className="fas fa-clock"></i> {t('avgLoanDuration')}</h3>
                <p className="highlight">{calculateAverageLoanDuration()}</p>
              </div>
            </div>
            <hr className="divider-bar" />

            <div className="pie-chart-row">
              {reports && (
                <div className="card graph-card">
                  <h3><i className="fas fa-chart-pie"></i> {t('loanReports')}</h3>
                  {renderLoanReportVisualization()}
                </div>
              )}
              <div className="card graph-card">
                <h3><i className="fas fa-users"></i> {t('userRolesDistribution')}</h3>
                {renderUserRoleDistribution()}
              </div>
            </div>
            <hr className="divider-bar" />

            <div className="graph-row">
              <div className="card wide-graph-card">
                <h3><i className="fas fa-chart-line"></i> {t('loanApplicationsOverTime')}</h3>
                {renderLoanActivityOverTime()}
              </div>
            </div>
          </div>
        </div>

        <div className={`section ${activeSection === 'create-users' ? 'active' : ''}`}>
          <h3><i className="fas fa-user-plus"></i> {t('createUsers')}</h3>
          <div className="card">
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label><i className="fas fa-user"></i> Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label><i className="fas fa-envelope"></i> Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label><i className="fas fa-lock"></i> Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label><i className="fas fa-user-tag"></i> Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="lender">Lender</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
              {newUser.role === 'customer' && (
                <>
                  <div className="form-group">
                    <label><i className="fas fa-users"></i> User Type</label>
                    <select
                      value={newUser.userType}
                      onChange={(e) => setNewUser({ ...newUser, userType: e.target.value })}
                    >
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label><i className="fas fa-money-bill-wave"></i> Net Worth</label>
                    <input
                      type="number"
                      value={newUser.netWorth}
                      onChange={(e) => setNewUser({ ...newUser, netWorth: e.target.value })}
                    />
                  </div>
                  {newUser.userType === 'individual' && (
                    <div className="form-group">
                      <label><i className="fas fa-id-card"></i> ID Number</label>
                      <input
                        type="text"
                        value={newUser.idNumber}
                        onChange={(e) => setNewUser({ ...newUser, idNumber: e.target.value })}
                      />
                    </div>
                  )}
                  {newUser.userType === 'company' && (
                    <div className="form-group">
                      <label><i className="fas fa-file-alt"></i> License Number</label>
                      <input
                        type="text"
                        value={newUser.licenseNumber}
                        onChange={(e) => setNewUser({ ...newUser, licenseNumber: e.target.value })}
                      />
                    </div>
                  )}
                </>
              )}
              <button type="submit" className="action-button approve"><i className="fas fa-plus"></i> Create</button>
            </form>
          </div>
          <h3><i className="fas fa-users"></i> Users</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Net Worth</th>
                  <th>ID/License</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    {editingUser === u._id ? (
                      <>
                        <td>{u._id}</td>
                        <td>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          />
                        </td>
                        <td>
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          >
                            <option value="admin">Admin</option>
                            <option value="lender">Lender</option>
                            <option value="customer">Customer</option>
                          </select>
                        </td>
                        <td>
                          {editForm.role === 'customer' ? (
                            <select
                              value={editForm.userType}
                              onChange={(e) => setEditForm({ ...editForm, userType: e.target.value })}
                            >
                              <option value="individual">Individual</option>
                              <option value="company">Company</option>
                            </select>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {editForm.role === 'customer' ? (
                            <input
                              type="number"
                              value={editForm.netWorth}
                              onChange={(e) => setEditForm({ ...editForm, netWorth: e.target.value })}
                            />
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {editForm.role === 'customer' && editForm.userType === 'individual' ? (
                            <input
                              type="text"
                              value={editForm.idNumber}
                              onChange={(e) => setEditForm({ ...editForm, idNumber: e.target.value })}
                            />
                          ) : editForm.role === 'customer' && editForm.userType === 'company' ? (
                            <input
                              type="text"
                              value={editForm.licenseNumber}
                              onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
                            />
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          <button
                            className="action-button approve"
                            onClick={() => handleUpdateUser(u._id)}
                          >
                            <i className="fas fa-save"></i> Save
                          </button>
                          <button
                            className="action-button reject"
                            onClick={() => setEditingUser(null)}
                          >
                            <i className="fas fa-times"></i> Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{u._id}</td>
                        <td>{u.name || '-'}</td>
                        <td>{u.email || '-'}</td>
                        <td>{u.role || '-'}</td>
                        <td>{u.userType || '-'}</td>
                        <td>{u.netWorth != null ? formatCurrency(u.netWorth) : '-'}</td>
                        <td>{u.idNumber || u.licenseNumber || '-'}</td>
                        <td>
                          <button
                            className="action-button approve"
                            onClick={() => handleEditUser(u)}
                          >
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button
                            className="action-button reject"
                            onClick={() => handleDeleteUser(u._id)}
                          >
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`section ${activeSection === 'set-interest' ? 'active' : ''}`}>
          <h3><i className="fas fa-percentage"></i> {t('setInterest')}</h3>
          <div className="card">
            <form onSubmit={handleSetInterestRule}>
              <div className="form-group">
                <label><i className="fas fa-money-bill-wave"></i> Min Amount</label>
                <input
                  type="number"
                  value={newInterestRule.minAmount}
                  onChange={(e) => setNewInterestRule({ ...newInterestRule, minAmount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label><i className="fas fa-money-bill-wave"></i> Max Amount</label>
                <input
                  type="number"
                  value={newInterestRule.maxAmount}
                  onChange={(e) => setNewInterestRule({ ...newInterestRule, maxAmount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label><i className="fas fa-percentage"></i> Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newInterestRule.rate}
                  onChange={(e) => setNewInterestRule({ ...newInterestRule, rate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label><i className="fas fa-clock"></i> Time Frame (Months)</label>
                <input
                  type="number"
                  value={newInterestRule.timeFrame}
                  onChange={(e) => setNewInterestRule({ ...newInterestRule, timeFrame: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="action-button approve"><i className="fas fa-plus"></i> Set Rule</button>
            </form>
          </div>
          <h3><i className="fas fa-list"></i> Current Interest Rules</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Min Amount</th>
                  <th>Max Amount</th>
                  <th>Rate (%)</th>
                  <th>Time Frame</th>
                </tr>
              </thead>
              <tbody>
                {interestRules.map((rule) => (
                  <tr key={rule._id}>
                    <td>{formatCurrency(rule.minAmount)}</td>
                    <td>{formatCurrency(rule.maxAmount)}</td>
                    <td>{rule.rate.toFixed(2)}%</td>
                    <td>{rule.timeFrame} months</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`section ${activeSection === 'detailed-reports' ? 'active' : ''}`}>
          <h3><i className="fas fa-chart-bar"></i> {t('detailedReports')}</h3>
          <div className="card">
            {renderPaymentTrendsVisualization()}
          </div>
          <div className="card">
            <form onSubmit={handleCheckCredit}>
              <div className="form-group">
                <label><i className="fas fa-envelope"></i> Customer Email</label>
                <input
                  type="email"
                  value={creditCheckEmail}
                  onChange={(e) => setCreditCheckEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="action-button approve"><i className="fas fa-search"></i> Check Credit</button>
            </form>
            {creditHistory && (
              <div className="credit-history">
                <h4><i className="fas fa-credit-card"></i> {t('creditHistory')} {creditHistory.email}</h4>
                <p>Credit Score: {creditHistory.creditScore || 300}</p>
                <p>Net Worth: {formatCurrency(creditHistory.netWorth || 0)}</p>
                <p>ID Number: {creditHistory.idNumber || '-'}</p>
                <p>License Number: {creditHistory.licenseNumber || '-'}</p>
                {renderCreditTrendsVisualization()}
                <h5><i className="fas fa-hand-holding-usd"></i> Loan Details</h5>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Loan ID</th>
                        <th>Amount</th>
                        <th>Repayment</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditHistory.loans.map((loan) => (
                        <tr key={loan._id}>
                          <td>{loan._id}</td>
                          <td>{formatCurrency(loan.amount)}</td>
                          <td>{formatCurrency(loan.repaymentAmount)}</td>
                          <td>{loan.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`section ${activeSection === 'loan-requests' ? 'active' : ''}`}>
          <h3><i className="fas fa-file-alt"></i> {t('loanRequests')}</h3>
          <div className="filter-container">
            <label>Filter by Status:</label>
            <select value={loanFilter} onChange={(e) => setLoanFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Customer</th>
                  <th>Lender</th>
                  <th>Amount</th>
                  <th>Interest Rate</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan) => (
                  <tr key={loan._id}>
                    <td>{loan._id}</td>
                    <td>{loan.customerId?.name || '-'}</td>
                    <td>{loan.lenderId?.name || '-'}</td>
                    <td>{formatCurrency(loan.amount)}</td>
                    <td>{loan.interestRate.toFixed(2)}%</td>
                    <td>{formatCurrency(loan.outstandingBalance)}</td>
                    <td>{loan.status}</td>
                    <td>
                      {loan.status === 'pending' && (
                        <>
                          <button
                            className="action-button approve"
                            onClick={() => handleLoanStatus(loan._id, 'approved')}
                          >
                            <i className="fas fa-check"></i> Approve
                          </button>
                          <button
                            className="action-button reject"
                            onClick={() => handleLoanStatus(loan._id, 'rejected')}
                          >
                            <i className="fas fa-times"></i> Reject
                          </button>
                        </>
                      )}
                      {loan.status === 'active' && (
                        <button
                          className="action-button reject"
                          onClick={() => handleLoanStatus(loan._id, 'defaulted')}
                        >
                          <i className="fas fa-exclamation-triangle"></i> Mark Defaulted
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`section ${activeSection === 'notifications' ? 'active' : ''}`}>
          <h3><i className="fas fa-bell"></i> {t('notifications')}</h3>
          <div className="table-container">
            <table className="notifications-table">
              <thead>
                <tr>
                  <th>{t('date')}</th>
                  <th>{t('user')}</th>
                  <th>{t('message')}</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification._id}>
                    <td>{new Date(notification.createdAt).toLocaleString()}</td>
                    <td>{notification.userId?.name || 'System'}</td>
                    <td>{notification.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

       <div className={`section ${activeSection === 'high-risk-users' ? 'active' : ''}`}>
  <h3><i className="fas fa-exclamation-triangle"></i> {t('highRiskUsers')}</h3>
  <div className="table-container">
    <table className="high-risk-table">
      <thead>
        <tr>
          <th>{t('customer')}</th>
          <th>{t('defaultedLoans')}</th>
          <th>{t('amount')}</th>
          <th>{t('status')}</th>
        </tr>
      </thead>
      <tbody>
        {highRiskUsers.map((user) => (
          <tr key={user._id}>
            <td>{user.name || 'Unknown'}</td>
            <td>{user.defaultedLoans.length}</td>
            <td>
              {formatCurrency(
                user.defaultedLoans.reduce((sum, loan) => sum + (loan.outstandingBalance || 0), 0)
              )}
            </td>
            <td>{user.defaultedLoans.map((loan) => loan.status).join(', ')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
</main>
</div>
);
};

export default AdminDashboard;