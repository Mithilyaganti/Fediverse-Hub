const express = require('express');
const queueController = require('../controllers/queueController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get queue statistics (protected route)
router.get('/stats', authenticateToken, queueController.getQueueStats);

// Simple test endpoint (no auth required for testing)
router.post('/test-simple', queueController.testSimpleJob);

// Test endpoints for different job types
router.post('/test/content-aggregation', authenticateToken, queueController.addContentAggregationJob);
router.post('/test/notification', authenticateToken, queueController.addNotificationJob);
router.post('/test/user-action', authenticateToken, queueController.addUserActionJob);

// Bulk job creation for testing load
router.post('/test/bulk-jobs', authenticateToken, queueController.createBulkJobs);

// Cleanup completed and failed jobs
router.post('/cleanup', authenticateToken, queueController.cleanupQueues);

module.exports = router;
