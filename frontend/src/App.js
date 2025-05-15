import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import AdminDashboard from './AdminDashboard';
import CustomerDashboard from './CustomerDashboard';
import LenderDashboard from './LenderDashboard';
import LandingPage from './LandingPage';
import api from './api';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        try {
          const response = await api.get('/users/credit-history', {
            params: { email: JSON.parse(storedUser).email },
          });
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error('Token validation failed:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    };
    validateToken();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/'; // Redirect to LandingPage
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={!user ? <LandingPage onLogin={handleLogin} /> : <Navigate to={`/${user.role}`} />} />
        <Route path="/login" element={user ? <Navigate to={`/${user.role}`} /> : <Login onLogin={handleLogin} />} />
        <Route path="/register" element={user ? <Navigate to={`/${user.role}`} /> : <Register onLogin={handleLogin} />} />
        <Route
          path="/admin"
          element={user && user.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route
          path="/customer"
          element={user && user.role === 'customer' ? <CustomerDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route
          path="/lender"
          element={user && user.role === 'lender' ? <LenderDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;