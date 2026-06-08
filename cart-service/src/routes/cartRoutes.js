const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCart, addItem, updateItem, removeItem, clearCart } = require('../controllers/cartController');

// All cart routes require then user to be logged in
// protect middleware runs first on every route below

router.use(protect);

// GET /api/cart - get the current user's cart
router.get('/', getCart);

// POST /api/cart/items - add an item to the cart
router.post('/items', addItem);

// PUT /api/cart/items/:productId - update the quantity of an item
router.put('/items/:productId', updateItem);

// DELETE //api/cart/items/:productId - remove a specific item
router.delete('/items/:productId', removeItem);

// DELETE /api/cart - clear the entire cart
router.delete('/', clearCart);

module.exports = router;