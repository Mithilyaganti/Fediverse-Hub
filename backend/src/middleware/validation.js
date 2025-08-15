/**
 * Validation middleware for request bodies
 */

/**
 * Validate signup request
 */
function validateSignup(req, res, next) {
    const { email, password } = req.body;
    const errors = [];

    if (!email) {
        errors.push('Email is required');
    } else if (typeof email !== 'string' || email.length > 255) {
        errors.push('Email must be a string with maximum 255 characters');
    }

    if (!password) {
        errors.push('Password is required');
    } else if (typeof password !== 'string' || password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    } else if (password.length > 128) {
        errors.push('Password must be no more than 128 characters long');
    }

    if (req.body.displayName && (typeof req.body.displayName !== 'string' || req.body.displayName.length > 100)) {
        errors.push('Display name must be a string with maximum 100 characters');
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
 * Validate login request
 */
function validateLogin(req, res, next) {
    const { email, password } = req.body;
    const errors = [];

    if (!email) {
        errors.push('Email is required');
    } else if (typeof email !== 'string') {
        errors.push('Email must be a string');
    }

    if (!password) {
        errors.push('Password is required');
    } else if (typeof password !== 'string') {
        errors.push('Password must be a string');
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
 * Rate limiting helper (basic implementation)
 * In production, use a proper rate limiting library like express-rate-limit
 */
const loginAttempts = new Map();

function rateLimit(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Get or create attempts array for this IP
        if (!loginAttempts.has(ip)) {
            loginAttempts.set(ip, []);
        }

        const attempts = loginAttempts.get(ip);
        
        // Remove old attempts outside the window
        const recentAttempts = attempts.filter(time => time > windowStart);
        loginAttempts.set(ip, recentAttempts);

        // Check if limit exceeded
        if (recentAttempts.length >= maxAttempts) {
            return res.status(429).json({
                error: 'Too many attempts',
                message: `Too many login attempts. Please try again in ${Math.ceil(windowMs / 60000)} minutes.`,
                retryAfter: windowMs
            });
        }

        // Add current attempt
        recentAttempts.push(now);
        
        next();
    };
}

module.exports = {
    validateSignup,
    validateLogin,
    rateLimit
};
