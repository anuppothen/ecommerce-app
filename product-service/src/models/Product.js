const { log } = require('winston');
const db = require('../config/db');
const logger = require('../config/logger');

const Product = {
    // Get all active products (with their category names joined in)
    async findAll({ category_id, minPrice, maxPrice, search } = {}) {
        let query = `
        SELECT p.*, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = TRUE
        `;
        const params = [];

        //Dynamically add filters if provided
        if (category_id) {
            query += ' AND p.category_id = ?';
            params.push(category_id);
        }

        if (minPrice) {
            query += ' AND p.price >= ?';
            params.push(minPrice);
        }

        if (maxPrice) {
            query += ' AND p.price <= ?';
            params.push(maxPrice);
        }

        if (search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += 'ORDER BY p.created_at DESC';

        logger.debug(`Fetching products with filters: ${JSON.stringify({ category_id, minPrice, maxPrice, search })}`);
        const [rows] = await db.query(query, params);
        return rows;
    },

    // Get a single product by ID (with category name)
    async findById(id) {
        logger.debug(`Fetching product with ID: ${id}`);
        const [rows] = await db.query(`
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ? AND p.is_active = TRUE
            `, [id]
        );
        return rows[0];
    },

    // Create a new product
    async create({ name, description, price, stock, category_id, image_url }) {
        logger.debug(`Creating product: ${name}`);
        const [result] = await db.query(`
            INSERT INTO products (name, description, price, stock, category_id, image_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [name, description, price, stock, category_id, image_url]
        );
        logger.info(`Product created with ID: ${result.insertId}`);
        return result.insertId;
    }, 

    // Update an existing product
    async update(id, { name, description, price, stock, category_id, image_url, is_active }) {
        logger.debug(`Updating product with ID: ${id}`);
        const result = await db.query(`
            UPDATE products
            SET name = ?, description = ?, price = ?, stock = ?, 
            category_id = ?, image_url = ?, is_active = ?
            WHERE id = ?
        `, [name, description, price, stock, category_id, image_url, is_active, id]
        );
        logger.info(`Product with ID: ${id} updated`);
        return result.affectedRows > 0;
    },

    // Soft delete - sets is_active to FALSE rather than deleteing the row
    // This preserves order history that references this product
    async delete(id) {
        logger.debug(`Soft deleting product with ID: ${id}`);
        const result = await db.query(`
            UPDATE products
            SET is_active = FALSE
            WHERE id = ?
        `, [id]
        );
        logger.info(`Product with ID: ${id} soft deleted`);
        return result.affectedRows > 0;
    },
};

module.exports = Product;