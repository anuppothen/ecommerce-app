const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn(`Unauthorized access to ${req.originalUrl} - no token provided`);
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.debug(`Token verified for user ${decoded.id} accessing ${req.originalUrl}`);
        req.user = decoded; // Attach user info to request object
        next();
    } catch (error) {
        logger.warn(`Unauthorized access to ${req.originalUrl} - invalid or expiredtoken - ${error.message}`);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        logger.warn(`Forbidden access to ${req.originalUrl} - user ${req.user.id} does not have admin privileges`);
        return res.status(403).json({ message: 'Admin privileges required' });
    }
    logger.debug(`Admin access granted for user ${req.user.id} to ${req.originalUrl}`);
    next();
};

module.exports = { protect, adminOnly };
