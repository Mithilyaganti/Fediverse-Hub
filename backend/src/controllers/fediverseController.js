const mastodonAuthService = require('../services/mastodonAuthService');

/**
 * Initiate Mastodon OAuth connection
 * POST /api/auth/mastodon/connect
 */
async function connectMastodon(req, res) {
    try {
        const { instanceUrl } = req.body;

        // Validate input
        if (!instanceUrl) {
            return res.status(400).json({
                error: 'Missing instance URL',
                message: 'Please provide a Mastodon instance URL'
            });
        }

        // Validate instance URL format
        try {
            mastodonAuthService.normalizeInstanceUrl(instanceUrl);
        } catch (error) {
            return res.status(400).json({
                error: 'Invalid instance URL',
                message: error.message
            });
        }

        // Check if user already has this instance connected
        const { getOne } = require('../database/queries');
        const existingConnection = await getOne(`
            SELECT id, instance_url, created_at 
            FROM user_servers 
            WHERE user_id = $1 AND platform = 'mastodon' AND instance_url = $2
        `, [req.user.id, mastodonAuthService.normalizeInstanceUrl(instanceUrl)]);

        if (existingConnection) {
            return res.status(409).json({
                error: 'Already connected',
                message: 'This Mastodon instance is already connected to your account',
                connection: {
                    instanceUrl: existingConnection.instance_url,
                    connectedAt: existingConnection.created_at
                }
            });
        }

        // Initiate OAuth flow
        const oauthData = await mastodonAuthService.initiateOAuth(req.user.id, instanceUrl);

        res.json({
            message: 'OAuth flow initiated successfully',
            authUrl: oauthData.authUrl,
            instanceUrl: oauthData.instanceUrl,
            state: oauthData.state,
            instructions: 'Visit the authUrl to authorize FediStream to access your Mastodon account'
        });
    } catch (error) {
        console.error('Mastodon connect error:', error);

        // Handle specific error types
        if (error.message.includes('Failed to register app')) {
            return res.status(502).json({
                error: 'Instance connection failed',
                message: 'Could not connect to the Mastodon instance. Please check the URL and try again.'
            });
        }

        if (error.message.includes('Invalid instance URL')) {
            return res.status(400).json({
                error: 'Invalid instance URL',
                message: error.message
            });
        }

        res.status(500).json({
            error: 'Connection failed',
            message: 'An error occurred while initiating the Mastodon connection'
        });
    }
}

/**
 * Get user's connected Mastodon instances
 * GET /api/auth/mastodon/connections
 */
async function getMastodonConnections(req, res) {
    try {
        const { getMany } = require('../database/queries');
        
        const connections = await getMany(`
            SELECT 
                id,
                instance_url,
                remote_user_id,
                created_at,
                updated_at,
                CASE WHEN token_expires_at IS NULL OR token_expires_at > CURRENT_TIMESTAMP 
                     THEN 'active' 
                     ELSE 'expired' 
                END as status
            FROM user_servers 
            WHERE user_id = $1 AND platform = 'mastodon'
            ORDER BY created_at DESC
        `, [req.user.id]);

        res.json({
            connections: connections.map(conn => ({
                id: conn.id,
                instanceUrl: conn.instance_url,
                remoteUserId: conn.remote_user_id,
                status: conn.status,
                connectedAt: conn.created_at,
                updatedAt: conn.updated_at
            }))
        });
    } catch (error) {
        console.error('Get Mastodon connections error:', error);
        res.status(500).json({
            error: 'Failed to get connections',
            message: 'An error occurred while retrieving your Mastodon connections'
        });
    }
}

/**
 * Disconnect a Mastodon instance
 * DELETE /api/auth/mastodon/disconnect/:connectionId
 */
async function disconnectMastodon(req, res) {
    try {
        const { connectionId } = req.params;

        if (!connectionId) {
            return res.status(400).json({
                error: 'Missing connection ID',
                message: 'Please provide a connection ID'
            });
        }

        const { getOne, deleteOne } = require('../database/queries');

        // Verify the connection belongs to the user
        const connection = await getOne(`
            SELECT id, instance_url 
            FROM user_servers 
            WHERE id = $1 AND user_id = $2 AND platform = 'mastodon'
        `, [connectionId, req.user.id]);

        if (!connection) {
            return res.status(404).json({
                error: 'Connection not found',
                message: 'The specified Mastodon connection was not found'
            });
        }

        // Delete the connection
        await deleteOne('user_servers', { id: connectionId });

        res.json({
            message: 'Mastodon account disconnected successfully',
            disconnectedInstance: connection.instance_url
        });
    } catch (error) {
        console.error('Mastodon disconnect error:', error);
        res.status(500).json({
            error: 'Disconnection failed',
            message: 'An error occurred while disconnecting the Mastodon account'
        });
    }
}

/**
 * Check if Mastodon instance is reachable
 * POST /api/auth/mastodon/check-instance
 */
async function checkMastodonInstance(req, res) {
    try {
        const { instanceUrl } = req.body;

        if (!instanceUrl) {
            return res.status(400).json({
                error: 'Missing instance URL',
                message: 'Please provide a Mastodon instance URL'
            });
        }

        // Normalize URL
        const normalizedUrl = mastodonAuthService.normalizeInstanceUrl(instanceUrl);

        // Check if instance is reachable by fetching instance info
        const response = await fetch(`${normalizedUrl}/api/v1/instance`, {
            method: 'GET',
            headers: {
                'User-Agent': 'FediStream/1.0'
            }
        });

        if (!response.ok) {
            return res.status(502).json({
                error: 'Instance unreachable',
                message: 'Could not connect to the Mastodon instance',
                instanceUrl: normalizedUrl
            });
        }

        const instanceData = await response.json();

        res.json({
            message: 'Instance is reachable',
            instanceUrl: normalizedUrl,
            instanceInfo: {
                title: instanceData.title,
                description: instanceData.description,
                version: instanceData.version,
                languages: instanceData.languages,
                registrations: instanceData.registrations
            }
        });
    } catch (error) {
        console.error('Check Mastodon instance error:', error);
        
        if (error.message.includes('Invalid instance URL')) {
            return res.status(400).json({
                error: 'Invalid instance URL',
                message: error.message
            });
        }

        res.status(500).json({
            error: 'Instance check failed',
            message: 'An error occurred while checking the Mastodon instance'
        });
    }
}

/**
 * Handle Mastodon OAuth callback
 * @route GET /api/auth/mastodon/callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleMastodonCallback(req, res) {
    try {
        const { code, state, error: oauthError } = req.query;

        // Handle OAuth errors (user denied access, etc.)
        if (oauthError) {
            console.log('OAuth error:', oauthError, req.query.error_description);
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/mastodon/error?error=${encodeURIComponent(oauthError)}&description=${encodeURIComponent(req.query.error_description || 'OAuth authorization failed')}`);
        }

        // Validate required parameters
        if (!code || !state) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/mastodon/error?error=missing_parameters&description=${encodeURIComponent('Missing authorization code or state')}`);
        }

        // Verify state first (this also checks expiration)
        const stateVerification = await mastodonAuthService.verifyState(state);
        if (!stateVerification.valid) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/mastodon/error?error=invalid_state&description=${encodeURIComponent(stateVerification.error)}`);
        }

        // Handle the callback and exchange code for tokens
        const connectionData = await mastodonAuthService.handleCallback(code, state);

        // Success - redirect to frontend with success message
        const successParams = new URLSearchParams({
            success: 'true',
            instance: connectionData.instanceUrl,
            username: connectionData.profile.username,
            display_name: connectionData.profile.displayName || connectionData.profile.username
        });

        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/mastodon/success?${successParams.toString()}`);

    } catch (error) {
        console.error('Mastodon OAuth callback error:', error);
        
        // Redirect to error page with error details
        const errorParams = new URLSearchParams({
            error: 'callback_failed',
            description: error.message || 'Failed to complete OAuth flow'
        });

        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/mastodon/error?${errorParams.toString()}`);
    }
}

/**
 * Remove Mastodon connection
 * @route DELETE /api/auth/mastodon/disconnect
 * @param {Object} req - Express request object  
 * @param {Object} res - Express response object
 */
async function disconnectMastodonConnection(req, res) {
    try {
        const { instanceUrl } = req.body;
        
        if (!instanceUrl) {
            return res.status(400).json({
                error: 'Instance URL required',
                message: 'Please specify which Mastodon instance to disconnect'
            });
        }

        const { query } = require('../database/queries');
        const normalizedUrl = mastodonAuthService.normalizeInstanceUrl(instanceUrl);

        // Remove the connection
        const result = await query(`
            DELETE FROM user_servers 
            WHERE user_id = $1 AND platform = 'mastodon' AND instance_url = $2
            RETURNING instance_url
        `, [req.user.id, normalizedUrl]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Connection not found',
                message: 'No connection found for the specified Mastodon instance'
            });
        }

        res.json({
            message: 'Mastodon connection removed successfully',
            instanceUrl: normalizedUrl
        });

    } catch (error) {
        console.error('Error disconnecting Mastodon:', error);
        res.status(500).json({
            error: 'Disconnect failed',
            message: 'An error occurred while removing the Mastodon connection'
        });
    }
}

module.exports = {
    connectMastodon,
    getMastodonConnections,
    disconnectMastodon,
    checkMastodonInstance,
    handleMastodonCallback,
    disconnectMastodonConnection
};
