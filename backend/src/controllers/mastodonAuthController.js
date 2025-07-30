const mastodonAuthService = require('../services/mastodonAuthService');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.initiateConnect = async (req, res) => {
    const { instance_url } = req.body;
    if (!instance_url) return res.status(400).json({ error: 'instance_url is required.' });
    try {
        const authUrl = await mastodonAuthService.getAuthorizationUrl(instance_url);
        res.json({ authorization_url: authUrl });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate Mastodon authorization URL.' });
    }
};

exports.handleCallback = async (req, res) => {
    const { code, state, instance_url } = req.query;
    if (!code || !instance_url) return res.status(400).send('Missing code or instance_url.');
    try {
        // Exchange code for tokens
        const tokenData = await mastodonAuthService.exchangeCodeForToken(instance_url, code);
        // Fetch Mastodon user profile
        const profile = await mastodonAuthService.fetchUserProfile(instance_url, tokenData.access_token);
        // TODO: associate with logged-in user (for now, just demo insert)
        // In production, use state param to link to user session
        await pool.query(
            `INSERT INTO user_servers (user_id, platform, instance_url, remote_user_id, access_token, refresh_token)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (user_id, platform, instance_url) DO UPDATE SET access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token, updated_at = NOW()`,
            [
                '00000000-0000-0000-0000-000000000000', // TODO: replace with real user_id from session/JWT
                'mastodon',
                instance_url,
                profile.id,
                tokenData.access_token,
                tokenData.refresh_token || null
            ]
        );
        // Redirect to frontend (success page or dashboard)
        res.redirect(process.env.MASTODON_CONNECT_REDIRECT || '/');
    } catch (err) {
        res.status(500).send('Failed to complete Mastodon OAuth2 flow.');
    }
}; 