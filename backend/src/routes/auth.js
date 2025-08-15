const express = require('express');
const router = express.Router();
const { signup, login, logout, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateSignup, validateLogin, rateLimit } = require('../middleware/validation');

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 * @body    { email, password, displayName? }
 */
router.post('/signup', validateSignup, rateLimit(3, 60 * 60 * 1000), signup);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', validateLogin, rateLimit(5, 15 * 60 * 1000), login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Public
 */
router.post('/logout', logout);

// Protected routes (authentication required)

/**
 * @route   GET /api/auth/user
 * @desc    Get current user details
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/user', authenticateToken, getCurrentUser);

module.exports = router;
