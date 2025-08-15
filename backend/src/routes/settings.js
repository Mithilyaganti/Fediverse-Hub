const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, resetSettings } = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');
const { validateSettingsUpdate, validateNotEmpty, settingsRateLimit } = require('../middleware/settingsValidation');

// All settings routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/settings
 * @desc    Get user settings
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/', getSettings);

/**
 * @route   PUT /api/settings
 * @desc    Update user settings
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    { theme?, language?, notificationsEnabled?, emailNotifications? }
 */
router.put('/', validateNotEmpty, validateSettingsUpdate, settingsRateLimit(10, 60 * 1000), updateSettings);

/**
 * @route   POST /api/settings/reset
 * @desc    Reset user settings to defaults
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.post('/reset', settingsRateLimit(5, 60 * 1000), resetSettings);

module.exports = router;
