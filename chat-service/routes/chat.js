const express = require('express');
const Message = require('../models/Message');
const { verifyToken } = require('../middleware/auth');
const axios = require('axios');
const router = express.Router();

// Get chat history with a friend
router.get('/history/:friendUsername', verifyToken, async (req, res) => {
  try {
    const { friendUsername } = req.params;
    const currentUsername = req.user.username;
    const { page = 1, limit = 50 } = req.query;

    // Verify friendship with user service
    try {
      const authHeader = req.header('Authorization');
      const token = authHeader ? authHeader.replace('Bearer ', '') : '';
      
      const userResponse = await axios.get(`${process.env.USER_SERVICE_URL}/users/verify-friendship/${friendUsername}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (userResponse.data.success) {
        const isFriend = userResponse.data.data.isFriend;
        
        if (!isFriend) {
          return res.status(403).json({
            success: false,
            message: 'You can only view chat history with friends'
          });
        }
      }
    } catch (error) {
      console.error('Friend verification error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify friendship'
      });
    }

    // Get messages between users
    const messages = await Message.find({
      $or: [
        { sender: currentUsername, receiver: friendUsername },
        { sender: friendUsername, receiver: currentUsername }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('sender receiver message timestamp read');

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: messages.length
        }
      }
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark messages as read
router.put('/mark-read/:friendUsername', verifyToken, async (req, res) => {
  try {
    const { friendUsername } = req.params;
    const currentUsername = req.user.username;

    // Mark messages as read
    await Message.updateMany(
      {
        sender: friendUsername,
        receiver: currentUsername,
        read: false
      },
      {
        $set: { read: true }
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get unread message count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;

    const unreadCount = await Message.countDocuments({
      receiver: currentUsername,
      read: false
    });

    res.json({
      success: true,
      data: {
        unreadCount
      }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
