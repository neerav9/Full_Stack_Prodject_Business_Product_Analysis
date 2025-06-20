const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Correctly returns 401 for missing token
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Changed from 403 to 401 for invalid/expired token
      return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;