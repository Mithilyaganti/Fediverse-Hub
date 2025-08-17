const { Queue, Worker } = require('bullmq');
const redis = require('redis');
const ContentAggregationService = require('./contentAggregationService');

class QueueService {
    constructor() {
        this.connection = null;
        this.queues = {};
        this.workers = {};
        this.isConnected = false;
        this.contentAggregationService = new ContentAggregationService();
    }

    async initialize() {
        try {
            // Create Redis connection for BullMQ
            this.connection = {
                host: process.env.REDIS_HOST || 'redis',
                port: parseInt(process.env.REDIS_PORT) || 6379,
                maxRetriesPerRequest: 3,
                retryDelayOnFailover: 100,
                enableReadyCheck: false,
                maxRetriesPerRequest: null,
                retryDelayOnFailover: 100,
                enableOfflineQueue: false
            };

            console.log('🔄 Initializing BullMQ with Redis connection...');
            
            // Initialize queues
            await this.initializeQueues();
            
            // Initialize workers
            await this.initializeWorkers();
            
            this.isConnected = true;
            console.log('✅ BullMQ Queue Service initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Queue Service:', error.message);
            this.isConnected = false;
        }
    }

    async initializeQueues() {
        // Content Aggregation Queue - for fetching posts from fediverse platforms
        this.queues.contentAggregation = new Queue('content-aggregation', {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: 10,
                removeOnFail: 5,
            },
        });

        // Notification Queue - for sending notifications
        this.queues.notifications = new Queue('notifications', {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 2,
                backoff: {
                    type: 'fixed',
                    delay: 5000,
                },
                removeOnComplete: 5,
                removeOnFail: 3,
            },
        });

        // User Actions Queue - for processing likes, comments, etc.
        this.queues.userActions = new Queue('user-actions', {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: 20,
                removeOnFail: 10,
            },
        });

        console.log('✅ BullMQ Queues initialized:', Object.keys(this.queues));
    }

    async initializeWorkers() {
        // Content Aggregation Worker
        this.workers.contentAggregation = new Worker('content-aggregation', 
            async (job) => await this.processContentAggregation(job),
            { 
                connection: this.connection,
                concurrency: 2,
            }
        );

        // Notification Worker
        this.workers.notifications = new Worker('notifications',
            async (job) => await this.processNotification(job),
            { 
                connection: this.connection,
                concurrency: 5,
            }
        );

        // User Actions Worker
        this.workers.userActions = new Worker('user-actions',
            async (job) => await this.processUserAction(job),
            { 
                connection: this.connection,
                concurrency: 3,
            }
        );

        // Set up event listeners for all workers
        Object.entries(this.workers).forEach(([queueName, worker]) => {
            worker.on('completed', (job) => {
                console.log(`✅ Job ${job.id} in ${queueName} completed successfully`);
            });

            worker.on('failed', (job, err) => {
                console.error(`❌ Job ${job.id} in ${queueName} failed:`, err.message);
            });

            worker.on('error', (err) => {
                console.error(`❌ Worker error in ${queueName}:`, err);
            });
        });

        console.log('✅ BullMQ Workers initialized:', Object.keys(this.workers));
    }

    // Job Processors
    async processContentAggregation(job) {
        const { userId, platform, action } = job.data;
        console.log(`🔄 Processing content aggregation job for user ${userId} from ${platform}`);
        
        try {
            switch (action) {
                case 'fetchPosts':
                case 'fetch-posts':
                    console.log(`📥 Fetching posts for user ${userId} from ${platform}...`);
                    
                    if (platform === 'mastodon') {
                        const result = await this.contentAggregationService.fetchPostsForUser(userId, { limit: 20 });
                        console.log(`✅ Mastodon fetch result:`, result);
                        return result;
                    } else {
                        console.log(`⚠️ Platform ${platform} not yet supported for content fetching`);
                        return { success: false, error: 'Platform not supported' };
                    }
                
                case 'fetch-all-posts':
                    console.log(`📥 Fetching posts from all connected accounts...`);
                    const result = await this.contentAggregationService.fetchAllMastodonPosts({ limit: 20 });
                    console.log(`✅ All accounts fetch result:`, result);
                    return result;
                
                case 'sync-timeline':
                    console.log(`🔄 Syncing timeline for user ${userId}...`);
                    await this.simulateAsyncWork(1500);
                    console.log(`✅ Timeline synced for user ${userId}`);
                    return { success: true, processedAt: new Date() };
                
                default:
                    console.log(`ℹ️ Unknown content aggregation action: ${action}`);
                    return { success: false, error: 'Unknown action' };
            }
            
        } catch (error) {
            console.error(`❌ Content aggregation job failed:`, error.message);
            throw error;
        }
    }

    async processNotification(job) {
        const { userId, type, message } = job.data;
        console.log(`📬 Processing notification job for user ${userId}: ${type}`);
        
        try {
            // Simulate notification processing
            await this.simulateAsyncWork(500);
            console.log(`✅ Notification sent to user ${userId}: ${message}`);
            
            return { success: true, sentAt: new Date() };
            
        } catch (error) {
            console.error(`❌ Notification job failed:`, error.message);
            throw error;
        }
    }

    async processUserAction(job) {
        const { userId, action, targetId, platform } = job.data;
        console.log(`👤 Processing user action: ${action} by user ${userId} on ${platform}`);
        
        try {
            switch (action) {
                case 'like-post':
                    console.log(`👍 Liking post ${targetId} for user ${userId} on ${platform}`);
                    await this.simulateAsyncWork(1000);
                    break;
                
                case 'comment-post':
                    console.log(`💬 Adding comment to post ${targetId} for user ${userId} on ${platform}`);
                    await this.simulateAsyncWork(800);
                    break;
                
                case 'share-post':
                    console.log(`🔄 Sharing post ${targetId} for user ${userId} on ${platform}`);
                    await this.simulateAsyncWork(1200);
                    break;
                
                default:
                    console.log(`ℹ️ Unknown user action: ${action}`);
            }

            return { success: true, processedAt: new Date() };
            
        } catch (error) {
            console.error(`❌ User action job failed:`, error.message);
            throw error;
        }
    }

    // Utility method to simulate async work
    async simulateAsyncWork(delay) {
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // Public methods to add jobs to queues
    async addContentAggregationJob(userId, platform, action, options = {}) {
        if (!this.isConnected) {
            console.warn('⚠️ Queue service not connected, skipping job addition');
            return null;
        }

        try {
            const job = await this.queues.contentAggregation.add(
                `${action}-${platform}`,
                { 
                    userId, 
                    platform, 
                    action,
                    ...options.data // Include any additional data
                },
                {
                    delay: options.delay || 0,
                    priority: options.priority || 0,
                    attempts: options.attempts || 3,
                    removeOnComplete: options.removeOnComplete || 10,
                    removeOnFail: options.removeOnFail || 5
                }
            );

            console.log(`➕ Added content aggregation job ${job.id} for user ${userId}`);
            return job;
        } catch (error) {
            console.error('❌ Failed to add content aggregation job:', error.message);
            return null;
        }
    }

    async addNotificationJob(userId, type, message, options = {}) {
        if (!this.isConnected) {
            console.warn('⚠️ Queue service not connected, skipping job addition');
            return null;
        }

        try {
            const job = await this.queues.notifications.add(
                `notification-${type}`,
                { 
                    userId, 
                    type, 
                    message,
                    ...options.data // Include any additional data
                },
                {
                    delay: options.delay || 0,
                    priority: options.priority || 0,
                    attempts: options.attempts || 2,
                    removeOnComplete: options.removeOnComplete || 5,
                    removeOnFail: options.removeOnFail || 3
                }
            );

            console.log(`➕ Added notification job ${job.id} for user ${userId}`);
            return job;
        } catch (error) {
            console.error('❌ Failed to add notification job:', error.message);
            return null;
        }
    }

    async addUserActionJob(userId, action, targetId, platform, options = {}) {
        if (!this.isConnected) {
            console.warn('⚠️ Queue service not connected, skipping job addition');
            return null;
        }

        try {
            const job = await this.queues.userActions.add(
                `${action}-${platform}`,
                { 
                    userId, 
                    action, 
                    targetId, 
                    platform,
                    ...options.data // Include any additional data
                },
                {
                    delay: options.delay || 0,
                    priority: options.priority || 0,
                    attempts: options.attempts || 5,
                    removeOnComplete: options.removeOnComplete || 10,
                    removeOnFail: options.removeOnFail || 5
                }
            );

            console.log(`➕ Added user action job ${job.id} for user ${userId}`);
            return job;
        } catch (error) {
            console.error('❌ Failed to add user action job:', error.message);
            return null;
        }
    }

    // Queue status and management methods
    async getQueueStats() {
        const stats = {};
        
        for (const [queueName, queue] of Object.entries(this.queues)) {
            try {
                const waiting = await queue.getWaiting();
                const active = await queue.getActive();
                const completed = await queue.getCompleted();
                const failed = await queue.getFailed();
                
                stats[queueName] = {
                    waiting: waiting.length,
                    active: active.length,
                    completed: completed.length,
                    failed: failed.length
                };
            } catch (error) {
                console.error(`❌ Failed to get stats for queue ${queueName}:`, error.message);
                stats[queueName] = { error: error.message };
            }
        }
        
        return stats;
    }

    async cleanupQueues() {
        console.log('🧹 Cleaning up completed and failed jobs...');
        
        for (const [queueName, queue] of Object.entries(this.queues)) {
            try {
                await queue.clean(24 * 60 * 60 * 1000, 10, 'completed'); // Keep completed jobs for 24 hours
                await queue.clean(7 * 24 * 60 * 60 * 1000, 5, 'failed'); // Keep failed jobs for 7 days
                console.log(`✅ Cleaned up queue: ${queueName}`);
            } catch (error) {
                console.error(`❌ Failed to cleanup queue ${queueName}:`, error.message);
            }
        }
    }

    async shutdown() {
        console.log('🔄 Shutting down Queue Service...');
        
        // Close all workers
        for (const [name, worker] of Object.entries(this.workers)) {
            try {
                await worker.close();
                console.log(`✅ Worker ${name} closed`);
            } catch (error) {
                console.error(`❌ Error closing worker ${name}:`, error);
            }
        }

        // Close all queues
        for (const [name, queue] of Object.entries(this.queues)) {
            try {
                await queue.close();
                console.log(`✅ Queue ${name} closed`);
            } catch (error) {
                console.error(`❌ Error closing queue ${name}:`, error);
            }
        }

        this.isConnected = false;
        console.log('✅ Queue Service shutdown complete');
    }
}

// Export singleton instance
const queueService = new QueueService();
module.exports = queueService;
