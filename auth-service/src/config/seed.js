const bcrypt = require('bcryptjs');
const db = require('./db');
const logger = require('./logger');

const seedAdminUser = async () => {
    try {
        const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

        // Skip seeding if env variables aren't set
        if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
            logger.warn('Admin seed skipped - ADMIN_NAME, ADMIN_EMAIL or ADMIN_PASSWORD not set in .env');
            return;
        }

        // Check if admin already exists
        const [existingAdmins] = await db.query(
            "SELECT id from users WHERE role = 'admin' LIMIT 1"
        );

        if (existingAdmins.length > 0) {
            logger.info('Admin user already exists - skipping seed');
            return;
        }

        // Check if the email is already taken by a non-admin user
        const [existingUser] = await db.query(
            'SELECT id from users WHERE email = ?',
            [ADMIN_EMAIL]
        );

        if (existingUser.length > 0) {
            //Promote existing user to admin instead of creating a new one
            await db.query(
                "UPDATE users SET role = 'admin' WHERE email = ?",
                [ADMIN_EMAIL]
            );
            logger.info('Existing user ${ADMIN_EMAIL} promoted to admin');
            return;
        }

        // Hash the admin password
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

        // Create the admin user
        await db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
            [ADMIN_NAME, ADMIN_EMAIL, hashedPassword]
        );

        logger.info('Admin user created successfully - email: ${ADMIN_EMAIL}');
    } catch (error) {
        logger.error('Failed to seed admin user', { error: error.message });
    }
};

module.exports = seedAdminUser;