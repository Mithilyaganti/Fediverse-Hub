const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getTimeline,
    getFeedSources,
    getFeedStats,
    refreshFeed
} = require('../controllers/feedController');

// All feed routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/feed/timeline
 * @desc    Get user's aggregated timeline feed
 * @access  Private
 * @query   limit - Number of posts to return (1-100, default 20)
 * @query   offset - Number of posts to skip (default 0)  
 * @query   platform - Filter by platform (mastodon, lemmy, peertube)
 * @query   since_id - Return posts newer than this ID
 * @query   max_id - Return posts older than this ID
 */
router.get('/timeline', getTimeline);

/**
 * @route   GET /api/feed/sources
 * @desc    Get user's connected feed sources and their status
 * @access  Private
 */
router.get('/sources', getFeedSources);

/**
 * @route   GET /api/feed/stats
 * @desc    Get feed statistics for the user
 * @access  Private
 */
router.get('/stats', getFeedStats);

/**
 * @route   POST /api/feed/refresh
 * @desc    Trigger a refresh of the user's feed content
 * @access  Private
 */
router.post('/refresh', refreshFeed);

module.exports = router;
