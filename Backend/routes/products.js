const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authenticate_token');
const { body, validationResult } = require('express-validator');
const authorizeRole = require('../middleware/authorizeRole'); // ✨ ADD THIS LINE

router.post('/',
    authenticateToken,
    [
        body('name').notEmpty().withMessage('Product name is required'),
        body('description').optional(),
        body('category').optional(),
        body('features').optional(),
        body('price').isNumeric().optional().withMessage('Price must be a number'),
        body('market').optional(),
        body('product_status').optional(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, category, features, price, market, product_status } = req.body;
        const userId = req.user.id;

        try {
            const [result] = await pool.query(
                'INSERT INTO product_data (user_id, name, description, category, features, price, market, product_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, name, description, category, features, price, market, product_status]
            );

            res.status(201).json({ message: 'Product data inserted successfully!', productId: result.insertId });
        } catch (error) {
            console.error('Error inserting product:', error);
            let errorMessage = 'Server error during product data insertion';

            if (error.code === 'ER_DUP_ENTRY') {
                errorMessage = 'A product with this name already exists for this user.'; // Example for unique constraint
            } else if (error.code === 'ER_BAD_NULL_ERROR') {
                errorMessage = 'One or more required fields are missing in the database schema.';
            } else if (error.code) {
                errorMessage = `Database error: ${error.sqlMessage}`;
            }

            res.status(500).json({ message: errorMessage, errorDetails: error });
        }
    }
);

// GET route to retrieve all products for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const [products] = await pool.query('SELECT * FROM product_data WHERE user_id = ?', [userId]);
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        let errorMessage = 'Server error while fetching product data';

        if (error.code) {
            errorMessage = `Database error: ${error.sqlMessage}`;
        }
        res.status(500).json({ message: errorMessage, errorDetails: error });
    }
});
// GET route to retrieve a single product by ID for the authenticated user
router.get('/:productId', authenticateToken, async (req, res) => {
    const productId = req.params.productId;
    const userId = req.user.id;

    try {
        const [product] = await pool.query('SELECT * FROM product_data WHERE id = ? AND user_id = ?', [productId, userId]);

        if (product.length === 0) {
            return res.status(404).json({ message: 'Product not found for this user.' });
        }

        res.status(200).json(product[0]); // Send back the first (and only) product object
    } catch (error) {
        console.error('Error fetching product:', error);
        let errorMessage = 'Server error while fetching product details';
        if (error.code) {
            errorMessage = `Database error: ${error.sqlMessage}`;
        }
        res.status(500).json({ message: errorMessage, errorDetails: error });
    }
});
router.put('/:productId',
    authenticateToken, // 🔒 Ensure only authenticated users can update products
    [
        // 🛡️ Validation for update fields (all optional, but if present, must be valid)
        body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
        body('description').optional(),
        body('category').optional(),
        body('features').optional(),
        body('price').optional().isNumeric().withMessage('Price must be a number'),
        body('market').optional(),
        body('product_status').optional(),
    ],
    async (req, res) => {
        // 🚨 Check for validation errors from express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const productId = req.params.productId; // 🎯 Get product ID from URL parameters
        const userId = req.user.id;             // 👤 Get authenticated user's ID from JWT payload

        // 📦 Get the fields to update from the request body
        // We use Object.keys(req.body).map to dynamically build the SET clause for SQL
        const updates = req.body;
        const updateKeys = Object.keys(updates);

        if (updateKeys.length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }

        // 🏗️ Dynamically build the SQL SET clause
        const setClauses = updateKeys.map(key => `${key} = ?`).join(', ');
        const setValues = updateKeys.map(key => updates[key]);

        try {
            // 🔍 First, check if the product exists and belongs to the user
            const [existingProduct] = await pool.query(
                'SELECT id FROM product_data WHERE id = ? AND user_id = ?',
                [productId, userId]
            );

            if (existingProduct.length === 0) {
                // If product not found OR it doesn't belong to the user
                return res.status(404).json({ message: 'Product not found or you do not have permission to update it.' });
            }

            // 💾 Perform the update query
            const [result] = await pool.query(
                `UPDATE product_data SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
                [...setValues, productId, userId] // Combine dynamic values with id and user_id
            );

            if (result.affectedRows === 0) {
                // This case should ideally be caught by the initial SELECT, but as a safeguard
                return res.status(404).json({ message: 'Product not found or no changes were made.' });
            }

            // ✅ Success Response
            res.status(200).json({ message: 'Product updated successfully!' });

        } catch (error) {
            // 🚨 Error Handling
            console.error('Error updating product:', error);
            let errorMessage = 'Server error while updating product data';
            if (error.code) {
                errorMessage = `Database error: ${error.sqlMessage}`;
            }
            res.status(500).json({ message: errorMessage, errorDetails: error.message });
        }
    }
);
// ... (Keep your existing requires, POST, GET, and PUT routes) ...

// DELETE route to remove a product by ID for the authenticated user
router.delete('/:productId',
    authenticateToken,
    authorizeRole(['admin']),
    async (req, res) => {
        const productId = req.params.productId;
        const userId = req.user.id;

        console.log('DELETE route handler entered.'); // ADD THIS
        console.log(`Attempting to delete product ${productId} for user ${userId}`); // ADD THIS

        try {
            const [existingProduct] = await pool.query(
                'SELECT id FROM product_data WHERE id = ? AND user_id = ?',
                [productId, userId]
            );

            if (existingProduct.length === 0) {
                console.log('Product not found or permission denied (pre-check). Sending 404.'); // ADD THIS
                return res.status(404).json({ message: 'Product not found or you do not have permission to delete it.' });
            }

            // Perform the delete query
            const [result] = await pool.query(
                'DELETE FROM product_data WHERE id = ? AND user_id = ?',
                [productId, userId]
            );

            if (result.affectedRows === 0) {
                console.log('Product not found or no changes were made (after delete attempt). Sending 404.'); // ADD THIS
                return res.status(404).json({ message: 'Product not found or no changes were made (already deleted).' });
            }

            console.log('Product deleted successfully. Sending 200.'); // ADD THIS
            res.status(200).json({ message: 'Product deleted successfully!' });

        } catch (error) {
            console.log('!!! CAUGHT AN ERROR IN DELETE ROUTE TRY-CATCH !!!'); // ADD THIS
            console.error('Error deleting product:', error);
            let errorMessage = 'Server error while deleting product data';
            if (error.code) {
                errorMessage = `Database error: ${error.sqlMessage}`;
            }
            res.status(500).json({ message: errorMessage, errorDetails: error.message });
        }
    }
);
// routes/products.js

// ... (your existing routes like POST, GET, PUT) ...

// ✨ ADD THIS NEW TEST ROUTE ✨
router.get('/test', (req, res) => {
    console.log('Accessed /api/products/test');
    res.status(200).send('Product routes are working correctly!');
});

// ... (your existing DELETE route) ...

module.exports = router; // Make sure this is at the very end of the file