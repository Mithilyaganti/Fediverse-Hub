const queueService = require('../services/queueService');

class QueueController {
    // Simple test job for testing without auth
    async testSimpleJob(req, res) {
        try {
            const { data = 'Simple test job', delay = 0 } = req.body;
            
            const job = await queueService.addContentAggregationJob(
                'test-user-id', 
                'mastodon', 
                'fetchPosts', 
                { 
                    delay: delay,
                    priority: 0,
                    data: {
                        testMessage: data,
                        timestamp: new Date().toISOString()
                    }
                }
            );

            if (!job) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to add test job - job was not created',
                    error: 'Queue service returned null'
                });
            }

            res.json({
                success: true,
                message: 'Test job added to queue successfully',
                jobId: job.id,
                jobName: job.name,
                data: job.data,
                delay: delay
            });
        } catch (error) {
            console.error('Error adding test job:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add test job',
                error: error.message
            });
        }
    }

    // Get queue statistics
    async getQueueStats(req, res) {
        try {
            const stats = await queueService.getQueueStats();
            
            res.json({
                success: true,
                data: {
                    queues: stats,
                    isConnected: queueService.isConnected,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('❌ Error fetching queue stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch queue statistics',
                details: error.message
            });
        }
    }

    // Add content aggregation job
    async addContentAggregationJob(req, res) {
        try {
            const { platform = 'mastodon', action = 'fetch-posts', options = {} } = req.body;
            const userId = req.user.id;
            
            const job = await queueService.addContentAggregationJob(userId, platform, action, options);
            
            if (job) {
                res.json({
                    success: true,
                    message: `Content aggregation job added successfully`,
                    data: {
                        job: {
                            id: job.id,
                            name: job.name,
                            data: job.data,
                            timestamp: new Date().toISOString()
                        }
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to add content aggregation job'
                });
            }
        } catch (error) {
            console.error('❌ Error adding content aggregation job:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                details: error.message
            });
        }
    }

    // Add notification job
    async addNotificationJob(req, res) {
        try {
            const { type = 'info', message, options = {} } = req.body;
            const userId = req.user.id;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error: 'Message is required for notification job'
                });
            }
            
            const job = await queueService.addNotificationJob(userId, type, message, options);
            
            if (job) {
                res.json({
                    success: true,
                    message: `Notification job added successfully`,
                    data: {
                        job: {
                            id: job.id,
                            name: job.name,
                            data: job.data,
                            timestamp: new Date().toISOString()
                        }
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to add notification job'
                });
            }
        } catch (error) {
            console.error('❌ Error adding notification job:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                details: error.message
            });
        }
    }

    // Add user action job
    async addUserActionJob(req, res) {
        try {
            const { 
                action,
                targetId,
                platform = 'mastodon',
                options = {}
            } = req.body;
            const userId = req.user.id;

            if (!action || !targetId) {
                return res.status(400).json({
                    success: false,
                    error: 'Action and targetId are required for user action job'
                });
            }
            
            const job = await queueService.addUserActionJob(userId, action, targetId, platform, options);
            
            if (job) {
                res.json({
                    success: true,
                    message: `User action job added successfully`,
                    data: {
                        job: {
                            id: job.id,
                            name: job.name,
                            data: job.data,
                            timestamp: new Date().toISOString()
                        }
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to add user action job'
                });
            }
        } catch (error) {
            console.error('❌ Error adding user action job:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                details: error.message
            });
        }
    }

    // Create multiple test jobs for load testing
    async createBulkJobs(req, res) {
        try {
            const { count = 5 } = req.body;
            const userId = req.user.id;
            const jobs = [];
            
            console.log(`🧪 Creating ${count} test jobs for user ${userId}...`);
            
            for (let i = 0; i < count; i++) {
                // Add different types of jobs
                const jobType = i % 3;
                
                switch (jobType) {
                    case 0: // Content aggregation
                        const contentJob = await queueService.addContentAggregationJob(
                            userId, 
                            'mastodon', 
                            'fetch-posts',
                            { delay: i * 1000 } // Stagger jobs
                        );
                        if (contentJob) jobs.push({ type: 'content-aggregation', id: contentJob.id });
                        break;
                        
                    case 1: // Notification
                        const notificationJob = await queueService.addNotificationJob(
                            userId, 
                            'bulk-test', 
                            `Bulk test notification ${i + 1}`,
                            { delay: i * 500 }
                        );
                        if (notificationJob) jobs.push({ type: 'notification', id: notificationJob.id });
                        break;
                        
                    case 2: // User action
                        const userActionJob = await queueService.addUserActionJob(
                            userId, 
                            'like-post', 
                            `test-post-${i}`, 
                            'mastodon',
                            { delay: i * 750 }
                        );
                        if (userActionJob) jobs.push({ type: 'user-action', id: userActionJob.id });
                        break;
                }
            }
            
            res.json({
                success: true,
                message: `${jobs.length} bulk test jobs created successfully`,
                data: {
                    jobs,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Error creating bulk jobs:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create bulk jobs',
                details: error.message
            });
        }
    }

    // Clean up old jobs
    async cleanupQueues(req, res) {
        try {
            await queueService.cleanupQueues();
            
            res.json({
                success: true,
                message: 'Queue cleanup completed successfully',
                data: {
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Error during queue cleanup:', error);
            res.status(500).json({
                success: false,
                error: 'Queue cleanup failed',
                details: error.message
            });
        }
    }
}

module.exports = new QueueController();
