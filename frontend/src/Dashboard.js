import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import AdminDashboard from './AdminDashboard';
import CustomerDashboard from './CustomerDashboard';
import LenderDashboard from './LenderDashboard';
import Login from './Login';
import Register from './Register';
import api from './api';

const LandingPage = ({ onLogin }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showPersonalMessage, setShowPersonalMessage] = useState(false);
  const [showBusinessMessage, setShowBusinessMessage] = useState(false);
  const [showContactUsMessage, setShowContactUsMessage] = useState(false);
  const [showAboutUsMessage, setShowAboutUsMessage] = useState(false);

  const handleDoubleClick = (e) => {
    if (!e.target.closest('.form-container') && !e.target.closest('.about-us-container')) {
      setShowLogin(false);
      setShowRegister(false);
      setShowAboutUs(false);
    }
  };

  return (
    <div className="landing-container" onDoubleClick={handleDoubleClick}>
      <style>
        {`
          .landing-container {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background-image: url('/background.jpg');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            position: relative;
            overflow-y: auto;
            width: 100%;
            color: #fff;
          }

          .landing-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.2);
            z-index: 1;
          }

          .landing-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 2rem;
            z-index: 2;
            position: relative;
          }

          .logo-container {
            display: flex;
            align-items: center;
          }

          .landing-logo {
            height: 40px;
            margin-right: 1rem;
          }

          .platform-name {
            font-size: 1.5rem;
            font-weight: 700;
          }

          .landing-nav {
            display: flex;
            gap: 1rem;
          }

          .nav-button {
            background-color: transparent;
            color: #fff;
            border: none;
            padding: 0.5rem 1rem;
            font-size: 1rem;
            font-weight: bold;
            border-radius: 5px;
            cursor: pointer;
            transition: color 0.3s ease;
          }

          .nav-button:hover {
            color: #1abc9c;
          }

          .nav-button i {
            margin-right: 0.5rem;
          }

          .landing-content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 2rem;
            z-index: 2;
            position: relative;
            transition: margin-top 0.3s ease;
          }

          .landing-content.content-with-margin {
            margin-top: 150px;
          }

          .landing-quote {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          }

          .landing-footer {
            padding: 1rem;
            z-index: 2;
            position: relative;
            text-align: center;
            font-size: 0.9rem;
            background-color: rgba(0, 0, 0, 0.3);
          }

          .landing-footer .social-icons {
            margin-top: 0.5rem;
          }

          .social-icons a {
            color: #fff;
            margin: 0 0.5rem;
            font-size: 1.2rem;
            transition: color 0.3s ease;
          }

          .social-icons a:hover {
            color: #1abc9c;
          }

          .form-overlay, .about-us-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 3;
          }

          .form-container, .about-us-container {
            background: #fff;
            color: #2c3e50;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            position: relative;
            max-width: 400px;
            width: 100%;
          }

          .close-button {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #e74c3c;
            color: #fff;
            border: none;
            padding: 0.5rem;
            border-radius: 50%;
            cursor: pointer;
            transition: background-color 0.3s ease;
          }

          .close-button:hover {
            background: #c0392b;
          }

          .auth-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-image: url('/src/background.jpg');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            position: relative;
          }

          .auth-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
          }

          .auth-card {
            background: rgba(255, 255, 255, 0.9);
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            width: 100%;
            max-width: 400px;
            text-align: center;
            position: relative;
            z-index: 1;
          }

          .auth-logo {
            height: 50px;
            margin-bottom: 1rem;
          }

          .form-group {
            margin-bottom: 1rem;
            text-align: left;
          }

          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
          }

          .form-group input, .form-group select {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 1rem;
          }

          .action-button.approve {
            background-color: #1abc9c;
            color: #fff;
            border: none;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s ease;
          }

          .action-button.approve:hover {
            background-color: #16a085;
          }

          .error {
            color: #e74c3c;
            margin-bottom: 1rem;
          }

          .button-box {
            background: rgba(0, 0, 0, 0.3);
            z-index: 2;
            position: relative;
            padding: 1rem 0;
          }

          .landing-buttons {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            z-index: 2;
            position: relative;
          }

          .button-container {
            position: relative;
          }

          .hover-message {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background-color: #fff;
            color: #000;
            padding: 1rem;
            border-radius: 4px;
            font-size: 1rem;
            width: 250px;
            z-index: 100;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            text-align: left;
            margin-top: 10px;
          }

          .landing-container.hover-active .landing-content {
            margin-top: 150px;
          }

          .landing-cards {
            display: flex;
            gap: 30px;
            max-width: 1200px;
            justify-content: center;
            padding: 50px 20px;
            margin: 0 auto;
            z-index: 2;
            position: relative;
          }

          .card {
            background: #fff;
            width: 270px;
            padding: 40px 20px 20px 20px;
            border-radius: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            text-align: center;
            position: relative;
            color: #333;
            min-height: 300px;
          }

          .icon-wrapper {
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            background: #b40000;
            padding: 30px;
            border-radius: 30% 30% 30% 30% / 40% 40% 60% 60%;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
          }

          .icon-wrapper img {
            width: 40px;
            height: 40px;
          }

          .card h3 {
            margin-top: 60px;
            color: #b40000;
            font-size: 20px;
          }

          .card p {
            margin-top: 15px;
            font-size: 15px;
            line-height: 1.6;
            color: #333;
          }

          .landing-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          .landing-footer {
            margin-top: auto;
            padding: 1rem;
            z-index: 2;
            position: relative;
            text-align: center;
            font-size: 0.9rem;
            background-color: rgba(0, 0, 0, 0.3);
          }
        `}
      </style>
      <header className="landing-header">
        <div className="logo-container">
          <img src="/logo.png" alt="FinSavvy Logo" className="landing-logo" />
          <h1 className="platform-name">FinSavvy</h1>
        </div>
        <nav className="landing-nav">
          <button
            onClick={() => {
              setShowRegister(true);
              setShowLogin(false);
              setShowAboutUs(false);
            }}
            className="nav-button"
          >
            <i className="fas fa-user-plus"></i> Sign Up
          </button>
          <button
            onClick={() => {
              setShowLogin(true);
              setShowRegister(false);
              setShowAboutUs(false);
            }}
            className="nav-button"
          >
            <i className="fas fa-sign-in-alt"></i> Sign In
          </button>
        </nav>
      </header>
      <div className="button-box">
        <div className="landing-buttons">
          <div className="button-container">
            <button
              className="nav-button"
              onMouseEnter={() => setShowPersonalMessage(true)}
              onMouseLeave={() => setShowPersonalMessage(false)}
            >
              <i className="fas fa-user"></i> Personal
            </button>
            {showPersonalMessage && (
              <div className="hover-message">
                <p>At FinSavvy, we offer tailored personal finance solutions to help you manage your money effectively. Whether you're looking to save, invest, or secure a loan, our platform connects you with the best tools and resources to achieve your financial goals with ease and confidence.</p>
              </div>
            )}
          </div>
          <div className="button-container">
            <button
              className="nav-button"
              onMouseEnter={() => setShowBusinessMessage(true)}
              onMouseLeave={() => setShowBusinessMessage(false)}
            >
              <i className="fas fa-briefcase"></i> Business
            </button>
            {showBusinessMessage && (
              <div className="hover-message">
                <p>FinSavvy provides comprehensive business solutions to help your company grow and thrive. From accessing capital through trusted lenders to utilizing advanced analytics for better decision-making, we support your business at every stage with transparency and innovative tools.</p>
              </div>
            )}
          </div>
          <div className="button-container">
            <button
              className="nav-button"
              onMouseEnter={() => setShowContactUsMessage(true)}
              onMouseLeave={() => setShowContactUsMessage(false)}
            >
              <i className="fas fa-phone"></i> Contact Us
            </button>
            {showContactUsMessage && (
              <div className="hover-message">
                <p>Need assistance? Our dedicated support team at FinSavvy is here to help you with any questions or concerns. Whether you're a customer, lender, or partner, reach out to us via email, phone, or live chat, and we'll ensure you get the support you need promptly.</p>
              </div>
            )}
          </div>
          <div className="button-container">
            <button
              className="nav-button"
              onClick={() => {
                setShowAboutUs(true);
                setShowLogin(false);
                setShowRegister(false);
              }}
              onMouseEnter={() => setShowAboutUsMessage(true)}
              onMouseLeave={() => setShowAboutUsMessage(false)}
            >
              <i className="fas fa-info-circle"></i> About Us
            </button>
            {showAboutUsMessage && (
              <div className="hover-message">
                <p>FinSavvy is a leading financial platform dedicated to empowering individuals and businesses. We connect customers with trusted lenders, offering seamless loan applications, credit checks, and repayments. Our mission is to simplify financial growth with transparency and innovation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={`landing-content ${showPersonalMessage || showBusinessMessage || showContactUsMessage || showAboutUsMessage ? 'content-with-margin' : ''}`}>
        <h2 className="landing-quote">"Unlock Your Financial Future Today"</h2>
      </div>
      <div className="landing-cards">
        <div className="card">
          <div className="icon-wrapper">
            <img src="https://img.icons8.com/ios-filled/50/user-male-circle.png" alt="Personal Solutions" />
          </div>
          <h3>Personal Solutions</h3>
          <p>Innovative product line answering demands of end consumers on various markets.</p>
        </div>
        <div className="card">
          <div className="icon-wrapper">
            <img src="https://img.icons8.com/ios-filled/50/combo-chart.png" alt="Business Solutions" />
          </div>
          <h3>Business Solutions</h3>
          <p>Creditinfo analytical and software solutions help our customers to make better and faster decisions.</p>
        </div>
        <div className="card">
          <div className="icon-wrapper">
            <img src="https://img.icons8.com/ios-filled/50/courthouse.png" alt="Government Solutions" />
          </div>
          <h3>Government Solutions</h3>
          <p>A very important tool for the financial position evaluation of both potential and existing customers.</p>
        </div>
        <div className="card">
          <div className="icon-wrapper">
            <img src="https://img.icons8.com/ios-filled/50/handshake.png" alt="Partnership" />
          </div>
          <h3>Partnership</h3>
          <p>Creditinfo is the first choice for many organisations wanting to establish a successful Credit Bureau.</p>
        </div>
      </div>
      <footer className="landing-footer">
        <p>© 2025 FinSavvy. All Rights Reserved.</p>
        <div className="social-icons">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook-f"></i></a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter"></i></a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin-in"></i></a>
        </div>
      </footer>
      {showLogin && (
        <div className="form-overlay">
          <div className="form-container">
            <Login onLogin={onLogin} />
            <button
              className="close-button"
              onClick={() => setShowLogin(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
      {showRegister && (
        <div className="form-overlay">
          <div className="form-container">
            <Register onLogin={onLogin} />
            <button
              className="close-button"
              onClick={() => setShowRegister(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
      {showAboutUs && (
        <div className="about-us-overlay">
          <div className="about-us-container">
            <h3>About Us</h3>
            <p>
              FinSavvy is a platform dedicated to simplifying financial growth for individuals and businesses. 
              We connect customers with trusted lenders, offering seamless loan applications, credit checks, and repayments. 
              Our mission is to empower wealth creation with transparency and ease.
            </p>
            <button
              className="close-button"
              onClick={() => setShowAboutUs(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/users/me');
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage onLogin={setUser} />} />
      <Route
        path="/dashboard"
        element={
          user ? (
            user.role === 'admin' ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : user.role === 'customer' ? (
              <CustomerDashboard user={user} onLogout={handleLogout} />
            ) : user.role === 'lender' ? (
              <LenderDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default Dashboard;