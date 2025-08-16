const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, query, transaction } = require('../database/queries');
const cacheService = require('../services/cacheService');

/**
 * Generate JWT token for user
 */
function generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Register a new user
 * POST /api/auth/signup
 */
async function signup(req, res) {
    try {
        const { email, password, displayName } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Email and password are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email',
                message: 'Please provide a valid email address'
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                error: 'Weak password',
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await getOne(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser) {
            return res.status(409).json({
                error: 'User already exists',
                message: 'An account with this email already exists'
            });
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user and profile in a transaction
        const result = await transaction(async (client) => {
            // Create user
            const userResult = await client.query(
                'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
                [email.toLowerCase(), passwordHash]
            );
            const user = userResult.rows[0];

            // Create user profile
            await client.query(
                'INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)',
                [user.id, displayName || null]
            );

            // Create default settings
            await client.query(
                'INSERT INTO settings (user_id) VALUES ($1)',
                [user.id]
            );

            return user;
        });

        // Generate JWT token
        const token = generateToken(result.id);

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: result.id,
                email: result.email,
                createdAt: result.created_at
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: 'An error occurred during registration. Please try again.'
        });
    }
}

/**
 * Authenticate user login
 * POST /api/auth/login
 */
async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'Email and password are required'
            });
        }

        // Get user from database
        const user = await getOne(
            'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user.id);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: 'An error occurred during login. Please try again.'
        });
    }
}

/**
 * Handle user logout
 * POST /api/auth/logout
 */
async function logout(req, res) {
    // For JWT tokens, logout is primarily handled client-side by removing the token
    // In a more complex setup, you might maintain a blacklist of tokens
    res.json({
        message: 'Logout successful',
        info: 'Please remove the token from client storage'
    });
}

/**
 * Get current user details
 * GET /api/auth/user
 */
async function getCurrentUser(req, res) {
    try {
        const userId = req.user.id;
        const cacheKey = `user:${userId}:profile`;

        // Try to get from cache first
        let userWithProfile = await cacheService.get(cacheKey);
        
        if (userWithProfile) {
            console.log(`📦 Cache HIT for user ${userId}`);
            return res.json({ user: userWithProfile, cache_hit: true });
        }

        console.log(`🔍 Cache MISS for user ${userId}, fetching from database`);

        // Get user details with profile from database
        const dbResult = await getOne(`
            SELECT 
                u.id, u.email, u.created_at, u.updated_at,
                p.display_name, p.bio, p.avatar_url,
                s.theme, s.language, s.notifications_enabled, s.email_notifications
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN settings s ON u.id = s.user_id
            WHERE u.id = $1
        `, [userId]);

        if (!dbResult) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account could not be found'
            });
        }

        // Structure the user data
        const userData = {
            id: dbResult.id,
            email: dbResult.email,
            displayName: dbResult.display_name,
            bio: dbResult.bio,
            avatarUrl: dbResult.avatar_url,
            settings: {
                theme: dbResult.theme,
                language: dbResult.language,
                notificationsEnabled: dbResult.notifications_enabled,
                emailNotifications: dbResult.email_notifications
            },
            createdAt: dbResult.created_at,
            updatedAt: dbResult.updated_at
        };

        // Cache the user data for 5 minutes (300 seconds)
        const cached = await cacheService.set(cacheKey, userData, 300);
        if (cached) {
            console.log(`💾 Cached user data for ${userId}`);
        }

        res.json({
            user: userData,
            cache_hit: false
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            error: 'Failed to get user data',
            message: 'An error occurred while retrieving user information'
        });
    }
}

module.exports = {
    signup,
    login,
    logout,
    getCurrentUser
};
