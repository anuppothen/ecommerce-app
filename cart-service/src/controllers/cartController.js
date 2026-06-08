const Cart = require('../models/Cart');
const axios = require('axios');
const logger = require('../config/logger');
const { remove } = require('winston');

// Helper - fetches the product details from the product service
// We need this to verify that the product exists and get its current price

const getProductDetails = async(productId) => {
    try {
        const response = await axios.get(
            `${process.env.PRODUCT_SERVICE_URL}/${productId}`
        );
        return response.data.product;
    } catch (error) {
        //If product service returns 404, then the product does not exist
        if(error.response?.status === 404){
            return null;
        }
        // Any other errror means the product service is down 
        throw new Error('Product service unavailable');
    }
};

const getCart = async (req, res) => {
    try {
        logger.info(`Getting cart for user: ${req.user.id}`);

        const cart = await Cart.getCart(req.user.id);
        logger.info(`Cart retrieved for user: ${req.user.id} - ${cart.items.length} items`);
        res.json({ cart });
    } catch (error){
        logger.error('Error getting cart', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Server Error' });
    }
};

//POST /api/cart/items
// Adds a product to the cart
const addItem = async (req, res) => {
    try{
        const { productId, quantity = 1 } = req.body;
        logger.info(`User ${req.user.id} adding product ${productId} to cart`);

        //Validate inputs
        if (!productId) {
            logger.warn('Add item failed - no productId provided.');
            return res.status(400).json({message: 'productId is required'});
        }

        if (quantity < 1) {
            logger.warn(`Add item failed - invalid quantity ${quantity}`);
            return res.status(400).json({message: 'Quantity must be at least 1'});
        }

        // Verify product exists and get its details from the product service
        // We always fetch fresh details so price is always current
        logger.debug(`Fetching product ${productId} from product service`);
        const product = await getProductDetails(productId);

        if (!product) {
            logger.warn(`Add item failed - product ${productId} not found`);
            return res.status(404).json({ message: 'Product not found' });
        }

        //Check product has enough stock
        if (product.stock < quantity) {
            logger.warn(`Add item failed - insufficient stock for product ${productId}`);
            return res.status(400).json({
                message: `Only ${product.stock} items left in stock`
            });
        }

        // Add item to cart
        const updatedCart = await Cart.addItem(req.user.id, {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            imageUrl: product.image_url
        });

        logger.info(`Product ${productId} added to cart for user: ${req.user.id}`);
        res.status(201).json({ message: 'Item added to cart', cart: updatedCart });
    } catch (error) {
        //Handle product service being down gracefully
        if (error.message === 'Product service unavailable') {
            logger.error('Product service unavailable when adding to cart');
            return res.status(503).json({ message: 'Product service unavailable' });
        }
        logger.error('Error adding item to cart', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/cart/items/:productId
// Updates the quantity of an item already in the cart
const updateItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        logger.info(`User ${req.user.id} updated product ${productId} quantity to ${quantity}`);

        //Validate quantity
        if (quantity === undefined || quantity === null ) {
            logger.warn(`Update item failed - no quanity provided`);
            return res.status(400).json({ message: 'Quantity is required' });
        }

        if (quantity < 0) {
            logger.warn(`Update item failed - negative quantity: ${quantity}`);
            return res.status(400).json({ message: 'Quantity cannot be negative' });
        }

        // If quantity > 0, check stock is sufficient
        if (quantity > 0) {
            const product = await getProductDetails(parseInt(productId));
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            if (product.stock < quantity) {
                return res.status(400).json({
                    message: `Only ${product.stock} items left in stock`
                });
            }
        }

        const updatedCart = await Cart.updateItem(req.user.id, parseInt(productId), quantity);

        if (!updatedCart) {
            logger.warn(`Update failed - product ${productId} not in cart for user: ${req.user.id}`);
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        logger.info(`Cart item updated for user: ${req.user.id}`);

        // If quantity was 0 the item was removed - send a helful message
        const message = quantity === 0 ? 'Item removed from cart' : 'Cart updated!';
        res.json({ message, cart: updatedCart });
    } catch (error) {
        if (error.messagae === 'Product service unavailable') {
            return res.status(503).json({ message: 'Product service unavailable' });
        }
        logger.error('Error updating cart item', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/cart/items/:productId
//Removes a specific item from the cart
const removeItem = async (req, res) => {
    try{
        const { productId } = req.params;
        logger.info(`User ${req.user.id} removing product ${productId} from cart`);

        const updatedCart = await Cart.removeItem(req.user.id, parseInt(productId));

        if (!updatedCart) {
            logger.warn(`Remove failed - product ${productId} not found in the cart for user ${req.user.id}`);
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        logger.info(`Product ${productId} removed from cart for user ${req.user.id}`);
        res.json({ message: 'Item removed from cart!', cart: updatedCart });
    } catch (error) {
        logger.error('Error removing cart item', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/cart
// Clears the entire cart
const clearCart = async (req, res) => {
    try {
        logger.info(`User ${req.user.id} clearing their cart`);
        const emptyCart = await Cart.clearCart(req.user.id);
        logger.info('Cart cleared for user: ${req.user.id}');
        res.json({ message: 'Cart cleared!', cart: emptyCart });
    } catch (error) {
        logger.error('Error clearing cart', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };

