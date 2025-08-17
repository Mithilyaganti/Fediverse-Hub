const { Pool } = require('pg');
const MastodonApiClient = require('./mastodonApiClient');

class ContentAggregationService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }

    /**
     * Fetch and store posts from all connected Mastodon accounts for all users
     * @param {Object} options - Fetch options
     * @param {number} options.limit - Number of posts to fetch per account
     * @returns {Promise<Object>} Summary of fetched posts
     */
    async fetchAllMastodonPosts(options = {}) {
        const { limit = 20 } = options;
        let totalFetched = 0;
        let totalStored = 0;
        const errors = [];

        try {
            // Get all connected Mastodon accounts
            const mastodonAccounts = await this.getMastodonAccounts();
            
            console.log(`📡 Found ${mastodonAccounts.length} connected Mastodon accounts`);

            for (const account of mastodonAccounts) {
                try {
                    const result = await this.fetchPostsFromAccount(account, { limit });
                    totalFetched += result.fetched;
                    totalStored += result.stored;
                    
                    console.log(`✅ Account ${account.remote_user_id}@${account.instance_url}: ${result.stored}/${result.fetched} posts stored`);
                } catch (error) {
                    const errorMsg = `Failed to fetch posts from ${account.instance_url}: ${error.message}`;
                    console.error(`❌ ${errorMsg}`);
                    errors.push(errorMsg);
                }
            }

            return {
                success: true,
                accounts: mastodonAccounts.length,
                totalFetched,
                totalStored,
                errors
            };

        } catch (error) {
            console.error('❌ Error in fetchAllMastodonPosts:', error);
            return {
                success: false,
                error: error.message,
                totalFetched,
                totalStored,
                errors
            };
        }
    }

    /**
     * Fetch posts from a specific user account
     * @param {string} userId - User ID to fetch posts for
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} Summary of fetched posts
     */
    async fetchPostsForUser(userId, options = {}) {
        const { limit = 20 } = options;
        let totalFetched = 0;
        let totalStored = 0;
        const errors = [];

        try {
            // Get user's connected Mastodon accounts
            const mastodonAccounts = await this.getUserMastodonAccounts(userId);
            
            console.log(`📡 User ${userId}: Found ${mastodonAccounts.length} connected Mastodon accounts`);

            for (const account of mastodonAccounts) {
                try {
                    const result = await this.fetchPostsFromAccount(account, { limit });
                    totalFetched += result.fetched;
                    totalStored += result.stored;
                } catch (error) {
                    const errorMsg = `Failed to fetch posts from ${account.instance_url}: ${error.message}`;
                    console.error(`❌ ${errorMsg}`);
                    errors.push(errorMsg);
                }
            }

            return {
                success: true,
                userId,
                accounts: mastodonAccounts.length,
                totalFetched,
                totalStored,
                errors
            };

        } catch (error) {
            console.error(`❌ Error fetching posts for user ${userId}:`, error);
            return {
                success: false,
                userId,
                error: error.message,
                errors
            };
        }
    }

    /**
     * Fetch posts from a specific Mastodon account
     * @param {Object} account - Account object from user_servers table
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} Result of fetch operation
     */
    async fetchPostsFromAccount(account, options = {}) {
        const { limit = 20 } = options;
        
        try {
            // Check if this is a test account (has fake token)
            if (account.access_token.startsWith('fake_token_for_testing_')) {
                console.log(`🧪 Detected test account, generating mock posts for ${account.instance_url}`);
                return await this.generateMockPostsForTestAccount(account, { limit });
            }

            // Create API client for this account
            const client = new MastodonApiClient(account.instance_url, account.access_token);
            
            // Verify credentials first
            await client.verifyCredentials();
            
            // Fetch home timeline
            const posts = await client.getHomeTimeline({ limit });
            console.log(`📥 Fetched ${posts.length} posts from ${account.instance_url}`);
            
            // Normalize and store posts
            let stored = 0;
            for (const post of posts) {
                try {
                    const normalized = this.normalizeMastodonPost(post, account.instance_url);
                    await this.storePost(normalized);
                    stored++;
                } catch (error) {
                    console.warn(`⚠️ Failed to store post ${post.id}:`, error.message);
                }
            }

            return {
                fetched: posts.length,
                stored,
                account: `${account.remote_user_id}@${account.instance_url}`
            };

        } catch (error) {
            console.error(`❌ Error fetching from account ${account.instance_url}:`, error);
            
            // If it's a test account and fails, generate mock data
            if (account.access_token.startsWith('fake_token_for_testing_')) {
                console.log(`🧪 Generating mock data for failed test account`);
                return await this.generateMockPostsForTestAccount(account, { limit });
            }
            
            throw error;
        }
    }

    /**
     * Generate mock posts for test accounts (when using fake tokens)
     * @param {Object} account - Test account object
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Result of mock generation
     */
    async generateMockPostsForTestAccount(account, options = {}) {
        const { limit = 20 } = options;
        
        const mockPosts = [];
        const baseTime = Date.now();
        
        for (let i = 0; i < Math.min(limit, 5); i++) { // Generate up to 5 mock posts
            const postId = `mock_${account.remote_user_id}_${baseTime}_${i}`;
            const timeOffset = i * 1000 * 60 * 30; // 30 minutes apart
            
            const mockPost = {
                id: postId,
                account: {
                    username: account.remote_user_id,
                    display_name: `Mock User @ ${account.instance_url.replace('https://', '')}`,
                    avatar: `https://via.placeholder.com/100?text=${account.remote_user_id.charAt(0).toUpperCase()}`
                },
                content: this.generateMockContent(i),
                url: `${account.instance_url}/@${account.remote_user_id}/${postId}`,
                created_at: new Date(baseTime - timeOffset).toISOString(),
                visibility: 'public',
                sensitive: false,
                spoiler_text: '',
                replies_count: Math.floor(Math.random() * 10),
                reblogs_count: Math.floor(Math.random() * 5),
                favourites_count: Math.floor(Math.random() * 15),
                media_attachments: [],
                tags: [
                    { name: 'fediverse' },
                    { name: 'testing' },
                    { name: 'development' }
                ],
                mentions: [],
                reblog: null,
                in_reply_to_id: null
            };
            
            mockPosts.push(mockPost);
        }

        console.log(`🎭 Generated ${mockPosts.length} mock posts for ${account.instance_url}`);
        
        // Store the mock posts
        let stored = 0;
        for (const post of mockPosts) {
            try {
                const normalized = this.normalizeMastodonPost(post, account.instance_url);
                await this.storePost(normalized);
                stored++;
            } catch (error) {
                console.warn(`⚠️ Failed to store mock post ${post.id}:`, error.message);
            }
        }

        return {
            fetched: mockPosts.length,
            stored,
            account: `${account.remote_user_id}@${account.instance_url}`,
            isMock: true
        };
    }

    /**
     * Generate mock content for test posts
     * @param {number} index - Post index for variation
     * @returns {string} Mock post content
     */
    generateMockContent(index) {
        const mockContents = [
            `<p>Testing the content aggregation system for #fediverse! This is mock post #${index + 1} from the development environment. 🚀</p>`,
            `<p>The beauty of decentralized social networks is that they give users control over their data and connections. #decentralized #privacy</p>`,
            `<p>Working on integrating multiple fediverse platforms into a unified timeline view. Phase 15 implementation in progress! #development</p>`,
            `<p>Mock post demonstrating HTML content parsing and normalization. Links, hashtags, and mentions should work properly. #testing</p>`,
            `<p>This is a longer mock post to test content display and truncation in the frontend. It contains multiple sentences and should demonstrate how longer content is handled in the aggregated timeline view. #longpost #testing #fediverse</p>`
        ];
        
        return mockContents[index] || mockContents[0];
    }

    /**
     * Normalize a Mastodon status object to our common post schema
     * @param {Object} status - Mastodon status object
     * @param {string} instanceUrl - The instance URL
     * @returns {Object} Normalized post object
     */
    normalizeMastodonPost(status, instanceUrl) {
        // Handle reblog (boost) - if it's a reblog, use the original post data
        const originalStatus = status.reblog || status;
        
        return {
            original_id: originalStatus.id,
            platform: 'mastodon',
            instance_url: instanceUrl,
            author_username: originalStatus.account.username,
            author_display_name: originalStatus.account.display_name || originalStatus.account.username,
            author_avatar_url: originalStatus.account.avatar,
            content: this.stripHtml(originalStatus.content || ''),
            content_html: originalStatus.content || '',
            url: originalStatus.url || originalStatus.uri,
            in_reply_to_id: originalStatus.in_reply_to_id,
            reblog_of_id: status.reblog ? status.reblog.id : null,
            media_attachments: JSON.stringify(originalStatus.media_attachments || []),
            tags: JSON.stringify((originalStatus.tags || []).map(tag => tag.name)),
            mentions: JSON.stringify((originalStatus.mentions || []).map(mention => ({
                id: mention.id,
                username: mention.username,
                acct: mention.acct
            }))),
            visibility: originalStatus.visibility || 'public',
            sensitive: originalStatus.sensitive || false,
            spoiler_text: originalStatus.spoiler_text || '',
            replies_count: originalStatus.replies_count || 0,
            reblogs_count: originalStatus.reblogs_count || 0,
            favourites_count: originalStatus.favourites_count || 0,
            published_at: new Date(originalStatus.created_at)
        };
    }

    /**
     * Store a normalized post in the database
     * @param {Object} post - Normalized post object
     * @returns {Promise<Object>} Stored post with ID
     */
    async storePost(post) {
        const client = await this.pool.connect();
        
        try {
            const query = `
                INSERT INTO posts (
                    original_id, platform, instance_url, author_username, author_display_name,
                    author_avatar_url, content, content_html, url, in_reply_to_id, reblog_of_id,
                    media_attachments, tags, mentions, visibility, sensitive, spoiler_text,
                    replies_count, reblogs_count, favourites_count, published_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
                )
                ON CONFLICT (original_id, platform, instance_url) 
                DO UPDATE SET
                    author_display_name = EXCLUDED.author_display_name,
                    author_avatar_url = EXCLUDED.author_avatar_url,
                    content = EXCLUDED.content,
                    content_html = EXCLUDED.content_html,
                    replies_count = EXCLUDED.replies_count,
                    reblogs_count = EXCLUDED.reblogs_count,
                    favourites_count = EXCLUDED.favourites_count,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id, original_id, platform, instance_url
            `;

            const values = [
                post.original_id, post.platform, post.instance_url, post.author_username,
                post.author_display_name, post.author_avatar_url, post.content, post.content_html,
                post.url, post.in_reply_to_id, post.reblog_of_id, post.media_attachments,
                post.tags, post.mentions, post.visibility, post.sensitive, post.spoiler_text,
                post.replies_count, post.reblogs_count, post.favourites_count, post.published_at
            ];

            const result = await client.query(query, values);
            return result.rows[0];

        } finally {
            client.release();
        }
    }

    /**
     * Get all connected Mastodon accounts from all users
     * @returns {Promise<Array>} Array of Mastodon account objects
     */
    async getMastodonAccounts() {
        const client = await this.pool.connect();
        
        try {
            const query = `
                SELECT user_id, platform, instance_url, remote_user_id, access_token, created_at
                FROM user_servers 
                WHERE platform = 'mastodon' 
                AND access_token IS NOT NULL
                ORDER BY created_at DESC
            `;

            const result = await client.query(query);
            return result.rows;

        } finally {
            client.release();
        }
    }

    /**
     * Get connected Mastodon accounts for a specific user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of user's Mastodon account objects
     */
    async getUserMastodonAccounts(userId) {
        const client = await this.pool.connect();
        
        try {
            const query = `
                SELECT user_id, platform, instance_url, remote_user_id, access_token, created_at
                FROM user_servers 
                WHERE user_id = $1 
                AND platform = 'mastodon' 
                AND access_token IS NOT NULL
                ORDER BY created_at DESC
            `;

            const result = await client.query(query, [userId]);
            return result.rows;

        } finally {
            client.release();
        }
    }

    /**
     * Get cached posts from database with pagination
     * @param {Object} options - Query options
     * @param {number} options.limit - Maximum number of posts to return
     * @param {number} options.offset - Number of posts to skip
     * @param {string} options.platform - Filter by platform
     * @param {string} options.instance_url - Filter by instance
     * @returns {Promise<Array>} Array of posts
     */
    async getCachedPosts(options = {}) {
        const {
            limit = 20,
            offset = 0,
            platform = null,
            instance_url = null
        } = options;

        const client = await this.pool.connect();
        
        try {
            let query = `
                SELECT 
                    id, original_id, platform, instance_url, author_username, author_display_name,
                    author_avatar_url, content, content_html, url, in_reply_to_id, reblog_of_id,
                    media_attachments, tags, mentions, visibility, sensitive, spoiler_text,
                    replies_count, reblogs_count, favourites_count, published_at, created_at, updated_at
                FROM posts
            `;

            const conditions = [];
            const values = [];
            let valueIndex = 1;

            if (platform) {
                conditions.push(`platform = $${valueIndex++}`);
                values.push(platform);
            }

            if (instance_url) {
                conditions.push(`instance_url = $${valueIndex++}`);
                values.push(instance_url);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ` ORDER BY published_at DESC LIMIT $${valueIndex++} OFFSET $${valueIndex++}`;
            values.push(limit, offset);

            const result = await client.query(query, values);
            return result.rows;

        } finally {
            client.release();
        }
    }

    /**
     * Strip HTML tags from content
     * @param {string} html - HTML content
     * @returns {string} Plain text content
     */
    stripHtml(html) {
        if (!html) return '';
        return html
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
            .replace(/&amp;/g, '&') // Replace &amp; with &
            .replace(/&lt;/g, '<') // Replace &lt; with <
            .replace(/&gt;/g, '>') // Replace &gt; with >
            .replace(/&quot;/g, '"') // Replace &quot; with "
            .replace(/&#39;/g, "'") // Replace &#39; with '
            .trim();
    }

    /**
     * Get statistics about cached posts
     * @returns {Promise<Object>} Statistics object
     */
    async getPostsStats() {
        const client = await this.pool.connect();
        
        try {
            const query = `
                SELECT 
                    platform,
                    COUNT(*) as total_posts,
                    COUNT(DISTINCT instance_url) as unique_instances,
                    COUNT(DISTINCT author_username) as unique_authors,
                    MAX(published_at) as latest_post,
                    MIN(published_at) as oldest_post
                FROM posts
                GROUP BY platform
                ORDER BY platform
            `;

            const result = await client.query(query);
            return result.rows;

        } finally {
            client.release();
        }
    }
}

module.exports = ContentAggregationService;
