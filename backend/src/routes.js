const express = require('express');
const authController = require('./controllers/authController');
const authMiddleware = require('./middleware/auth');
const settingsController = require('./controllers/settingsController');
const mastodonAuthController = require('./controllers/mastodonAuthController');

const router = express.Router();

// Signup
router.post('/api/auth/signup', authController.signup);
// Login
router.post('/api/auth/login', authController.login);
// Logout (client-side, but endpoint for future extensibility)
router.post('/api/auth/logout', authMiddleware, authController.logout);
// Get current user
router.get('/api/auth/user', authMiddleware, authController.getUser);
// User settings endpoints
router.get('/api/settings', authMiddleware, settingsController.getSettings);
router.put('/api/settings', authMiddleware, settingsController.updateSettings);
// Mastodon OAuth2: Initiate connect
router.post('/api/auth/mastodon/connect', mastodonAuthController.initiateConnect);
// Mastodon OAuth2: Handle callback
router.get('/api/auth/mastodon/callback', mastodonAuthController.handleCallback);

module.exports = router; 