const winston = require('winston');

//Define log formats

const { combine, timestamp, printf, colorize, errors } = winston.format;

//Custom format: [2024-06-01 12:00:00] INFO: User registered successfully
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',  //Log 'info' and above by default

    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }), //Log full stack trace for errors
        logFormat
    ),

    transports: [
        // 1. Console - shows logs in your terminal with colors for better readability
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }), //Green for info, yellow for warn, red for error
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                errors({ stack: true }),
                logFormat
            )
        }),

        // 2. File - saves all logs to a file (userful for debugging later)
        new winston.transports.File({
            filename: 'logs/combined.log',
        }),

        // 3. File - saves only error logs to a separate file
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
        }),
    ],
});

module.exports = logger; 