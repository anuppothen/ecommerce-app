-- Create databases
CREATE DATABASE IF NOT EXISTS ecommerce_auth;
CREATE DATABASE IF NOT EXISTS ecommerce_products;

-- Give our user access to both databases
GRANT ALL PRIVILEGES ON ecommerce_auth.* to 'ecommerce_user'@'%';
GRANT ALL PRIVILEGES ON ecommerce_products.* to 'ecommerce_user'@'%';
FLUSH PRIVILEGES;

-- Auth Database ------------------
USE ecommerce_auth;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Database ---------------
USE ecommerce_products;

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    category_id INT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Data
INSERT IGNORE INTO categories (name, description) VALUES
('Electronics', 'Phones, laptops and gadgets'),
('Clothing', 'Shirts, pants and accessories'),
('Books', 'Fiction, non-fiction, and textbooks');

INSERT IGNORE INTO products (name, description, price, stock, category_id, image_url) VALUES
('iPhone 15', 'Latest Apple smartphone', 999.99, 50, 1, 'https://example.com/iphone.jpg'),
('MacBoook Pro', 'Apple laptop for Professionals', 1999.99, 20, 1, 'https://example.com/macbook.jpg'),
('Plain White T-Shirt', 'Comfortable cotton t-shirt', 19.99, 200, 2, 'https://example.com/tshirt.jpg'),
('The Great Gatsby', 'Classic American novel', 12.99, 100, 3, 'https://example.com/gatsby.jpg');
