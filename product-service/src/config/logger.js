const winston = require('winston');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logformat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${stack || message}`;
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logformat
    ),
    transports: [
        new winston.transports.Console({
            format: combine(
                colorize({ all: true}),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                errors({ stack: true }),
                logformat
            ),
        }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    ],
});
module.exports = logger;
