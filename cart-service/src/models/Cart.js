const redis = require('../config/redis');
const logger = require('../config/logger');

// How long a cart lives in Redis without activity (from .env)
const CART_EXPIRY = parseInt(process.env.CART_EXPIRY_SECONDS) || 604800;

// Helper - builds the Redis key for a user's cart
// eg. userId 42 -> "cart:user:42"

const getCartKey = (userId) => `cart:user:${userId}`;

const Cart = {
    // Get the current cart for the user
    // Return an object with an items array, or an empty cart if none exists
    async getCart(userId) {
        const key = getCartKey(userId);
        logger.debug(`Getting cart for user: ${userId}`);

        //Redis GET - retrieves the value stored at this key
        const cartData = await redis.get(key);

        // If no cart exists yet, return an empty one
        if (!cartData) {
            logger.debug(`No cart found for user: ${userId} - returning an empty cart`);
            return { items: [], total: 0 };
        }

        //Redis stores everything as strings, so we parse it back to an object
        return JSON.parse(cartData);
    },

    //Save the cart back to Redis
    //EX means "Expiry after X seconds" - resets the timer every time the cart is updated

    async saveCart(userId, cart) {
        const key = getCartKey(userId);

        // Redis SET with EX (expiry) - stores the cart as a JSON string
        await redis.set(key, JSON.stringify(cart), 'EX', CART_EXPIRY);
        logger.debug(`Cart saved for user: ${userId} - expires in ${CART_EXPIRY}s`);

        return cart;
    },

    //Add an item to the cart or increase quantity if it already exists
    async addItem(userId, product) {
        logger.debug(`Adding product ${product.productId} to cart for user: ${userId}`);

        //Get the existing cart first
        const cart = await this.getCart(userId)

        //Check if this product is already in the cart
        const existingItem = cart.items.find(item => item.productId === product.productId);

        if (existingItem) {
            //Product already in cart - just increase the quantity
            existingItem.quantity += product.quantity;
            logger.debug(`Product ${product.productId} already in cart - updated quantity to ${existingItem.quantity}`);
        } else {
            //New product - add it to the items array
            cart.items.push({
                productId: product.productId,
                name: product.name,
                price: product.price,
                quantity: product.quantity,
                imageUrl: product.imageUrl
            });
            logger.debug(`New product ${product.productId} added to the cart`);
        }

        //Recalculate the total price
        cart.total = this.calculateTotal(cart.items);

        //Save updated cart back to Redis
        return await this.saveCart(userId, cart);
    },

    //Update the quantity of a specific item
    async updateItem(userId, productId, quantity){
        logger.debug(`Updating product ${productId} quantity to ${quantity} for user: ${userId}`);

        const cart = await this.getCart(userId);

        //Find the item in the cart
        const itemIndex = cart.items.find(item => item.productId === productId);
        
        if (itemIndex === -1) {
            logger.warn(`Product ${productId} not found in cart for user: ${userId}`);
            return null; //Item not in cart
        }

        if (quantity <= 0) {
            //If quantity is set to 0 or less, remove item entirely
            cart.items.splice(itemIndex, 1);
            logger.debug(`Product ${productId} removed from the cart - quantity set to ${quantity}`);
        } else {
            //Otherwise update the quantity
            cart.items[itemIndex].quantity = quantity;
        }

        cart.total = this.calculateTotal(cart.items);
        return await this.saveCart(userId, cart);
    },

    //Remove s specific item from the cart completely
    async removeItem(userId, productId) {
        const cart = await this.getCart(userId);
        const initialLength = cart.items.length;

        //Filter out the item we want to remove
        cart.items = cart.items.filter(item => item.productId !== productId);

        if (cart.items.length === initialLength) {
            logger.warn(`Product ${productId } not found in cart for the user: ${userId}`);
            return null; //Nothing was removed
        }

        cart.total = this.calculateTotal(cart.items);
        return await this.saveCart(userId, cart);
    },

    // Clear the entire cart
    async clearCart(userId) {
        const key = getCartKey(userId);
        logger.debug(`Clearing cart for the user: ${userId}`);

        //Redis DEL - completely removes the key from Redis
        await redis.del(key);
        logger.info(`Cart cleared for user: ${userId}`);
        return { items: [], total: 0 };
    },

    //Calculate the total price of all items in the cart
    calculateTotal(items) {
        const total = items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);            
        }, 0);

        //Round to 2 decimal places to avoid floating point issues
        //eg. 0.1 + 0.2 = 0.3000000000004 in Javascript with this
        return Math.round(total * 100) / 100;
    }
};

module.exports = Cart;

