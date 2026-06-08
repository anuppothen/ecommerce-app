const mysql2 = require('mysql2/promise');
const logger = require('./logger');
require('dotenv').config();

const pool = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

pool.getConnection()
    .then(connection => {
        logger.info('MySQL database connected successfully');
        connection.release();
    })
    .catch(error => {
        logger.error('Error connecting to MySQL database:', { error: error.message });
        process.exit(1);
    });

module.exports = pool;
