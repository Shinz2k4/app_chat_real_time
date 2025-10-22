const express = require('express');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

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

    // Get or create current user's profile
    let currentUser = await User.findOne({ username: currentUsername });
    if (!currentUser) {
      currentUser = new User({ username: currentUsername });
    }

    // Check if already friends or request exists
    const existingFriend = currentUser.friends.find(f => f.username === username);
    const existingRequest = currentUser.friendRequests.find(r => 
      (r.from === currentUsername && r.to === username) ||
      (r.from === username && r.to === currentUsername)
    );

    if (existingFriend && existingFriend.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Already friends with this user'
      });
    }

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already exists'
      });
    }

    // Add friend request
    currentUser.friendRequests.push({
      from: currentUsername,
      to: username,
      status: 'pending'
    });

    // Add to target user's friend requests
    targetUser.friendRequests.push({
      from: currentUsername,
      to: username,
      status: 'pending'
    });

    await currentUser.save();
    await targetUser.save();

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

    // Get current user
    let currentUser = await User.findOne({ username: currentUsername });
    if (!currentUser) {
      currentUser = new User({ username: currentUsername });
    }

    // Find the friend request
    const friendRequest = currentUser.friendRequests.find(r => 
      r.from === username && r.to === currentUsername && r.status === 'pending'
    );

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    // Update friend request status
    friendRequest.status = 'accepted';

    // Add to friends list
    currentUser.friends.push({
      username: username,
      status: 'accepted'
    });

    // Update target user's friend request and add to their friends list
    const targetUser = await User.findOne({ username });
    if (targetUser) {
      const targetRequest = targetUser.friendRequests.find(r => 
        r.from === username && r.to === currentUsername && r.status === 'pending'
      );
      if (targetRequest) {
        targetRequest.status = 'accepted';
      }
      targetUser.friends.push({
        username: currentUsername,
        status: 'accepted'
      });
      await targetUser.save();
    }

    await currentUser.save();

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

    let currentUser = await User.findOne({ username: currentUsername });
    if (!currentUser) {
      currentUser = new User({ username: currentUsername });
    }

    const friends = currentUser.getAcceptedFriends();

    res.json({
      success: true,
      data: friends
    });

  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pending friend requests
router.get('/friend-requests', verifyToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;

    let currentUser = await User.findOne({ username: currentUsername });
    if (!currentUser) {
      currentUser = new User({ username: currentUsername });
    }

    const pendingRequests = currentUser.getPendingRequests();

    res.json({
      success: true,
      data: pendingRequests
    });

  } catch (error) {
    console.error('Get friend requests error:', error);
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

    let currentUser = await User.findOne({ username: currentUsername });
    if (!currentUser) {
      currentUser = new User({ username: currentUsername });
    }

    const isFriend = currentUser.friends.some(friend => 
      friend.username === targetUsername && friend.status === 'accepted'
    );

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

    // Get or create current user's profile
    let currentUser = await User.findOne({ username: currentUsername });
    if (!currentUser) {
      currentUser = new User({ username: currentUsername });
    }

    // Find and remove the friend request
    const requestIndex = currentUser.friendRequests.findIndex(r => 
      r.from === currentUsername && r.to === username && r.status === 'pending'
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    // Remove from current user
    currentUser.friendRequests.splice(requestIndex, 1);

    // Remove from target user
    const targetUser = await User.findOne({ username });
    if (targetUser) {
      const targetRequestIndex = targetUser.friendRequests.findIndex(r => 
        r.from === currentUsername && r.to === username && r.status === 'pending'
      );
      if (targetRequestIndex !== -1) {
        targetUser.friendRequests.splice(targetRequestIndex, 1);
        await targetUser.save();
      }
    }

    await currentUser.save();

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

    // Get or create current user's profile
    let currentUser = await User.findOne({ username: currentUsername });
    if (!currentUser) {
      currentUser = new User({ username: currentUsername });
    }

    // Find and remove the friend request (received)
    const requestIndex = currentUser.friendRequests.findIndex(r => 
      r.from === username && r.to === currentUsername && r.status === 'pending'
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    // Remove from current user (receiver)
    currentUser.friendRequests.splice(requestIndex, 1);

    // Remove from sender user
    const senderUser = await User.findOne({ username });
    if (senderUser) {
      const senderRequestIndex = senderUser.friendRequests.findIndex(r => 
        r.from === username && r.to === currentUsername && r.status === 'pending'
      );
      if (senderRequestIndex !== -1) {
        senderUser.friendRequests.splice(senderRequestIndex, 1);
        await senderUser.save();
      }
    }

    await currentUser.save();

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

module.exports = router;
