const { createClient } = require('redis');

class CacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    /**
     * Initialize Redis connection
     */
    async connect() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
            
            this.client = createClient({
                url: redisUrl,
                retry_unfulfilled_commands: true,
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.error('Redis max reconnection attempts exceeded');
                            return new Error('Redis connection failed');
                        }
                        return Math.min(retries * 50, 1000);
                    }
                }
            });

            // Event listeners
            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('🔗 Redis client connecting...');
            });

            this.client.on('ready', () => {
                console.log('✅ Redis client connected successfully');
                this.isConnected = true;
            });

            this.client.on('end', () => {
                console.log('🔌 Redis client disconnected');
                this.isConnected = false;
            });

            await this.client.connect();
            return this.client;
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Check if Redis is connected
     */
    isReady() {
        return this.isConnected && this.client?.isReady;
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {Promise<any>} Cached value or null
     */
    async get(key) {
        try {
            if (!this.isReady()) {
                console.warn('Redis not ready, cache miss for key:', key);
                return null;
            }

            const value = await this.client.get(key);
            if (value === null) {
                return null;
            }

            // Try to parse JSON, if it fails return as string
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            console.error('Redis GET error for key', key, ':', error);
            return null;
        }
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in seconds (optional)
     * @returns {Promise<boolean>} Success status
     */
    async set(key, value, ttl = null) {
        try {
            if (!this.isReady()) {
                console.warn('Redis not ready, skipping cache set for key:', key);
                return false;
            }

            // Serialize value to JSON if it's an object
            const serializedValue = typeof value === 'object' 
                ? JSON.stringify(value) 
                : String(value);

            let result;
            if (ttl) {
                result = await this.client.setEx(key, ttl, serializedValue);
            } else {
                result = await this.client.set(key, serializedValue);
            }

            return result === 'OK';
        } catch (error) {
            console.error('Redis SET error for key', key, ':', error);
            return false;
        }
    }

    /**
     * Delete key from cache
     * @param {string} key - Cache key to delete
     * @returns {Promise<boolean>} Success status
     */
    async del(key) {
        try {
            if (!this.isReady()) {
                console.warn('Redis not ready, skipping cache delete for key:', key);
                return false;
            }

            const result = await this.client.del(key);
            return result > 0;
        } catch (error) {
            console.error('Redis DEL error for key', key, ':', error);
            return false;
        }
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key to check
     * @returns {Promise<boolean>} Whether key exists
     */
    async exists(key) {
        try {
            if (!this.isReady()) {
                return false;
            }

            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error('Redis EXISTS error for key', key, ':', error);
            return false;
        }
    }

    /**
     * Get multiple keys at once
     * @param {string[]} keys - Array of cache keys
     * @returns {Promise<object>} Object with key-value pairs
     */
    async mget(keys) {
        try {
            if (!this.isReady() || !keys.length) {
                return {};
            }

            const values = await this.client.mGet(keys);
            const result = {};

            keys.forEach((key, index) => {
                if (values[index] !== null) {
                    try {
                        result[key] = JSON.parse(values[index]);
                    } catch {
                        result[key] = values[index];
                    }
                }
            });

            return result;
        } catch (error) {
            console.error('Redis MGET error:', error);
            return {};
        }
    }

    /**
     * Set expiration time for existing key
     * @param {string} key - Cache key
     * @param {number} ttl - Time to live in seconds
     * @returns {Promise<boolean>} Success status
     */
    async expire(key, ttl) {
        try {
            if (!this.isReady()) {
                return false;
            }

            const result = await this.client.expire(key, ttl);
            return result === 1;
        } catch (error) {
            console.error('Redis EXPIRE error for key', key, ':', error);
            return false;
        }
    }

    /**
     * Get cache statistics
     * @returns {Promise<object>} Cache statistics
     */
    async getStats() {
        try {
            if (!this.isReady()) {
                return { connected: false };
            }

            const info = await this.client.info('memory');
            return {
                connected: true,
                memory_usage: info,
                uptime: await this.client.get('uptime') || 'unknown'
            };
        } catch (error) {
            console.error('Redis STATS error:', error);
            return { connected: false, error: error.message };
        }
    }

    /**
     * Clear all cache (use with caution)
     * @returns {Promise<boolean>} Success status
     */
    async flushAll() {
        try {
            if (!this.isReady()) {
                return false;
            }

            await this.client.flushAll();
            console.log('⚠️  All Redis cache cleared');
            return true;
        } catch (error) {
            console.error('Redis FLUSHALL error:', error);
            return false;
        }
    }

    /**
     * Gracefully close Redis connection
     */
    async disconnect() {
        try {
            if (this.client) {
                await this.client.quit();
                console.log('🔌 Redis client disconnected gracefully');
            }
        } catch (error) {
            console.error('Error disconnecting from Redis:', error);
        }
    }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
