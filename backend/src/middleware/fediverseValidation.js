/**
 * Validation middleware for fediverse requests
 */

/**
 * Validate Mastodon connection request
 */
function validateMastodonConnect(req, res, next) {
    const { instanceUrl } = req.body;
    const errors = [];

    if (!instanceUrl) {
        errors.push('Instance URL is required');
    } else if (typeof instanceUrl !== 'string') {
        errors.push('Instance URL must be a string');
    } else if (instanceUrl.length === 0) {
        errors.push('Instance URL cannot be empty');
    } else if (instanceUrl.length > 500) {
        errors.push('Instance URL is too long (max 500 characters)');
    }

    // Basic URL format validation
    if (instanceUrl && typeof instanceUrl === 'string') {
        const urlPattern = /^(https?:\/\/)?[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}/;
        const cleanUrl = instanceUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
        
        if (!urlPattern.test(cleanUrl)) {
            errors.push('Instance URL format is invalid (should be like: mastodon.social)');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            message: 'Please correct the following errors',
            details: errors
        });
    }

    next();
}

/**
 * Validate UUID parameter
 */
function validateUUID(paramName) {
    return (req, res, next) => {
        const value = req.params[paramName];
        
        if (!value) {
            return res.status(400).json({
                error: 'Missing parameter',
                message: `${paramName} is required`
            });
        }

        // UUID v4 format validation
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        
        if (!uuidPattern.test(value)) {
            return res.status(400).json({
                error: 'Invalid parameter format',
                message: `${paramName} must be a valid UUID`
            });
        }

        next();
    };
}

/**
 * Validate instance check request
 */
function validateInstanceCheck(req, res, next) {
    const { instanceUrl } = req.body;
    const errors = [];

    if (!instanceUrl) {
        errors.push('Instance URL is required');
    } else if (typeof instanceUrl !== 'string') {
        errors.push('Instance URL must be a string');
    } else if (instanceUrl.length === 0) {
        errors.push('Instance URL cannot be empty');
    } else if (instanceUrl.length > 500) {
        errors.push('Instance URL is too long (max 500 characters)');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            message: 'Please correct the following errors',
            details: errors
        });
    }

    next();
}

/**
 * Rate limiting for OAuth operations (prevent abuse)
 */
const oauthAttempts = new Map();

function oauthRateLimit(maxAttempts = 5, windowMs = 10 * 60 * 1000) {
    return (req, res, next) => {
        const userId = req.user.id;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Get or create attempts array for this user
        if (!oauthAttempts.has(userId)) {
            oauthAttempts.set(userId, []);
        }

        const attempts = oauthAttempts.get(userId);
        
        // Remove old attempts outside the window
        const recentAttempts = attempts.filter(time => time > windowStart);
        oauthAttempts.set(userId, recentAttempts);

        // Check if limit exceeded
        if (recentAttempts.length >= maxAttempts) {
            return res.status(429).json({
                error: 'Too many OAuth attempts',
                message: `Too many OAuth connection attempts. Please try again in ${Math.ceil(windowMs / 60000)} minutes.`,
                retryAfter: windowMs
            });
        }

        // Add current attempt
        recentAttempts.push(now);
        
        next();
    };
}

module.exports = {
    validateMastodonConnect,
    validateUUID,
    validateInstanceCheck,
    oauthRateLimit
};
