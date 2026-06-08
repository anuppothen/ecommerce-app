const db = require('../config/db');
const logger = require('../config/logger');

const User = {
    async findByEmail(email) {
        logger.debug(`Looking for user with email: ${email}`);
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if(rows[0]) {
            logger.debug(`User found with email: ${email}`);
        } else {
            logger.debug(`No user found with email: ${email}`);
        }

        return rows[0];
    },

    async create({ name, email, password}) {
        logger.debug(`Creating new user with email: ${email}`);
        const [result] = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, password]
        );
        logger.info(`New user created with email: ${email}, ID: ${result.insertId}`);
        return result.insertId; // Return the ID of the newly created user
    },

    async findById(id) {
        logger.debug(`Looking for user with ID: ${id}`);
        const [rows] = await db.query(
            'SELECT id, name, email, role FROM users WHERE id = ?', 
            [id]
        );
        logger.debug(`Found user with ID: ${id}`);
        return rows[0];
    },
};

module.exports = User;
