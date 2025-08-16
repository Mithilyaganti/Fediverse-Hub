const crypto = require('crypto');
const { query, getOne, insert } = require('../database/queries');

/**
 * Mastodon OAuth2 Authentication Service
 * Handles OAuth flow initiation and app registration
 */
class MastodonAuthService {
    constructor() {
        this.clientName = 'FediStream';
        this.clientWebsite = process.env.CLIENT_WEBSITE || 'https://fedistream.app';
        this.redirectUri = process.env.MASTODON_REDIRECT_URI || 'http://localhost:3000/api/auth/mastodon/callback';
        this.scopes = 'read write follow'; // Standard Mastodon scopes
    }

    /**
     * Validate and normalize Mastodon instance URL
     * @param {string} instanceUrl - Raw instance URL from user
     * @returns {string} Normalized instance URL
     */
    normalizeInstanceUrl(instanceUrl) {
        if (!instanceUrl) {
            throw new Error('Instance URL is required');
        }

        // Remove protocol if present
        let cleanUrl = instanceUrl.replace(/^https?:\/\//, '');
        
        // Remove trailing slashes
        cleanUrl = cleanUrl.replace(/\/+$/, '');
        
        // Basic validation - should look like a domain
        if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/.test(cleanUrl.split('/')[0])) {
            throw new Error('Invalid instance URL format');
        }

        return `https://${cleanUrl}`;
    }

    /**
     * Register application with Mastodon instance
     * @param {string} instanceUrl - Mastodon instance URL
     * @returns {Promise<Object>} App credentials
     */
    async registerApp(instanceUrl) {
        try {
            const normalizedUrl = this.normalizeInstanceUrl(instanceUrl);
            
            // Check if we already have app credentials for this instance
            const existingApp = await getOne(
                'SELECT client_id, client_secret FROM mastodon_apps WHERE instance_url = $1',
                [normalizedUrl]
            );

            if (existingApp) {
                return {
                    clientId: existingApp.client_id,
                    clientSecret: existingApp.client_secret,
                    instanceUrl: normalizedUrl
                };
            }

            // Register new app with Mastodon
            const response = await fetch(`${normalizedUrl}/api/v1/apps`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_name: this.clientName,
                    redirect_uris: this.redirectUri,
                    scopes: this.scopes,
                    website: this.clientWebsite
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to register app with ${normalizedUrl}: ${response.status} ${errorText}`);
            }

            const appData = await response.json();

            // Store app credentials
            await query(`
                INSERT INTO mastodon_apps (instance_url, client_id, client_secret, created_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                ON CONFLICT (instance_url) DO UPDATE SET
                    client_id = EXCLUDED.client_id,
                    client_secret = EXCLUDED.client_secret,
                    updated_at = CURRENT_TIMESTAMP
            `, [normalizedUrl, appData.client_id, appData.client_secret]);

            return {
                clientId: appData.client_id,
                clientSecret: appData.client_secret,
                instanceUrl: normalizedUrl
            };
        } catch (error) {
            console.error('Error registering Mastodon app:', error);
            throw error;
        }
    }

    /**
     * Generate state parameter for OAuth security
     * @param {string} userId - User ID for association
     * @param {string} instanceUrl - Instance URL for association
     * @returns {Promise<string>} State parameter
     */
    async generateState(userId, instanceUrl) {
        const state = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store state in database for verification
        await query(`
            INSERT INTO oauth_states (state, user_id, platform, instance_url, expires_at)
            VALUES ($1, $2, 'mastodon', $3, $4)
        `, [state, userId, instanceUrl, expiresAt]);

        return state;
    }

    /**
     * Build Mastodon authorization URL
     * @param {string} instanceUrl - Mastodon instance URL
     * @param {string} clientId - OAuth client ID
     * @param {string} state - OAuth state parameter
     * @returns {string} Authorization URL
     */
    buildAuthUrl(instanceUrl, clientId, state) {
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: this.scopes,
            state: state
        });

        return `${instanceUrl}/oauth/authorize?${params.toString()}`;
    }

    /**
     * Initiate OAuth flow by generating authorization URL
     * @param {string} userId - User ID requesting OAuth
     * @param {string} instanceUrl - Mastodon instance URL
     * @returns {Promise<Object>} OAuth data including authorization URL
     */
    async initiateOAuth(userId, instanceUrl) {
        try {
            const { clientId, instanceUrl: normalizedUrl } = await this.registerApp(instanceUrl);
            const state = await this.generateState(userId, normalizedUrl);

            const authUrl = new URL(`${normalizedUrl}/oauth/authorize`);
            authUrl.searchParams.append('client_id', clientId);
            authUrl.searchParams.append('redirect_uri', this.redirectUri);
            authUrl.searchParams.append('response_type', 'code');
            authUrl.searchParams.append('scope', this.scopes);
            authUrl.searchParams.append('state', state);

            return {
                authUrl: authUrl.toString(),
                state,
                instanceUrl: normalizedUrl
            };
        } catch (error) {
            console.error('Error initiating OAuth:', error);
            throw error;
        }
    }

    /**
     * Handle OAuth callback and exchange code for access token
     * @param {string} code - Authorization code from Mastodon
     * @param {string} state - State parameter for verification
     * @returns {Promise<Object>} User connection data
     */
    async handleCallback(code, state) {
        try {
            // Verify and get state info
            const { getOne, query } = require('../database/queries');
            
            const stateInfo = await getOne(`
                SELECT user_id, instance_url, expires_at 
                FROM oauth_states 
                WHERE state = $1 AND platform = 'mastodon'
            `, [state]);

            if (!stateInfo) {
                throw new Error('Invalid or expired state parameter');
            }

            // Check if state has expired
            if (new Date() > new Date(stateInfo.expires_at)) {
                throw new Error('OAuth state has expired');
            }

            const { user_id: userId, instance_url: instanceUrl } = stateInfo;

            // If instance_url is null (old records), we can't proceed
            if (!instanceUrl) {
                throw new Error('State record missing instance URL - please restart OAuth flow');
            }

            // Get app credentials for this instance
            const appData = await getOne(`
                SELECT client_id, client_secret 
                FROM mastodon_apps 
                WHERE instance_url = $1
            `, [instanceUrl]);

            if (!appData) {
                throw new Error('App not registered for this instance');
            }

            // Exchange code for access token
            const tokenResponse = await fetch(`${instanceUrl}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_id: appData.client_id,
                    client_secret: appData.client_secret,
                    redirect_uri: this.redirectUri,
                    grant_type: 'authorization_code',
                    code: code
                })
            });

            if (!tokenResponse.ok) {
                const errorText = await tokenResponse.text();
                throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`);
            }

            const tokenData = await tokenResponse.json();

            // Fetch user's Mastodon profile
            const profileResponse = await fetch(`${instanceUrl}/api/v1/accounts/verify_credentials`, {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                }
            });

            if (!profileResponse.ok) {
                throw new Error('Failed to fetch user profile from Mastodon');
            }

            const profile = await profileResponse.json();

            // Store the connection in database
            await query(`
                INSERT INTO user_servers (user_id, platform, instance_url, remote_user_id, access_token, refresh_token, token_expires_at)
                VALUES ($1, 'mastodon', $2, $3, $4, $5, $6)
                ON CONFLICT (user_id, platform, instance_url) 
                DO UPDATE SET
                    remote_user_id = EXCLUDED.remote_user_id,
                    access_token = EXCLUDED.access_token,
                    refresh_token = EXCLUDED.refresh_token,
                    token_expires_at = EXCLUDED.token_expires_at,
                    updated_at = CURRENT_TIMESTAMP
            `, [
                userId,
                instanceUrl,
                profile.id,
                tokenData.access_token,
                tokenData.refresh_token || null,
                tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null
            ]);

            // Clean up used state
            await query('DELETE FROM oauth_states WHERE state = $1', [state]);

            return {
                userId,
                instanceUrl,
                profile: {
                    id: profile.id,
                    username: profile.username,
                    displayName: profile.display_name,
                    avatar: profile.avatar,
                    url: profile.url
                },
                connectedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error handling OAuth callback:', error);
            throw error;
        }
    }

    /**
     * Verify OAuth state and get associated data
     * @param {string} state - State parameter to verify
     * @returns {Promise<Object>} State verification result
     */
    async verifyState(state) {
        try {
            const { getOne } = require('../database/queries');
            
            const stateInfo = await getOne(`
                SELECT user_id, instance_url, expires_at, created_at
                FROM oauth_states 
                WHERE state = $1 AND platform = 'mastodon'
            `, [state]);

            if (!stateInfo) {
                return { valid: false, error: 'Invalid state parameter' };
            }

            if (new Date() > new Date(stateInfo.expires_at)) {
                return { valid: false, error: 'State has expired' };
            }

            // Handle backward compatibility - if instance_url is null, it's an old record
            if (!stateInfo.instance_url) {
                return { valid: false, error: 'State record incomplete - please restart OAuth flow' };
            }

            return {
                valid: true,
                userId: stateInfo.user_id,
                instanceUrl: stateInfo.instance_url,
                expiresAt: stateInfo.expires_at
            };
        } catch (error) {
            console.error('Error verifying state:', error);
            return { valid: false, error: 'State verification failed' };
        }
    }

    /**
     * Verify OAuth state parameter
     * @param {string} state - State parameter from callback
     * @returns {Promise<Object|null>} State data if valid, null if invalid/expired
     */
    async verifyState(state) {
        const stateData = await getOne(`
            SELECT user_id, platform, expires_at, created_at
            FROM oauth_states 
            WHERE state = $1 AND platform = 'mastodon' AND expires_at > CURRENT_TIMESTAMP
        `, [state]);

        if (stateData) {
            // Clean up used state
            await query('DELETE FROM oauth_states WHERE state = $1', [state]);
        }

        return stateData;
    }

    /**
     * Get app credentials for instance
     * @param {string} instanceUrl - Mastodon instance URL
     * @returns {Promise<Object|null>} App credentials if found
     */
    async getAppCredentials(instanceUrl) {
        return await getOne(
            'SELECT client_id, client_secret FROM mastodon_apps WHERE instance_url = $1',
            [instanceUrl]
        );
    }
}

module.exports = new MastodonAuthService();
