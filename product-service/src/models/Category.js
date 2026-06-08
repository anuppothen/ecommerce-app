const db = require('../config/db');
const logger = require('../config/logger');

const Category = {
    async findAll(){
        logger.debug('Fetching all categories');
        const [rows] = await db.query('SELECT * FROM categories ORDER BY name ASC');
        return rows;
    }, 

    async findById(id){
        logger.debug(`Fetching category with ID: ${id}`);
        const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
        return rows[0];
    }, 

    async create({ name, description }) {
        logger.debug(`Creating category: ${name}`);
        const [result] = await db.query(
            'INSERT INTO categories (name, description) VALUES (?, ?)', 
            [name, description]
        );
        logger.info(`Category created with ID: ${result.insertId}`);
        return result.insertId;
    },
};

module.exports = Category;