import React, { useState } from 'react';
import { api } from '../api';
import AnimatedBackground from './AnimatedBackground';

export default function Login({ onRegister, onLoggedIn }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    if (!usernameOrEmail || !password) {
      setError('Please enter both username/email and password');
      return;
    }
    try {
      const res = await fetch(`${api.authBase}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password })
      });
      const data = await res.json();
      if (data.success) {
        onLoggedIn(data.data.token, data.data.user.username);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (e) {
      setError('Connection error');
    }
  }

  return (
    <div className="auth-page">
      <AnimatedBackground />
      <div className="auth-container">
        <div className="auth-logo">
          <h1 className="auth-app-name">SokishiX</h1>
          <p className="auth-tagline">Kết nối tình anh em</p>
        </div>
        <h2 className="auth-title">Welcome Back</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label>
            <i className="fas fa-user"></i> Username or Email
          </label>
          <input 
            className="form-control"
            value={usernameOrEmail} 
            onChange={e => setUsernameOrEmail(e.target.value)} 
            onKeyDown={e => e.key==='Enter' && handleLogin()} 
            placeholder="Enter your username or email"
          />
        </div>
        <div className="form-group">
          <label>
            <i className="fas fa-lock"></i> Password
          </label>
          <input 
            type="password" 
            className="form-control"
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            onKeyDown={e => e.key==='Enter' && handleLogin()}
            placeholder="Enter your password"
          />
        </div>
        <button className="btn btn-primary btn-block" onClick={handleLogin}>
          <i className="fas fa-sign-in-alt"></i> Login
        </button>
        <div className="auth-divider">
          <span>or</span>
        </div>
        <button className="btn btn-secondary btn-block" onClick={onRegister}>
          <i className="fas fa-user-plus"></i> Create New Account
        </button>
      </div>
    </div>
  );
}



