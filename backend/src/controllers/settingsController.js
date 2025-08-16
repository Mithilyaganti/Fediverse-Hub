const { getOne, update, query } = require('../database/queries');
const cacheService = require('../services/cacheService');

/**
 * Get user settings
 * GET /api/settings
 */
async function getSettings(req, res) {
    try {
        // Get settings for the authenticated user
        const settings = await getOne(`
            SELECT 
                user_id,
                theme,
                language,
                notifications_enabled,
                email_notifications,
                created_at,
                updated_at
            FROM settings 
            WHERE user_id = $1
        `, [req.user.id]);

        if (!settings) {
            // If no settings exist, create default settings
            const defaultSettings = await query(`
                INSERT INTO settings (user_id) 
                VALUES ($1) 
                RETURNING 
                    user_id,
                    theme,
                    language,
                    notifications_enabled,
                    email_notifications,
                    created_at,
                    updated_at
            `, [req.user.id]);
            
            const newSettings = defaultSettings.rows[0];
            return res.json({
                settings: {
                    userId: newSettings.user_id,
                    theme: newSettings.theme,
                    language: newSettings.language,
                    notificationsEnabled: newSettings.notifications_enabled,
                    emailNotifications: newSettings.email_notifications,
                    createdAt: newSettings.created_at,
                    updatedAt: newSettings.updated_at
                }
            });
        }

        res.json({
            settings: {
                userId: settings.user_id,
                theme: settings.theme,
                language: settings.language,
                notificationsEnabled: settings.notifications_enabled,
                emailNotifications: settings.email_notifications,
                createdAt: settings.created_at,
                updatedAt: settings.updated_at
            }
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            error: 'Failed to get settings',
            message: 'An error occurred while retrieving user settings'
        });
    }
}

/**
 * Update user settings
 * PUT /api/settings
 */
async function updateSettings(req, res) {
    try {
        const { theme, language, notificationsEnabled, emailNotifications } = req.body;
        
        // Build update object with only provided fields
        const updateData = {};
        
        if (theme !== undefined) {
            // Validate theme value
            if (!['light', 'dark'].includes(theme)) {
                return res.status(400).json({
                    error: 'Invalid theme',
                    message: 'Theme must be either "light" or "dark"'
                });
            }
            updateData.theme = theme;
        }
        
        if (language !== undefined) {
            // Validate language (basic validation for common language codes)
            if (typeof language !== 'string' || language.length > 10) {
                return res.status(400).json({
                    error: 'Invalid language',
                    message: 'Language must be a valid language code (max 10 characters)'
                });
            }
            updateData.language = language;
        }
        
        if (notificationsEnabled !== undefined) {
            if (typeof notificationsEnabled !== 'boolean') {
                return res.status(400).json({
                    error: 'Invalid notifications setting',
                    message: 'Notifications enabled must be a boolean value'
                });
            }
            updateData.notifications_enabled = notificationsEnabled;
        }
        
        if (emailNotifications !== undefined) {
            if (typeof emailNotifications !== 'boolean') {
                return res.status(400).json({
                    error: 'Invalid email notifications setting',
                    message: 'Email notifications must be a boolean value'
                });
            }
            updateData.email_notifications = emailNotifications;
        }
        
        // Check if any fields to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: 'No fields to update',
                message: 'Please provide at least one field to update'
            });
        }
        
        // Update settings in database
        const updatedSettings = await update('settings', updateData, { user_id: req.user.id });
        
        if (!updatedSettings) {
            return res.status(404).json({
                error: 'Settings not found',
                message: 'User settings could not be found or updated'
            });
        }
        
        res.json({
            message: 'Settings updated successfully',
            settings: {
                userId: updatedSettings.user_id,
                theme: updatedSettings.theme,
                language: updatedSettings.language,
                notificationsEnabled: updatedSettings.notifications_enabled,
                emailNotifications: updatedSettings.email_notifications,
                createdAt: updatedSettings.created_at,
                updatedAt: updatedSettings.updated_at
            }
        });

        // Invalidate user profile cache since settings have changed
        const cacheKey = `user:${req.user.id}:profile`;
        const cacheDeleted = await cacheService.del(cacheKey);
        if (cacheDeleted) {
            console.log(`🗑️  Invalidated cache for user ${req.user.id} after settings update`);
        }
        
    } catch (error) {
        console.error('Update settings error:', error);
        
        // Handle specific database errors
        if (error.code === '23514') { // Check constraint violation
            return res.status(400).json({
                error: 'Invalid settings value',
                message: 'One or more settings values are invalid'
            });
        }
        
        res.status(500).json({
            error: 'Failed to update settings',
            message: 'An error occurred while updating user settings'
        });
    }
}

/**
 * Reset user settings to defaults
 * POST /api/settings/reset
 */
async function resetSettings(req, res) {
    try {
        // Reset to default values
        const resetData = {
            theme: 'light',
            language: 'en',
            notifications_enabled: true,
            email_notifications: true
        };
        
        const resetSettings = await update('settings', resetData, { user_id: req.user.id });
        
        if (!resetSettings) {
            return res.status(404).json({
                error: 'Settings not found',
                message: 'User settings could not be found'
            });
        }
        
        res.json({
            message: 'Settings reset to defaults successfully',
            settings: {
                userId: resetSettings.user_id,
                theme: resetSettings.theme,
                language: resetSettings.language,
                notificationsEnabled: resetSettings.notifications_enabled,
                emailNotifications: resetSettings.email_notifications,
                createdAt: resetSettings.created_at,
                updatedAt: resetSettings.updated_at
            }
        });
    } catch (error) {
        console.error('Reset settings error:', error);
        res.status(500).json({
            error: 'Failed to reset settings',
            message: 'An error occurred while resetting user settings'
        });
    }
}

module.exports = {
    getSettings,
    updateSettings,
    resetSettings
};
