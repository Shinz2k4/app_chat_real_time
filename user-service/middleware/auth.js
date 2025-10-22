const axios = require('axios');

// Middleware to verify JWT token with auth service
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify token with auth service
    const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      req.user = response.data.data.user;
      next();
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

module.exports = { verifyToken };
