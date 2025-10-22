const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const chatRoutes = require('./routes/chat');
const { socketAuth } = require('./middleware/auth');
const ChatHandler = require('./socket/chatHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Initialize chat handler
const chatHandler = new ChatHandler(io);

// Socket.io authentication middleware
io.use(socketAuth);

// Handle socket connections
io.on('connection', (socket) => {
  chatHandler.handleConnection(socket);
});

// Routes
app.use('/chat', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Chat service is running',
    timestamp: new Date().toISOString(),
    onlineUsers: chatHandler.getOnlineUsers().length
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Chat service running on port ${PORT}`);
  console.log(`🔌 Socket.io server ready for connections`);
});
