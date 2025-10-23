const Message = require('../models/Message');
const axios = require('axios');

class ChatHandler {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // Map username to socket ID
    this.userTokens = new Map(); // Map username to JWT token
  }

  // Handle new connection
  handleConnection(socket) {
    const username = socket.user.username;
    const token = socket.handshake.auth.token;
    console.log(`👤 User ${username} connected with socket ID: ${socket.id}`);
    
    // Store user socket mapping and token
    this.userSockets.set(username, socket.id);
    this.userTokens.set(username, token);
    
    // Join user to their personal room
    socket.join(`user_${username}`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to chat service',
      username: username
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`👋 User ${username} disconnected`);
      this.userSockets.delete(username);
      this.userTokens.delete(username);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      await this.handleSendMessage(socket, data);
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      this.handleTyping(socket, data);
    });

    socket.on('stop_typing', (data) => {
      this.handleStopTyping(socket, data);
    });

    // Handle joining a chat room with a friend
    socket.on('join_chat', async (data) => {
      await this.handleJoinChat(socket, data);
    });

    // Handle leaving a chat room
    socket.on('leave_chat', (data) => {
      this.handleLeaveChat(socket, data);
    });
  }

  // Handle sending messages
  async handleSendMessage(socket, data) {
    try {
      const { receiver, message, messageType, attachmentUrl, attachmentName, attachmentSize } = data;
      const sender = socket.user.username;
      const token = socket.handshake.auth.token;

      if (!receiver) {
        socket.emit('error', {
          message: 'Receiver is required'
        });
        return;
      }

      // For text messages, message is required. For attachments, URL is required
      if (!message && !attachmentUrl) {
        socket.emit('error', {
          message: 'Message or attachment is required'
        });
        return;
      }

      // Verify friendship
      const isFriend = await this.verifyFriendship(sender, receiver, token);
      if (!isFriend) {
        socket.emit('error', {
          message: 'You can only send messages to friends'
        });
        return;
      }

      // Create message in database
      const messageData = {
        sender,
        receiver,
        message: message ? message.trim() : '',
        messageType: messageType || 'text',
        timestamp: new Date()
      };

      // Add attachment data if present
      if (attachmentUrl) {
        messageData.attachmentUrl = attachmentUrl;
        messageData.attachmentName = attachmentName;
        messageData.attachmentSize = attachmentSize;
      }

      const newMessage = new Message(messageData);

      console.log('💾 Saving message to database:', messageData);

      const savedMessage = await newMessage.save();
      console.log('✅ Message saved successfully:', savedMessage._id);

      // Prepare message object for emitting
      const messageObject = {
        id: newMessage._id,
        sender,
        receiver,
        message: newMessage.message,
        messageType: newMessage.messageType,
        timestamp: newMessage.timestamp,
        read: false
      };

      // Add attachment data if present
      if (newMessage.attachmentUrl) {
        messageObject.attachmentUrl = newMessage.attachmentUrl;
        messageObject.attachmentName = newMessage.attachmentName;
        messageObject.attachmentSize = newMessage.attachmentSize;
      }

      // Send message to sender (confirmation)
      socket.emit('message_sent', messageObject);

      // Send message to receiver if online
      const receiverSocketId = this.userSockets.get(receiver);
      if (receiverSocketId) {
        this.io.to(receiverSocketId).emit('new_message', messageObject);
      }

      console.log(`💬 Message sent from ${sender} to ${receiver} (type: ${newMessage.messageType})`);

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', {
        message: 'Failed to send message'
      });
    }
  }

  // Handle typing indicators
  handleTyping(socket, data) {
    const { receiver } = data;
    const sender = socket.user.username;

    if (!receiver) return;

    const receiverSocketId = this.userSockets.get(receiver);
    if (receiverSocketId) {
      this.io.to(receiverSocketId).emit('user_typing', {
        sender,
        receiver
      });
    }
  }

  handleStopTyping(socket, data) {
    const { receiver } = data;
    const sender = socket.user.username;

    if (!receiver) return;

    const receiverSocketId = this.userSockets.get(receiver);
    if (receiverSocketId) {
      this.io.to(receiverSocketId).emit('user_stop_typing', {
        sender,
        receiver
      });
    }
  }

  // Handle joining a chat room
  async handleJoinChat(socket, data) {
    try {
      const { friendUsername } = data;
      const currentUsername = socket.user.username;
      const token = socket.handshake.auth.token;

      if (!friendUsername) {
        socket.emit('error', {
          message: 'Friend username is required'
        });
        return;
      }

      // Verify friendship
      const isFriend = await this.verifyFriendship(currentUsername, friendUsername, token);
      if (!isFriend) {
        socket.emit('error', {
          message: 'You can only chat with friends'
        });
        return;
      }

      // Join chat room
      const roomName = this.getRoomName(currentUsername, friendUsername);
      socket.join(roomName);

      socket.emit('joined_chat', {
        room: roomName,
        friend: friendUsername
      });

      console.log(`🏠 User ${currentUsername} joined chat with ${friendUsername}`);

    } catch (error) {
      console.error('Join chat error:', error);
      socket.emit('error', {
        message: 'Failed to join chat'
      });
    }
  }

  // Handle leaving a chat room
  handleLeaveChat(socket, data) {
    const { friendUsername } = data;
    const currentUsername = socket.user.username;

    if (!friendUsername) return;

    const roomName = this.getRoomName(currentUsername, friendUsername);
    socket.leave(roomName);

    socket.emit('left_chat', {
      room: roomName,
      friend: friendUsername
    });

    console.log(`🚪 User ${currentUsername} left chat with ${friendUsername}`);
  }

  // Verify friendship between two users
  async verifyFriendship(username1, username2, token) {
    try {
      console.log(`🔍 Verifying friendship between ${username1} and ${username2}`);
      
      // Call user service to verify friendship
      const response = await axios.get(`${process.env.USER_SERVICE_URL}/users/verify-friendship/${username2}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        console.log(`✅ Friendship verification response:`, response.data);
        return response.data.data.isFriend;
      }
      
      console.log(`⚠️ Friendship verification failed:`, response.data);
      return false;
    } catch (error) {
      console.error('❌ Friendship verification error:', error.message);
      return false;
    }
  }

  // Helper method to get user token (kept for backward compatibility)
  getUserToken(username) {
    return this.userTokens.get(username);
  }

  // Generate consistent room name for two users
  getRoomName(username1, username2) {
    const sorted = [username1, username2].sort();
    return `chat_${sorted[0]}_${sorted[1]}`;
  }

  // Get online users
  getOnlineUsers() {
    return Array.from(this.userSockets.keys());
  }

  // Check if user is online
  isUserOnline(username) {
    return this.userSockets.has(username);
  }
}

module.exports = ChatHandler;
