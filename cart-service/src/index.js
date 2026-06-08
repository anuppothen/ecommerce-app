const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const cartRoutes = require('./routes/cartRoutes');

//This import runs the Redis connection code immediately when the service starts
require('./config/redis');

const app = express();

//-- Middleware -----------------------------------------------
// Parse the incoming JSON request bodies
app.use(express.json());

// Log every request
app.use(requestLogger);

app.get('/health', (req, res) => {
    logger.info('Health check pinged');
    res.json({ status: 'Cart Service is running!' });
});

// -- Routes --------------------------------------------------
app.use('/', cartRoutes);

// -- Error Handling ------------------------------------------
// Unknown routes
app.use((req, res) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: 'Route not found' });
});

// Global error handler - catches anything unexpected
app.use((err, req, res, next) => {
    logger.error('Unhandled Error', { error: err.message, stack: err.stack });
    res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    logger.info(`Cart Service running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});