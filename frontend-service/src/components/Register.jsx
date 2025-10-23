import React, { useState } from 'react';
import { api } from '../api';
import AnimatedBackground from './AnimatedBackground';

export default function Register({ onBack, onRegistered }) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleRegister() {
    setError(''); setSuccess('');
    if (!fullName || !username || !email || !dateOfBirth || !password) {
      setError('Please fill in all required fields');
      return;
    }
    const form = new FormData();
    form.append('fullName', fullName);
    form.append('username', username);
    form.append('email', email);
    form.append('dateOfBirth', dateOfBirth);
    form.append('password', password);
    if (avatar) form.append('avatar', avatar);
    try {
      const res = await fetch(`${api.authBase}/register`, { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        setSuccess('Registration successful! Please login.');
        setTimeout(() => onRegistered(), 1200);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (e) {
      setError('Connection error');
    }
  }

  return (
    <div className="auth-page">
      <AnimatedBackground />
      <div className="auth-container auth-container-register">
        <div className="auth-logo">
          <h1 className="auth-app-name">SokishiX</h1>
          <p className="auth-tagline">Kết nối tình anh em</p>
        </div>
        <h2 className="auth-title">Create Account</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <div className="form-group">
          <label>
            <i className="fas fa-id-card"></i> Full Name
          </label>
          <input 
            className="form-control"
            value={fullName} 
            onChange={e => setFullName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>
        <div className="form-group">
          <label>
            <i className="fas fa-user"></i> Username
          </label>
          <input 
            className="form-control"
            value={username} 
            onChange={e => setUsername(e.target.value)}
            placeholder="Choose a username"
          />
        </div>
        <div className="form-group">
          <label>
            <i className="fas fa-envelope"></i> Email
          </label>
          <input 
            type="email" 
            className="form-control"
            value={email} 
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>
        <div className="form-group">
          <label>
            <i className="fas fa-calendar"></i> Date of Birth
          </label>
          <input 
            type="date" 
            className="form-control"
            value={dateOfBirth} 
            onChange={e => setDateOfBirth(e.target.value)}
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
            placeholder="Create a password"
          />
        </div>
        <div className="form-group">
          <label>
            <i className="fas fa-image"></i> Avatar (optional)
          </label>
          <input 
            type="file" 
            className="form-control"
            accept="image/*" 
            onChange={e => setAvatar(e.target.files?.[0] || null)}
          />
        </div>
        <button className="btn btn-primary btn-block" onClick={handleRegister}>
          <i className="fas fa-user-plus"></i> Register
        </button>
        <div className="auth-divider">
          <span>or</span>
        </div>
        <button className="btn btn-secondary btn-block" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back to Login
        </button>
      </div>
    </div>
  );
}



