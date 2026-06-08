const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const register = async (req, res) => {
    const { name, email, password } = req.body;
    logger.info(`Attempting to register user with email: ${email}`);

    try {
        //Validate input
        if (!name || !email || !password) {
            logger.warn(`Registration failed - Missing required fields`);
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        if (password.length < 6) {
            logger.warn(`Registration failed - Password too short for email: ${email}`);
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
            
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            logger.warn(`Registration failed - Email already in use: ${email}`);
            return res.status(400).json({ message: 'Email already in use' });
        }

        logger.debug(`Hashing password for email: ${email}`);
        const hashedPassword = await bcrypt.hash(password, 12);

        //Save user
        const userId = await User.create({ name, email, password: hashedPassword });

        // Create JWT token
        const token = jwt.sign(
            { id: userId, email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        logger.info(`User registered successfully - ID: ${userId}, email: ${email}`);
        res.status(201).json({ message: 'User created!', token });
    } catch (error) {
        logger.error('Error during user registration:', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    logger.info(`Attempting to log in user with email: ${email}`);
    
    try {
        //Validate input
        if (!email || !password) {
            logger.warn(`Login failed - Missing email or password`);
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            logger.warn(`Login failed - User not found for email: ${email}`);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            logger.warn(`Login failed - Incorrect password for email: ${email}`);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        //Create JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        logger.info(`User logged in successfully - ID: ${user.id}, email: ${email}`);
        res.json({ message: 'Login successful', token });
    } catch (error) {
        logger.error('Unexpected error during user login:', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getProfile = async (req, res) => {
    logger.info(`Profile request for user ID: ${req.user.id}`);
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            logger.warn(`Profile not found for user ID: ${req.user.id}`);
            return res.status(404).json({ message: 'User not found' });
        }

        logger.info(`Profile retrieved successfully for user ID: ${req.user.id}`);
        res.json({ user });
    } catch (error) {
        logger.error('Unexpected error fetching profile:', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { register, login, getProfile };
