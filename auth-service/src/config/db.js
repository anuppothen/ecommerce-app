const mysql2 = require('mysql2/promise');
const logger = require('./logger');
require('dotenv').config();


const pool = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, //Maximum number of simultaneous connections
});

//Test the connection when the service starts
pool.getConnection()
    .then(connection => {
        logger.info('MySQL database connected successfully');
        connection.release(); //Release the connection back to the pool
    })
    .catch(error => {
        logger.error('Failed to connect to MySQL database:', { error: err.message });
        process.exit(1); //Exit the service if we can't connect to the database
    });

module.exports = pool;