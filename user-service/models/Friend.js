const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  user1: {
    type: String,
    required: true,
    trim: true
  },
  user2: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date,
    default: null
  }
});

// Ensure unique friendship pairs
friendSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Helper method to check if two users are friends
friendSchema.statics.areFriends = async function(username1, username2) {
  const friendship = await this.findOne({
    $or: [
      { user1: username1, user2: username2 },
      { user1: username2, user2: username1 }
    ],
    status: 'accepted'
  });
  return !!friendship;
};

// Helper method to get all friends of a user
friendSchema.statics.getFriends = async function(username) {
  const friendships = await this.find({
    $or: [
      { user1: username },
      { user2: username }
    ],
    status: 'accepted'
  });
  
  return friendships.map(friendship => 
    friendship.user1 === username ? friendship.user2 : friendship.user1
  );
};

// Helper method to get pending friend requests
friendSchema.statics.getPendingRequests = async function(username) {
  return await this.find({
    $or: [
      { user1: username, status: 'pending' },
      { user2: username, status: 'pending' }
    ]
  });
};

module.exports = mongoose.model('Friend', friendSchema);
