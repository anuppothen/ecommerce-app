const logger = require('../config/logger');

//Handles errors thrown anywhere in the gateway
const errorHandler = (err, req, res, next) => {
    logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, {
        error: err.message, 
        stack: err.stack,
    });

    //If the target service is unreachable
    if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({
            message: 'Service temporarily unavailable. Please try again later.',
        });
    }

    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
    });
};

const notFound = (req, res) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({messaage: 'Route ${req.originalUrl} not found'});
    };

module.exports = { errorHandler, notFound };