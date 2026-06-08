const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const authRoutes = require('./routes/authRoutes');
const { log } = require('winston');

const app = express();

//Middleware to parse JSON bodies
app.use(express.json());
app.use(requestLogger); //Log every incoming request

//Handle unrecognized JSON (malformed JSON in request body)
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        logger.warn(`Invalid JSON received on ${req.originalUrl} - ${err.message}`);
        return res.status(400).json({ message: 'Invalid JSON in request body' });
    }
    next(err);
});

//Health check -useful to confirm the sevice is running
app.get('/health', (req, res) => {
    logger.info('Health check endpoint pinged');
    res.json({status: 'Auth Service is running'});
});

//Mount auth routes at /api/auth
app.use('/', authRoutes);
// app.use('/', authRoutes);

//catch-all for unhandled routes
app.use((req, res) => {
    logger.warn(`404 - Route Not Found - ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: 'Route not found' });
});

//Global error handler (catches any errors that weren't handled by route handlers)
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', { error: err.message, stack: err.stack });
    res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    logger.info(`Auth Service running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Auth Service running on port ${PORT}`);
});