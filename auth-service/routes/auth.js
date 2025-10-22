const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    fieldSize: 10 * 1024 * 1024, // 10MB for text fields
    fieldNameSize: 100,
    fields: 10,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Register new user (with file upload)
router.post('/register', (req, res) => {
  console.log('Register request received');
  console.log('Content-Type:', req.headers['content-type']);
  
  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        success: false, 
        message: 'File upload error: ' + err.message 
      });
    }
    
    console.log('Multer processing completed');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? 'File present' : 'No file');
    
    try {
      const { username, email, password, fullName, dateOfBirth } = req.body;

      // Validate input
      if (!username || !email || !password || !fullName || !dateOfBirth) {
        return res.status(400).json({ 
          success: false, 
          message: 'All fields are required' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be at least 6 characters long' 
        });
      }

      // Validate email format
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please enter a valid email address' 
        });
      }

      // Validate date of birth
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13) {
        return res.status(400).json({ 
          success: false, 
          message: 'You must be at least 13 years old to register' 
        });
      }

      // Check if user already exists (username or email)
      const existingUser = await User.findOne({ 
        $or: [{ username }, { email }] 
      });
      if (existingUser) {
        const field = existingUser.username === username ? 'username' : 'email';
        return res.status(400).json({ 
          success: false, 
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` 
        });
      }

      // Upload avatar to Cloudinary if provided
      let avatarUrl = null;
      if (req.file) {
        try {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                resource_type: 'image',
                folder: 'chat-app-avatars',
                transformation: [
                  { width: 200, height: 200, crop: 'fill', gravity: 'face' }
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(req.file.buffer);
          });
          avatarUrl = result.secure_url;
        } catch (uploadError) {
          console.error('Avatar upload error:', uploadError);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to upload avatar' 
          });
        }
      }

      // Create new user
      const user = new User({ 
        username, 
        email, 
        password, 
        fullName, 
        dateOfBirth: birthDate,
        avatar: avatarUrl
      });
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            dateOfBirth: user.dateOfBirth,
            avatar: user.avatar,
            createdAt: user.createdAt
          }
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  });
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Validate input
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username/Email and password are required' 
      });
    }

    // Find user by username or email
    const user = await User.findOne({ 
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          dateOfBirth: user.dateOfBirth,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Verify token endpoint
router.get('/verify', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user
    }
  });
});

module.exports = { router, verifyToken };
