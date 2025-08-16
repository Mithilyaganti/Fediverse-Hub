const { getMany, getOne } = require('../database/queries');
const cacheService = require('../services/cacheService');

/**
 * Get user's aggregated timeline feed
 * @route GET /api/feed/timeline
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getTimeline(req, res) {
    try {
        const userId = req.user.id;
        const { limit = 20, offset = 0, platform, since_id, max_id } = req.query;

        // Validate pagination parameters
        const limitInt = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const offsetInt = Math.max(parseInt(offset, 10) || 0, 0);

        // Create cache key based on parameters
        const cacheKey = `timeline:${userId}:${limitInt}:${offsetInt}:${platform || 'all'}`;
        
        // Try to get from cache first
        let cachedTimeline = await cacheService.get(cacheKey);
        
        if (cachedTimeline) {
            console.log(`📦 Cache HIT for timeline ${userId}`);
            cachedTimeline.meta.cache_status = 'cache_hit';
            return res.json(cachedTimeline);
        }

        console.log(`🔍 Cache MISS for timeline ${userId}, generating fresh data`);

        // For now, return mock data since we haven't implemented content fetching yet
        const mockPosts = [
            {
                id: 'mock-post-1',
                platform: 'mastodon',
                instance_url: 'https://mastodon.social',
                original_id: '123456789',
                author_username: 'demo_user',
                author_display_name: 'Demo User',
                author_avatar: 'https://mastodon.social/avatars/demo.jpg',
                content: 'This is a mock post from Mastodon! 🚀 #fediverse',
                content_html: '<p>This is a mock post from Mastodon! 🚀 <a href="#" class="mention hashtag">#<span>fediverse</span></a></p>',
                created_at: new Date().toISOString(),
                url: 'https://mastodon.social/@demo_user/123456789',
                replies_count: 5,
                reblogs_count: 12,
                favourites_count: 28,
                media_attachments: [],
                tags: ['fediverse'],
                visibility: 'public'
            },
            {
                id: 'mock-post-2',
                platform: 'mastodon',
                instance_url: 'https://mastodon.world',
                original_id: '987654321',
                author_username: 'another_user',
                author_display_name: 'Another User',
                author_avatar: 'https://mastodon.world/avatars/another.jpg',
                content: 'Welcome to the decentralized future! Love seeing all the innovation in the Fediverse.',
                content_html: '<p>Welcome to the decentralized future! Love seeing all the innovation in the Fediverse.</p>',
                created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                url: 'https://mastodon.world/@another_user/987654321',
                replies_count: 3,
                reblogs_count: 8,
                favourites_count: 15,
                media_attachments: [],
                tags: [],
                visibility: 'public'
            }
        ];

        // Apply platform filter if specified
        let filteredPosts = mockPosts;
        if (platform && ['mastodon', 'lemmy', 'peertube'].includes(platform.toLowerCase())) {
            filteredPosts = mockPosts.filter(post => post.platform === platform.toLowerCase());
        }

        // Apply pagination
        const paginatedPosts = filteredPosts.slice(offsetInt, offsetInt + limitInt);

        // Response with metadata
        const timelineResponse = {
            posts: paginatedPosts,
            pagination: {
                limit: limitInt,
                offset: offsetInt,
                total: filteredPosts.length,
                has_more: offsetInt + limitInt < filteredPosts.length
            },
            meta: {
                platforms: ['mastodon'], // Will be dynamic based on user's connections
                last_updated: new Date().toISOString(),
                cache_status: 'cache_miss'
            }
        };

        // Cache the timeline for 2 minutes (120 seconds) since it's mock data
        const cached = await cacheService.set(cacheKey, timelineResponse, 120);
        if (cached) {
            console.log(`💾 Cached timeline for user ${userId}`);
        }

        res.json(timelineResponse);

    } catch (error) {
        console.error('Error fetching timeline:', error);
        res.status(500).json({
            error: 'Timeline fetch failed',
            message: 'An error occurred while fetching your timeline'
        });
    }
}

/**
 * Get user's connected platforms and their status
 * @route GET /api/feed/sources
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getFeedSources(req, res) {
    try {
        const userId = req.user.id;

        // Get user's connected platforms
        const connections = await getMany(`
            SELECT platform, instance_url, remote_user_id, created_at, updated_at
            FROM user_servers 
            WHERE user_id = $1
            ORDER BY created_at DESC
        `, [userId]);

        // Group by platform
        const sources = connections.reduce((acc, conn) => {
            if (!acc[conn.platform]) {
                acc[conn.platform] = [];
            }
            acc[conn.platform].push({
                instance_url: conn.instance_url,
                remote_user_id: conn.remote_user_id,
                connected_at: conn.created_at,
                last_updated: conn.updated_at,
                status: 'active' // Will be dynamic based on token validity
            });
            return acc;
        }, {});

        res.json({
            sources,
            total_connections: connections.length,
            supported_platforms: ['mastodon', 'lemmy', 'peertube'],
            last_sync: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching feed sources:', error);
        res.status(500).json({
            error: 'Sources fetch failed',
            message: 'An error occurred while fetching your feed sources'
        });
    }
}

/**
 * Get feed statistics for the user
 * @route GET /api/feed/stats  
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getFeedStats(req, res) {
    try {
        const userId = req.user.id;

        // For now, return mock statistics
        // Later this will query the posts table for real data
        const stats = {
            total_posts: 0,
            posts_by_platform: {
                mastodon: 0,
                lemmy: 0,
                peertube: 0
            },
            posts_today: 0,
            posts_this_week: 0,
            last_fetch: null,
            connected_accounts: 0
        };

        // Get actual connection count
        const connectionCount = await getOne(`
            SELECT COUNT(*) as count 
            FROM user_servers 
            WHERE user_id = $1
        `, [userId]);

        stats.connected_accounts = parseInt(connectionCount?.count || 0);

        res.json(stats);

    } catch (error) {
        console.error('Error fetching feed stats:', error);
        res.status(500).json({
            error: 'Stats fetch failed',
            message: 'An error occurred while fetching feed statistics'
        });
    }
}

/**
 * Refresh feed content (trigger background job)
 * @route POST /api/feed/refresh
 * @param {Object} req - Express request object  
 * @param {Object} res - Express response object
 */
async function refreshFeed(req, res) {
    try {
        const userId = req.user.id;

        // For now, just return success message
        // Later this will trigger a BullMQ job to fetch fresh content
        res.json({
            message: 'Feed refresh initiated',
            user_id: userId,
            status: 'queued',
            estimated_completion: new Date(Date.now() + 30000).toISOString() // 30 seconds
        });

    } catch (error) {
        console.error('Error refreshing feed:', error);
        res.status(500).json({
            error: 'Feed refresh failed',
            message: 'An error occurred while refreshing your feed'
        });
    }
}

module.exports = {
    getTimeline,
    getFeedSources,
    getFeedStats,
    refreshFeed
};
