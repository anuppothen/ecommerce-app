const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const productRoutes = require('./routes/productRoutes');

const app = express();
app.use(express.json());
app.use(requestLogger);

app.get('/health', (req, res) => {
    logger.info('Health check endpoint pinged');
    res.json({ status: 'Product service is running' });
});

app.use('/', productRoutes);

//Unknown routes
app.use((req, res) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: 'Route not found' });
});

//Global error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    logger.info(`Product service running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});