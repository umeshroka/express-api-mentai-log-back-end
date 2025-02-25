const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  try {
    console.log("Token exists:", req.headers.authorization);
    const token = req.headers.authorization.split(' ')[1];
    console.log('Token:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded.payload;
    
    next();
  } catch (err) {
    res.status(401).json({ err: 'Invalid token.' });
  }
}

module.exports = verifyToken;
