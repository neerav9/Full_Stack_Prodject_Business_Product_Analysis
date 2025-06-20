// routes/users.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // Your database connection pool
const authenticateToken = require('../middleware/authenticate_token'); // For JWT authentication
const { body, validationResult } = require('express-validator'); // For input validation
const bcrypt = require('bcryptjs'); // For password hashing and comparison

// --- GET User Profile ---
// Allows an authenticated user to view their own profile details.
router.get('/profile', authenticateToken, async (req, res) => {
    const userId = req.user.id; // Get user ID from the authenticated token

    try {
        const [user] = await pool.query('SELECT id, username, email, role FROM users WHERE id = ?', [userId]);

        if (user.length === 0) {
            // This case should ideally not happen if authenticateToken works correctly,
            // as req.user implies the user exists. But it's a good safeguard.
            return res.status(404).json({ message: 'User profile not found.' });
        }

        res.status(200).json({
            message: 'User profile fetched successfully.',
            user: user[0] // Send back the user details
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        // Pass the error to the centralized error handler
        res.status(500).json({ message: 'Server error while fetching profile.', error: error.message });
    }
});

// --- PUT Update User Profile ---
// Allows an authenticated user to update their own profile details (username, email).
router.put('/profile', authenticateToken, [
    // Validation for update fields
    body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.'),
    body('email').optional().isEmail().withMessage('Please provide a valid email address.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { username, email } = req.body;

    // Build dynamic update query
    let updateFields = [];
    let updateValues = [];

    if (username) {
        updateFields.push('username = ?');
        updateValues.push(username);
    }
    if (email) {
        updateFields.push('email = ?');
        updateValues.push(email);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(userId);

    try {
        const [result] = await pool.query(query, updateValues);

        if (result.affectedRows === 0) {
            // This might happen if user tries to update with same values, or user not found (unlikely after auth)
            return res.status(400).json({ message: 'No changes made or user not found.' });
        }

        res.status(200).json({ message: 'Profile updated successfully!' });

    } catch (error) {
        console.error('Error updating user profile:', error);
        // Handle unique constraint violation for email/username if applicable
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email or username already exists.' });
        }
        res.status(500).json({ message: 'Server error while updating profile.', error: error.message });
    }
});

// --- PUT Change Password ---
// Allows an authenticated user to change their password. Requires old password verification.
router.put('/profile/password', authenticateToken, [
    body('oldPassword').notEmpty().withMessage('Old password is required.'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    try {
        // 1. Fetch user to verify old password
        const [user] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);

        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found.' }); // Should not happen after authentication
        }

        const hashedPassword = user[0].password;

        // 2. Compare old password
        const isMatch = await bcrypt.compare(oldPassword, hashedPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid old password.' });
        }

        // 3. Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10); // Hash with salt rounds

        // 4. Update password in database
        const [result] = await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

        if (result.affectedRows === 0) {
            return res.status(500).json({ message: 'Failed to update password.' });
        }

        res.status(200).json({ message: 'Password updated successfully!' });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error while changing password.', error: error.message });
    }
});

module.exports = router;