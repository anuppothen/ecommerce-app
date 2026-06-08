const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

//General limiter - applies to all routes
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, //Max 100 requests per windows
    message: { message: 'Too many request, please try again later' },
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceed for IP: ${req.ip} on ${req.originalUrl}`);
        res.status(429).json(options.message);
    },
    standardHeaders: true, //Return rate limit info in headers
    legacyHeaders: false, //Disable X-RateLimit headers
});

//Stricter limiter for auth routes - prevent brute-force attacks
// eg. someone trying to guess passwords by sending many login requests
const authLimiter = rateLimit({
    windowMs: 900000, // 15 minutes
    max: 20, //Max 20 requests per window for auth routes
    message: { message: 'Too many login attempts, please try again later' },
    handler: (req, res, next, options) => {
        logger.warn(`Auth rate limit exceed for IP: ${req.ip} on ${req.originalUrl}`);
        res.status(429).json(options.message);
    }, 
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { generalLimiter, authLimiter };