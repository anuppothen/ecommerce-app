const Redis = require('ioredis');
const logger = require('./logger');
require('dotenv').config();

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379, 

    //Automatically try to connect if connection drops
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection lost - retrying in ${delay}ms (attempt ${times})`)
        return delay;
    },
});

//Fires when successfully connected
redis.on('connect', () => {
    logger.info('Redis connected successfully');
});
//Fires if connection fails completely
redis.on('error', (err) => {
    logger.error(`Redis connection error: ${err.message}`);
});

module.exports = redis;
