const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const Friend = require('../models/Friend');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Multer memory storage for avatar uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Search users by username
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username query parameter is required'
      });
    }

    // Search for users (excluding current user)
    const users = await User.find({
      $and: [
        { username: { $regex: username, $options: 'i' } },
        { username: { $ne: req.user.username } }
      ]
    }).select('username createdAt');

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add friend (send friend request)
router.post('/add-friend', verifyToken, async (req, res) => {
  try {
    const { username } = req.body;
    const currentUsername = req.user.username;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    if (username === currentUsername) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add yourself as friend'
      });
    }

    // Check if target user exists
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already friends or request exists
    const existingFriendship = await Friend.findOne({
      $or: [
        { user1: currentUsername, user2: username },
        { user1: username, user2: currentUsername }
      ]
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'Already friends with this user'
        });
      } else if (existingFriendship.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Friend request already exists'
        });
      }
    }

    // Create friend request
    const friendRequest = new Friend({
      user1: currentUsername,
      user2: username,
      status: 'pending'
    });

    await friendRequest.save();

    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });

  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Accept friend request
router.post('/accept-friend', verifyToken, async (req, res) => {
  try {
    const { username } = req.body;
    const currentUsername = req.user.username;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Find the friend request
    const friendRequest = await Friend.findOne({
      user1: username,
      user2: currentUsername,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    // Update status to accepted
    friendRequest.status = 'accepted';
    friendRequest.acceptedAt = new Date();
    await friendRequest.save();

    res.json({
      success: true,
      message: 'Friend request accepted successfully'
    });

  } catch (error) {
    console.error('Accept friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get friends list
router.get('/friends', verifyToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;

    const friendUsernames = await Friend.getFriends(currentUsername);

    // Fetch full user info for each friend
    const friendsWithInfo = await Promise.all(
      friendUsernames.map(async (username) => {
        const user = await User.findOne({ username }).select('username fullName avatar');
        return user ? {
          username: user.username,
          fullName: user.fullName || user.username,
          avatar: user.avatar || null
        } : { username, fullName: username, avatar: null };
      })
    );

    res.json({
      success: true,
      data: friendsWithInfo
    });

  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pending friend requests (only received requests)
router.get('/friend-requests', verifyToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;

    // Only get requests where current user is the receiver (user2)
    const requests = await Friend.find({
      user2: currentUsername,
      status: 'pending'
    });

    const formattedRequests = requests.map(request => ({
      from: request.user1,
      to: request.user2,
      status: request.status,
      createdAt: request.createdAt
    }));

    res.json({
      success: true,
      data: formattedRequests
    });

  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get sent friend requests
router.get('/sent-requests', verifyToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;

    // Only get requests where current user is the sender (user1)
    const requests = await Friend.find({
      user1: currentUsername,
      status: 'pending'
    });

    const formattedRequests = requests.map(request => ({
      to: request.user2,
      status: request.status,
      createdAt: request.createdAt
    }));

    res.json({
      success: true,
      data: formattedRequests
    });

  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify friendship between two users
router.get('/verify-friendship/:username', verifyToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    const targetUsername = req.params.username;

    const isFriend = await Friend.areFriends(currentUsername, targetUsername);

    res.json({
      success: true,
      data: { isFriend }
    });

  } catch (error) {
    console.error('Verify friendship error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-_id username email fullName dateOfBirth avatar createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update current user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { fullName, email, dateOfBirth } = req.body;

    const updates = {};
    if (typeof fullName === 'string') updates.fullName = fullName;
    if (typeof email === 'string') updates.email = email;
    if (typeof dateOfBirth === 'string' || dateOfBirth instanceof Date) updates.dateOfBirth = new Date(dateOfBirth);

    // Ensure email is unique if changed
    if (updates.email) {
      const exists = await User.findOne({ email: updates.email, username: { $ne: req.user.username } });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }

    const user = await User.findOneAndUpdate(
      { username: req.user.username },
      { $set: updates },
      { new: true, projection: '-_id username email fullName dateOfBirth avatar createdAt' }
    );

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Upload/Change avatar
router.post('/profile/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'chat-app-avatars',
          transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { avatar: result.secure_url } },
      { new: true, projection: '-_id username email fullName dateOfBirth avatar createdAt' }
    );

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload avatar' });
  }
});

// Cancel friend request
router.post('/cancel-friend-request', verifyToken, async (req, res) => {
  try {
    const { username } = req.body;
    const currentUsername = req.user.username;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Find and remove the friend request
    const friendRequest = await Friend.findOne({
      user1: currentUsername,
      user2: username,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    await Friend.findByIdAndDelete(friendRequest._id);

    res.json({
      success: true,
      message: 'Friend request cancelled'
    });

  } catch (error) {
    console.error('Cancel friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Decline friend request
router.post('/decline-friend-request', verifyToken, async (req, res) => {
  try {
    const { username } = req.body;
    const currentUsername = req.user.username;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Find and remove the friend request
    const friendRequest = await Friend.findOne({
      user1: username,
      user2: currentUsername,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    await Friend.findByIdAndDelete(friendRequest._id);

    res.json({
      success: true,
      message: 'Friend request declined'
    });

  } catch (error) {
    console.error('Decline friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove friend (unfriend)
router.post('/remove-friend', verifyToken, async (req, res) => {
  try {
    const { username } = req.body;
    const currentUsername = req.user.username;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    if (username === currentUsername) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove yourself'
      });
    }

    // Find the friendship
    const friendship = await Friend.findOne({
      $or: [
        { user1: currentUsername, user2: username, status: 'accepted' },
        { user1: username, user2: currentUsername, status: 'accepted' }
      ]
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Friendship not found'
      });
    }

    // Delete the friendship
    await Friend.findByIdAndDelete(friendship._id);

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });

  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;