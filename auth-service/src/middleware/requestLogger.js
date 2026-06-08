const { log } = require('winston');
const logger = require('../config/logger');

//Logs every HTTP request that hits your service
const requestLogger = (req, res, next) => {
    const start = Date.now(); //Record when request started

    //Wait until response if finished, the log it
    res.on('finish', () => {
        const duration = Date.now() - start; //Calculate how long it took to process the request
        const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

        //Use different log levels based on status code
        if (res.statusCode >= 500) {
            logger.error(logMessage); //Server errors
        } else if (res.statusCode >= 400) {
            logger.warn(logMessage); //Client errors (bad requests, unauthorized, etc.)
        } else {
            logger.info(logMessage); //Successful requests
        }
    });

    next();
};

module.exports = requestLogger;
