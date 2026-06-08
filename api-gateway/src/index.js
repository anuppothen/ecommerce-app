const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
dotenv.config();

const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { authProxy, productProxy, cartProxy, orderProxy } = require('./routes/proxy');


const app = express();

// -- Security & Parsing ---------------------------
// Helmet adds a bunch of HTTP headers that protect against common attacks
app.use(helmet());

// CORS - tells browsers to allow requests from your React app
app.use(cors({
    origin: 'http://localhost:5173', //Site's default port
    method: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// -- Logging & Rate Limiting -----------------------
app.use(requestLogger);
app.use(generalLimiter);

// -- Health Check ----------------------------------
app.get('/health', (req, res) => {
    logger.info('Gateway health check pinged');
    res.json({
        status: 'API Gateway is running!',
        services: {
            auth: process.env.AUTH_SERVICE_URL,
            products: process.env.PRODUCT_SERVICE_URL,
            cart: process.env.CART_SERVICE_URL,
            orders: process.env.ORDER_SERVICE_URL
        }
    });
});

// -- Routes ----------------------------------------
// Auth gets the stricter rate limiter to prevent brute force
app.use('/api/auth', authLimiter, authProxy);

//All other services use the general limiter
app.use('/api/products', productProxy);
app.use('/api/cart', cartProxy);
app.use('/api/orders', orderProxy);

// -- Error Handling ---------------------------------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT}`);
    logger.info(`AuthService -> ${process.env.AUTH_SERVICE_URL}`);
    logger.info(`Product Service -> ${process.env.PRODUCT_SERVICE_URL}`);
    logger.info(`Cart Service -> ${process.env.CART_SERVICE_URL}`);
    logger.info(`Order Service -> ${process.env.ORDER_SERVICE_URL}`);
});