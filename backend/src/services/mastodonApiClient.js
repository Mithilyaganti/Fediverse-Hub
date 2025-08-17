const axios = require('axios');

class MastodonApiClient {
    constructor(instanceUrl, accessToken) {
        this.instanceUrl = instanceUrl.endsWith('/') ? instanceUrl.slice(0, -1) : instanceUrl;
        this.accessToken = accessToken;
        
        // Configure axios instance
        this.client = axios.create({
            baseURL: `${this.instanceUrl}/api/v1`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'User-Agent': 'FediStream/1.0'
            },
            timeout: 10000 // 10 second timeout
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error(`Mastodon API Error (${this.instanceUrl}):`, error.message);
                if (error.response) {
                    console.error('Response data:', error.response.data);
                    console.error('Status:', error.response.status);
                }
                throw error;
            }
        );
    }

    /**
     * Verify credentials - test if access token is valid
     * @returns {Promise<Object>} User account information
     */
    async verifyCredentials() {
        try {
            const response = await this.client.get('/accounts/verify_credentials');
            return response.data;
        } catch (error) {
            throw new Error(`Failed to verify Mastodon credentials: ${error.message}`);
        }
    }

    /**
     * Fetch home timeline posts
     * @param {Object} options - Query parameters
     * @param {number} options.limit - Maximum number of posts to return (default: 20, max: 40)
     * @param {string} options.max_id - Get posts older than this ID
     * @param {string} options.since_id - Get posts newer than this ID
     * @param {string} options.min_id - Get posts immediately newer than this ID
     * @returns {Promise<Array>} Array of status objects
     */
    async getHomeTimeline(options = {}) {
        try {
            const params = {
                limit: Math.min(options.limit || 20, 40), // Mastodon max limit is 40
                ...options
            };

            const response = await this.client.get('/timelines/home', { params });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch Mastodon timeline: ${error.message}`);
        }
    }

    /**
     * Fetch public timeline posts
     * @param {Object} options - Query parameters  
     * @param {boolean} options.local - Only posts from local instance
     * @param {boolean} options.remote - Only posts from remote instances
     * @param {boolean} options.only_media - Only posts with media attachments
     * @param {number} options.limit - Maximum number of posts to return
     * @returns {Promise<Array>} Array of status objects
     */
    async getPublicTimeline(options = {}) {
        try {
            const params = {
                limit: Math.min(options.limit || 20, 40),
                ...options
            };

            const response = await this.client.get('/timelines/public', { params });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch Mastodon public timeline: ${error.message}`);
        }
    }

    /**
     * Get user's account information
     * @param {string} accountId - The account ID to get info for
     * @returns {Promise<Object>} Account information
     */
    async getAccount(accountId) {
        try {
            const response = await this.client.get(`/accounts/${accountId}`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch Mastodon account: ${error.message}`);
        }
    }

    /**
     * Favorite a post
     * @param {string} statusId - The ID of the status to favorite
     * @returns {Promise<Object>} Updated status object
     */
    async favoriteStatus(statusId) {
        try {
            const response = await this.client.post(`/statuses/${statusId}/favourite`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to favorite Mastodon status: ${error.message}`);
        }
    }

    /**
     * Unfavorite a post
     * @param {string} statusId - The ID of the status to unfavorite
     * @returns {Promise<Object>} Updated status object
     */
    async unfavoriteStatus(statusId) {
        try {
            const response = await this.client.post(`/statuses/${statusId}/unfavourite`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to unfavorite Mastodon status: ${error.message}`);
        }
    }

    /**
     * Boost (reblog) a post
     * @param {string} statusId - The ID of the status to boost
     * @returns {Promise<Object>} Updated status object
     */
    async boostStatus(statusId) {
        try {
            const response = await this.client.post(`/statuses/${statusId}/reblog`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to boost Mastodon status: ${error.message}`);
        }
    }

    /**
     * Unboost (unreblog) a post
     * @param {string} statusId - The ID of the status to unboost
     * @returns {Promise<Object>} Updated status object
     */
    async unboostStatus(statusId) {
        try {
            const response = await this.client.post(`/statuses/${statusId}/unreblog`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to unboost Mastodon status: ${error.message}`);
        }
    }

    /**
     * Reply to a post
     * @param {string} statusId - The ID of the status to reply to
     * @param {string} content - The content of the reply
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} New status object
     */
    async replyToStatus(statusId, content, options = {}) {
        try {
            const data = {
                status: content,
                in_reply_to_id: statusId,
                ...options
            };

            const response = await this.client.post('/statuses', data);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to reply to Mastodon status: ${error.message}`);
        }
    }

    /**
     * Get status by ID
     * @param {string} statusId - The ID of the status to get
     * @returns {Promise<Object>} Status object
     */
    async getStatus(statusId) {
        try {
            const response = await this.client.get(`/statuses/${statusId}`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get Mastodon status: ${error.message}`);
        }
    }

    /**
     * Get status context (replies and ancestors)
     * @param {string} statusId - The ID of the status to get context for
     * @returns {Promise<Object>} Context object with ancestors and descendants
     */
    async getStatusContext(statusId) {
        try {
            const response = await this.client.get(`/statuses/${statusId}/context`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get Mastodon status context: ${error.message}`);
        }
    }
}

module.exports = MastodonApiClient;
