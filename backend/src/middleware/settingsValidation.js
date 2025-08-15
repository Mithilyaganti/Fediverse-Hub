/**
 * Validation middleware for settings requests
 */

/**
 * Validate settings update request
 */
function validateSettingsUpdate(req, res, next) {
    const { theme, language, notificationsEnabled, emailNotifications } = req.body;
    const errors = [];

    // Validate theme if provided
    if (theme !== undefined) {
        if (typeof theme !== 'string') {
            errors.push('Theme must be a string');
        } else if (!['light', 'dark'].includes(theme)) {
            errors.push('Theme must be either "light" or "dark"');
        }
    }

    // Validate language if provided
    if (language !== undefined) {
        if (typeof language !== 'string') {
            errors.push('Language must be a string');
        } else if (language.length === 0 || language.length > 10) {
            errors.push('Language must be between 1 and 10 characters');
        } else if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(language)) {
            // Basic validation for language codes (e.g., 'en', 'en-US', 'fr', 'es-ES')
            errors.push('Language must be a valid language code (e.g., "en", "en-US", "fr")');
        }
    }

    // Validate notificationsEnabled if provided
    if (notificationsEnabled !== undefined) {
        if (typeof notificationsEnabled !== 'boolean') {
            errors.push('Notifications enabled must be a boolean value');
        }
    }

    // Validate emailNotifications if provided
    if (emailNotifications !== undefined) {
        if (typeof emailNotifications !== 'boolean') {
            errors.push('Email notifications must be a boolean value');
        }
    }

    // Check if at least one field is provided
    const hasFields = [theme, language, notificationsEnabled, emailNotifications].some(field => field !== undefined);
    if (!hasFields) {
        errors.push('At least one setting field must be provided');
    }

    // Check for unknown fields
    const allowedFields = ['theme', 'language', 'notificationsEnabled', 'emailNotifications'];
    const providedFields = Object.keys(req.body);
    const unknownFields = providedFields.filter(field => !allowedFields.includes(field));
    
    if (unknownFields.length > 0) {
        errors.push(`Unknown fields: ${unknownFields.join(', ')}`);
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
 * Validate that request body is not empty
 */
function validateNotEmpty(req, res, next) {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            error: 'Empty request',
            message: 'Request body cannot be empty'
        });
    }
    next();
}

/**
 * Rate limiting for settings updates (prevent spam)
 */
const settingsUpdateAttempts = new Map();

function settingsRateLimit(maxAttempts = 10, windowMs = 60 * 1000) {
    return (req, res, next) => {
        const userId = req.user.id;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Get or create attempts array for this user
        if (!settingsUpdateAttempts.has(userId)) {
            settingsUpdateAttempts.set(userId, []);
        }

        const attempts = settingsUpdateAttempts.get(userId);
        
        // Remove old attempts outside the window
        const recentAttempts = attempts.filter(time => time > windowStart);
        settingsUpdateAttempts.set(userId, recentAttempts);

        // Check if limit exceeded
        if (recentAttempts.length >= maxAttempts) {
            return res.status(429).json({
                error: 'Too many requests',
                message: `Too many settings updates. Please try again in ${Math.ceil(windowMs / 1000)} seconds.`,
                retryAfter: windowMs
            });
        }

        // Add current attempt
        recentAttempts.push(now);
        
        next();
    };
}

module.exports = {
    validateSettingsUpdate,
    validateNotEmpty,
    settingsRateLimit
};
