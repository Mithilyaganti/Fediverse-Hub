const jwt = require('jsonwebtoken');
const { getOne } = require('../database/queries');

/**
 * Authentication middleware to verify JWT tokens
 * Adds user object to req.user if token is valid
 */
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            error: 'Access token required',
            message: 'Please provide a valid access token in the Authorization header'
        });
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get the user from database to ensure they still exist
        const user = await getOne(
            'SELECT id, email, created_at, updated_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid token',
                message: 'User associated with this token no longer exists'
            });
        }

        // Add user to request object (without sensitive data)
        req.user = {
            id: user.id,
            email: user.email,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        };

        next();
    } catch (error) {
        console.error('Token verification error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Invalid token',
                message: 'The provided token is malformed or invalid'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expired',
                message: 'The provided token has expired. Please log in again'
            });
        } else {
            return res.status(500).json({ 
                error: 'Authentication error',
                message: 'An error occurred while verifying your token'
            });
        }
    }
}

/**
 * Optional authentication middleware
 * Adds user to req.user if token is valid, but doesn't fail if no token
 */
async function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await getOne(
            'SELECT id, email, created_at, updated_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        req.user = user ? {
            id: user.id,
            email: user.email,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        } : null;
    } catch (error) {
        req.user = null;
    }

    next();
}

module.exports = {
    authenticateToken,
    optionalAuth
};
