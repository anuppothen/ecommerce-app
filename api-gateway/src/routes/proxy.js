const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('../config/logger');

//Factory function that creates a proxy for a given service
const createProxy = (serviceUrl, serviceName, pathPrefix) => {
    return createProxyMiddleware({
        target: serviceUrl,
        changeOrigin: true, //Rewrite the host header to match the target

        //Log every request being proxied
        on: {
            proxyReq: (proxyReq, req) => {
                logger.debug(`-> Proxying ${req.method} ${req.originalUrl} to ${serviceName} at ${serviceUrl}`);
            },

            //Log every response coming back
            proxyRes: (proxyRes, req) => {
                logger.debug(`<- ${serviceName} responded with ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
            },

            //Log proxy errprs (eg. service is down)
            error: (err, req, res) => {
                logger.error(`Proxy error for ${serviceName}: ${err.messaage}`);
                
                //Send a clean error if the service is unreachable
                if (!res.headerSent) {
                    res.status(503).json({
                        message: `${serviceName} is temporarily unavailable.`
                    });
                }
            },
        }
    });
};

//Create a proxy for each microservice
const authProxy = createProxy(process.env.AUTH_SERVICE_URL, 'Auth Service');
const productProxy = createProxy(process.env.PRODUCT_SERVICE_URL, 'Product Service');
const cartProxy = createProxy(process.env.CART_SERVICE_URL, 'Cart Service');
const orderProxy = createProxy(process.env.ORDER_SERVICE_URL, 'Order Service');

module.exports = { authProxy, productProxy, cartProxy, orderProxy };