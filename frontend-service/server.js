const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Avoid favicon 404 noise
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Frontend service is running',
    timestamp: new Date().toISOString()
  });
});

// Helper: base URLs from env (defaults to Docker service names)
const AUTH_BASE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const USER_BASE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3002';
const CHAT_BASE_URL = process.env.CHAT_SERVICE_URL || 'http://chat-service:3003';

// Shared axios client with timeout and no redirects of host header
const http = axios.create({
  timeout: 10000,
  validateStatus: () => true,
});

// API proxy endpoints
app.use('/api/auth', async (req, res) => {
  const target = `${AUTH_BASE_URL}/auth${req.url}`;
  console.log(`Proxying ${req.method} ${req.originalUrl} -> ${target}`);
  try {
    const response = await http.request({
      method: req.method,
      url: target,
      data: req.body,
      headers: { Authorization: req.headers['authorization'], 'Content-Type': req.headers['content-type'] },
    });
    if (response.status >= 200 && response.status < 300) return res.status(response.status).json(response.data);
    return res.status(response.status || 500).json(response.data || { success: false, message: 'Auth proxy error' });
  } catch (error) {
    console.error('Auth service error:', error.message);
    return res.status(502).json({ success: false, message: 'Auth service unreachable' });
  }
});

app.use('/api/users', async (req, res) => {
  const target = `${USER_BASE_URL}/users${req.url}`;
  console.log(`Proxying ${req.method} ${req.originalUrl} -> ${target}`);
  try {
    const response = await http.request({
      method: req.method,
      url: target,
      data: req.body,
      headers: { Authorization: req.headers['authorization'], 'Content-Type': req.headers['content-type'] },
    });
    if (response.status >= 200 && response.status < 300) return res.status(response.status).json(response.data);
    return res.status(response.status || 500).json(response.data || { success: false, message: 'User proxy error' });
  } catch (error) {
    console.error('User service error:', error.message);
    return res.status(502).json({ success: false, message: 'User service unreachable' });
  }
});

app.use('/api/chat', async (req, res) => {
  const target = `${CHAT_BASE_URL}/chat${req.url}`;
  console.log(`Proxying ${req.method} ${req.originalUrl} -> ${target}`);
  try {
    const response = await http.request({
      method: req.method,
      url: target,
      data: req.body,
      headers: { Authorization: req.headers['authorization'], 'Content-Type': req.headers['content-type'] },
    });
    if (response.status >= 200 && response.status < 300) return res.status(response.status).json(response.data);
    return res.status(response.status || 500).json(response.data || { success: false, message: 'Chat proxy error' });
  } catch (error) {
    console.error('Chat service error:', error.message);
    return res.status(502).json({ success: false, message: 'Chat service unreachable' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Frontend service running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} to view the app`);
});
