const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  friends: [{
    username: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      default: 'pending'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  friendRequests: [{
    from: {
      type: String,
      required: true
    },
    to: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to get accepted friends
userSchema.methods.getAcceptedFriends = function() {
  return this.friends.filter(friend => friend.status === 'accepted');
};

// Method to get pending friend requests
userSchema.methods.getPendingRequests = function() {
  return this.friendRequests.filter(request => request.status === 'pending');
};

module.exports = mongoose.model('User', userSchema);
