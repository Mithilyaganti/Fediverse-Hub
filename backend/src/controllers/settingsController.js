const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.getSettings = async (req, res) => {
    try {
        const userId = req.userId;
        const result = await pool.query('SELECT theme FROM settings WHERE user_id = $1', [userId]);
        if (result.rows.length === 0) {
            // Return default settings if not set
            return res.json({ settings: { theme: 'light' } });
        }
        res.json({ settings: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings.' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const userId = req.userId;
        const { theme } = req.body;
        // Only allow updating known fields
        if (theme && !['light', 'dark'].includes(theme)) {
            return res.status(400).json({ error: 'Invalid theme value.' });
        }
        // Upsert settings
        await pool.query(
            `INSERT INTO settings (user_id, theme, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id) DO UPDATE SET theme = EXCLUDED.theme, updated_at = NOW()`,
            [userId, theme || 'light']
        );
        res.json({ message: 'Settings updated.', settings: { theme: theme || 'light' } });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update settings.' });
    }
}; 