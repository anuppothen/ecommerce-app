const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn(`Unauthorized request to ${req.originalUrl} - no token provided`);
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.debug(`Token verified for user ID: ${decoded.id}`);
        req.user = decoded;
        next();
    } catch (error) {
        logger.warn(`Invalid or expired token - ${error.message}`);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = { protect };