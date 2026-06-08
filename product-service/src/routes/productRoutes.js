const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getAllCategories,
    createCategory,
} = require('../controllers/productController');

// - Category Routes -------------------------
router.get('/categories', getAllCategories); //Public route to list categories
router.post('/categories', protect, adminOnly, createCategory); //Admin only route to create category

// - Product Routes -------------------------
router.get('/', getAllProducts); //Public route to list products with optional filters
router.get('/:id', getProductById); //Public route to get product details by ID
router.post('/', protect, adminOnly, createProduct); //Admin only route to create a new product
router.put('/:id', protect, adminOnly, updateProduct); //Admin only route to update a product
router.delete('/:id', protect, adminOnly, deleteProduct); //Admin only route to delete a product (soft delete)

module.exports = router;