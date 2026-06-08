const Product = require('../models/Product');
const Category = require('../models/Category');
const logger = require('../config/logger');
const { log } = require('winston');

//Get /api/products - List all products with optional filters
const getAllProducts = async (req, res) => {
    try {
        const { category_id, minPrice, maxPrice, search } = req.query;
        logger.info(`Fetching products - filters: ${JSON.stringify(req.query)}`);

        const products = await Product.findAll({ category_id, minPrice, maxPrice, search });
        logger.info(`Returned ${products.length} products`);
        res.json({count: products.length, products});
    } catch (error) {
        logger.error('Error fetching products:', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Internal server error' });   
    }
};

//Get /api/products/:id - Get a single product
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info(`Fetching product with ID: ${id}`);

        const product = await Product.findById(id);

        if (!product) {
            logger.warn(`Product not found with ID: ${id}`);
            return res.status(404).json({ message: 'Product not found' });
        }
        
        logger.info(`Product found: ${product.name} (ID: ${product.id})`);
        res.json({ product });
    } catch (error) {
        logger.error('Error fetching product', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Internal server error' });
    }
};

// POST /api/products - Create a new product (admin only)
const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category_id, image_url } = req.body;
        logger.info(` Admin ${req.user.id} Creating product - Name: ${name}`);

        // Validate required fields
        if (!name || !price) {
            logger.warn('Product creation failed - missing name or price');
            return res.status(400).json({ message: 'Name and price are required' });
        }

        if (price <= 0) {
            logger.warn(`Product creation failed - invalid price value: ${price}`);
            return res.status(400).json({ message: 'Price must be a greater than zero' });
        }

        //Verify category exists if category_id is provided
        if (category_id) {
            const category = await Category.findById(category_id);
            if (!category) {
                logger.warn(`Product creation failed - category not found with ID: ${category_id}`);
                return res.status(400).json({ message: 'Category not found' });
            }
        }

        const productId = await Product.create({ name, description, price, stock, category_id, image_url });
        logger.info(`Product created successfully with ID: ${productId} by admin ${req.user.id}`);
        res.status(201).json({ message: 'Product created successfully', productId });
    } catch (error) {
        logger.error('Error creating product', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Internal server error' });
    }
};

// PUT /api/products/:id - Update a product (admin only)
const updateProduct = async (req, res) => {
    try {
        const id = req.params;
        logger.info(`Admin ${req.user.id} Updating product with ID: ${id}`);

        const product = await Product.findById(id);
        if (!product) {
            logger.warn(`Product not found with ID: ${id} for update`);
            return res.status(404).json({ message: 'Product not found' });
        }

        //Merge existing values with updates so partial updates are possible
        const updated = {
            name: req.body.name ?? product.name,
            description: req.body.description ?? product.description,
            price: req.body.price ?? product.price,
            stock: req.body.stock ?? product.stock,
            category_id: req.body.category_id ?? product.category_id,
            image_url: req.body.image_url ?? product.image_url,
            is_active: req.body.is_active ?? product.is_active
        };

        await Product.update(id, updated);

        logger.info(`Product with ID: ${id} updated successfully by admin ${req.user.id}`);
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        logger.error('Error updating product', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Internal server error' });
    }
};

//DELETE /api/products/:id - Soft delete a product (admin only)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info(`Admin ${req.user.id} Deleting product with ID: ${id}`);

        const product = await Product.findById(id);
        if (!product) {
            logger.warn(`Product not found with ID: ${id} for deletion`);
            return res.status(404).json({ message: 'Product not found' });
        }

        await Product.delete(id);

        logger.info(`Product with ID: ${id} deleted successfully by admin ${req.user.id}`);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        logger.error('Error deleting product', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Internal server error' });
    }
};

//GET /api/product/categories - List all categories
const getAllCategories = async (req, res) => {
    try {
        logger.info('Fetching all categories');
        const categories = await Category.findAll();
        logger.info(`Returned ${categories.length} categories`);
        res.json({ count: categories.length, categories });
    } catch (error) {
        logger.error('Error fetching categories', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Internal server error' });
    }
};

//POST /api/products/categories - create a category (admin only)
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        logger.info(`Admin ${req.user.id} Creating category - Name: ${name}`);

        if (!name) {
            logger.warn('Category creation failed - missing name');
            return res.status(400).json({ message: 'Category name is required' });
        }

        const categoryId = await Category.create({ name, description });

        logger.info(`Category created successfully with ID: ${categoryId} by admin ${req.user.id}`);
        res.status(201).json({ message: 'Category created successfully', categoryId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            logger.warn(`Category creation failed - duplicate name: ${req.body.name}`);
            return res.status(400).json({ message: 'Category name already exists' });
        }
        logger.error('Error creating category', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getAllCategories,
    createCategory
};

