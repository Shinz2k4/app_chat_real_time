const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    trim: true
  },
  receiver: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    default: '',
    trim: true,
    maxlength: 1000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  attachmentUrl: {
    type: String,
    default: null
  },
  attachmentName: {
    type: String,
    default: null
  },
  attachmentSize: {
    type: Number,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

// Index for efficient querying
messageSchema.index({ sender: 1, receiver: 1, timestamp: -1 });
messageSchema.index({ receiver: 1, sender: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);
