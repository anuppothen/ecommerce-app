const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

//This runs before 
const protect = (req, res, next) => {
    // 1. Get the token from the request header
    // Tokens are sent like: "Authorization: Bearer eyJhbGci...."
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn(`Unauthorized request to ${req.originalUrl} - No token provided`);
        return res.status(401).json({ message: 'No token provided, authorization denied' });``
    }

    const token = authHeader.split(' ')[1]; //Get the actual token part

    try {
        // 2. Verify the token is valid and not expired
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.debug(`Token verified successfully for user ID: ${decoded.id}, email: ${decoded.email}`);
        
        // 3. Attach user info to the request object (so controllers can access it)
        req.user = decoded; //Decoded token contains user ID, email, role, etc.

        // 4. Pass control to the next function (the actual route handler)
        next();
    } catch (error) {
        logger.warn(`Invalid or expired token for request to ${req.originalUrl} - ${error.message}`);
        res.status(401).json({ message: 'Invalid token, authorization denied' });
    }   
};

module.exports = { protect };