const express = require('express');
const router = express.Router();
const { 
    connectMastodon, 
    getMastodonConnections, 
    disconnectMastodon, 
    checkMastodonInstance,
    handleMastodonCallback,
    disconnectMastodonConnection
} = require('../controllers/fediverseController');
const { authenticateToken } = require('../middleware/auth');
const { 
    validateMastodonConnect, 
    validateUUID, 
    validateInstanceCheck, 
    oauthRateLimit 
} = require('../middleware/fediverseValidation');

// OAuth callback route (no auth required - this is the redirect from Mastodon)
/**
 * @route   GET /api/auth/mastodon/callback
 * @desc    Handle Mastodon OAuth callback
 * @access  Public (OAuth callback)
 * @query   { code, state }
 */
router.get('/mastodon/callback', handleMastodonCallback);

// All other fediverse routes require authentication
router.use(authenticateToken);

// Mastodon OAuth Routes

/**
 * @route   POST /api/auth/mastodon/connect
 * @desc    Initiate Mastodon OAuth connection
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    { instanceUrl }
 */
router.post('/mastodon/connect', validateMastodonConnect, oauthRateLimit(5, 10 * 60 * 1000), connectMastodon);

/**
 * @route   GET /api/auth/mastodon/connections
 * @desc    Get user's connected Mastodon instances
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/mastodon/connections', getMastodonConnections);

/**
 * @route   DELETE /api/auth/mastodon/disconnect
 * @desc    Disconnect a Mastodon instance
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    { instanceUrl }
 */
router.delete('/mastodon/disconnect', disconnectMastodonConnection);

/**
 * @route   POST /api/auth/mastodon/check-instance
 * @desc    Check if Mastodon instance is reachable and get info
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    { instanceUrl }
 */
router.post('/mastodon/check-instance', validateInstanceCheck, checkMastodonInstance);

module.exports = router;
