const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
// Conditionally apply JSON parser (skip for multipart to avoid consuming the stream)
const jsonParser = express.json();
app.use((req, res, next) => {
  const ct = (req.headers['content-type'] || '').toLowerCase();
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  if (ct.includes('multipart/form-data')) return next();
  return jsonParser(req, res, next);
});
// Serve static from built React app (dist) and legacy public assets
const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.use(express.static(publicPath));

// Serve the main page
app.get('/', (req, res) => {
  const indexHtml = fs.existsSync(path.join(distPath, 'index.html'))
    ? path.join(distPath, 'index.html')
    : path.join(publicPath, 'index.html');
  res.sendFile(indexHtml);
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
  timeout: 30000,
  validateStatus: () => true,
});

// API proxy endpoints
app.use('/api/auth', async (req, res) => {
  const target = `${AUTH_BASE_URL}/auth${req.url}`;
  console.log(`Proxying ${req.method} ${req.originalUrl} -> ${target}`);
  try {
    const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
    const headers = { ...req.headers };
    delete headers.host;
    const response = await http.request({
      method: req.method,
      url: target,
      data: isMultipart ? req : req.body,
      headers,
      maxBodyLength: Infinity
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
    const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
    const headers = { ...req.headers };
    delete headers.host;
    const response = await http.request({
      method: req.method,
      url: target,
      data: isMultipart ? req : req.body,
      headers,
      maxBodyLength: Infinity
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
    const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
    const headers = { ...req.headers };
    delete headers.host;
    const response = await http.request({
      method: req.method,
      url: target,
      data: isMultipart ? req : req.body,
      headers,
      maxBodyLength: Infinity
    });
    console.log(`Chat service response status: ${response.status}, data:`, response.data);
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
