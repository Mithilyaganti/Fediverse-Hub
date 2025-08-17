const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

class TestDataSeeder {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }

    /**
     * Seed test users and Mastodon accounts for development
     * Note: This creates fake accounts with dummy tokens for testing purposes only
     */
    async seedTestData() {
        console.log('🌱 Seeding test data for development...');
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');

            // Create test user
            const testUserId = await this.createTestUser(client);
            
            // Create test Mastodon accounts (with fake tokens for testing)
            await this.createTestMastodonAccounts(client, testUserId);
            
            await client.query('COMMIT');
            
            console.log('✅ Test data seeded successfully');
            return { success: true, testUserId };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error seeding test data:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async createTestUser(client) {
        // Check if test user already exists
        const existingUser = await client.query(
            'SELECT id FROM users WHERE email = $1',
            ['test@fedistream.dev']
        );

        if (existingUser.rows.length > 0) {
            console.log('📧 Test user already exists, using existing user');
            return existingUser.rows[0].id;
        }

        // Create test user
        const hashedPassword = await bcrypt.hash('testpassword123', 10);
        const userResult = await client.query(`
            INSERT INTO users (email, password_hash)
            VALUES ($1, $2)
            RETURNING id
        `, ['test@fedistream.dev', hashedPassword]);

        const userId = userResult.rows[0].id;
        console.log('👤 Created test user:', userId);

        // Create user profile
        await client.query(`
            INSERT INTO user_profiles (user_id, display_name, bio)
            VALUES ($1, $2, $3)
        `, [userId, 'Test User', 'Test user for FediStream development']);

        // Create user settings
        await client.query(`
            INSERT INTO settings (user_id, theme, notifications_enabled)
            VALUES ($1, $2, $3)
        `, [userId, 'dark', true]);

        return userId;
    }

    async createTestMastodonAccounts(client, userId) {
        console.log('🐘 Creating test Mastodon accounts...');

        const testAccounts = [
            {
                instanceUrl: 'https://mastodon.social',
                remoteUserId: 'testuser1',
                accessToken: 'fake_token_for_testing_mastodon_social_' + Date.now()
            },
            {
                instanceUrl: 'https://fosstodon.org', 
                remoteUserId: 'testuser2',
                accessToken: 'fake_token_for_testing_fosstodon_' + Date.now()
            }
        ];

        for (const account of testAccounts) {
            // Check if account already exists
            const existing = await client.query(`
                SELECT id FROM user_servers 
                WHERE user_id = $1 AND platform = $2 AND instance_url = $3
            `, [userId, 'mastodon', account.instanceUrl]);

            if (existing.rows.length > 0) {
                console.log(`📋 Test account already exists: ${account.instanceUrl}`);
                continue;
            }

            await client.query(`
                INSERT INTO user_servers (
                    user_id, platform, instance_url, remote_user_id, access_token
                ) VALUES ($1, $2, $3, $4, $5)
            `, [
                userId, 
                'mastodon', 
                account.instanceUrl, 
                account.remoteUserId, 
                account.accessToken
            ]);

            console.log(`✅ Created test Mastodon account: ${account.remoteUserId}@${account.instanceUrl}`);
        }
    }

    /**
     * Create test posts in the database for development
     */
    async seedTestPosts() {
        console.log('📝 Seeding test posts...');
        const client = await this.pool.connect();
        
        try {
            const testPosts = [
                {
                    original_id: 'test_post_1_' + Date.now(),
                    platform: 'mastodon',
                    instance_url: 'https://mastodon.social',
                    author_username: 'testuser1',
                    author_display_name: 'Test User 1',
                    author_avatar_url: 'https://via.placeholder.com/100',
                    content: 'This is a test post from Mastodon Social! #fediverse #testing',
                    content_html: '<p>This is a test post from Mastodon Social! <a href="/tags/fediverse">#fediverse</a> <a href="/tags/testing">#testing</a></p>',
                    url: 'https://mastodon.social/@testuser1/test_post_1',
                    media_attachments: JSON.stringify([]),
                    tags: JSON.stringify(['fediverse', 'testing']),
                    mentions: JSON.stringify([]),
                    visibility: 'public',
                    sensitive: false,
                    spoiler_text: '',
                    replies_count: 0,
                    reblogs_count: 2,
                    favourites_count: 5,
                    published_at: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
                },
                {
                    original_id: 'test_post_2_' + Date.now(),
                    platform: 'mastodon',
                    instance_url: 'https://fosstodon.org',
                    author_username: 'testuser2',
                    author_display_name: 'Test User 2',
                    author_avatar_url: 'https://via.placeholder.com/100',
                    content: 'Hello from Fosstodon! Just testing the federation capabilities of this new aggregator app.',
                    content_html: '<p>Hello from Fosstodon! Just testing the federation capabilities of this new aggregator app.</p>',
                    url: 'https://fosstodon.org/@testuser2/test_post_2',
                    media_attachments: JSON.stringify([]),
                    tags: JSON.stringify(['fosstodon', 'federation']),
                    mentions: JSON.stringify([]),
                    visibility: 'public',
                    sensitive: false,
                    spoiler_text: '',
                    replies_count: 1,
                    reblogs_count: 0,
                    favourites_count: 3,
                    published_at: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
                },
                {
                    original_id: 'test_post_3_' + Date.now(),
                    platform: 'mastodon',
                    instance_url: 'https://mastodon.social',
                    author_username: 'testuser1',
                    author_display_name: 'Test User 1',
                    author_avatar_url: 'https://via.placeholder.com/100',
                    content: 'The beauty of the fediverse is that no single entity controls your data or your connections. #decentralized #privacy',
                    content_html: '<p>The beauty of the fediverse is that no single entity controls your data or your connections. <a href="/tags/decentralized">#decentralized</a> <a href="/tags/privacy">#privacy</a></p>',
                    url: 'https://mastodon.social/@testuser1/test_post_3',
                    media_attachments: JSON.stringify([]),
                    tags: JSON.stringify(['decentralized', 'privacy']),
                    mentions: JSON.stringify([]),
                    visibility: 'public',
                    sensitive: false,
                    spoiler_text: '',
                    replies_count: 3,
                    reblogs_count: 7,
                    favourites_count: 12,
                    published_at: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
                }
            ];

            for (const post of testPosts) {
                await client.query(`
                    INSERT INTO posts (
                        original_id, platform, instance_url, author_username, author_display_name,
                        author_avatar_url, content, content_html, url, in_reply_to_id, reblog_of_id,
                        media_attachments, tags, mentions, visibility, sensitive, spoiler_text,
                        replies_count, reblogs_count, favourites_count, published_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
                    )
                    ON CONFLICT (original_id, platform, instance_url) DO NOTHING
                `, [
                    post.original_id, post.platform, post.instance_url, post.author_username,
                    post.author_display_name, post.author_avatar_url, post.content, post.content_html,
                    post.url, post.in_reply_to_id, post.reblog_of_id, post.media_attachments,
                    post.tags, post.mentions, post.visibility, post.sensitive, post.spoiler_text,
                    post.replies_count, post.reblogs_count, post.favourites_count, post.published_at
                ]);
            }

            console.log('✅ Test posts seeded successfully');
            return { success: true, postsCount: testPosts.length };

        } finally {
            client.release();
        }
    }

    /**
     * Clean test data
     */
    async cleanTestData() {
        console.log('🧹 Cleaning test data...');
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');

            // Delete test posts
            await client.query(`
                DELETE FROM posts 
                WHERE original_id LIKE 'test_post_%' 
                OR author_username LIKE 'testuser%'
            `);

            // Delete test user accounts
            await client.query(`
                DELETE FROM user_servers 
                WHERE access_token LIKE 'fake_token_for_testing_%'
            `);

            // Delete test user (this will cascade to related tables)
            const result = await client.query(`
                DELETE FROM users 
                WHERE email = 'test@fedistream.dev'
                RETURNING id
            `);

            await client.query('COMMIT');

            console.log('✅ Test data cleaned successfully');
            return { success: true, deletedUsers: result.rows.length };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error cleaning test data:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = TestDataSeeder;
