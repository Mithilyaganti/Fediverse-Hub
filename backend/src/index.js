const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const methodOverride = require('method-override');
const dotenv = require('dotenv');
const { testDatabaseConnection, initializeDatabase } = require('./config/database');
const cacheService = require('./services/cacheService');

// Import routes
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const fediverseRoutes = require('./routes/fediverse');
const feedRoutes = require('./routes/feed');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(methodOverride('X-HTTP-Method-Override')); // Allow method override via header

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('FediStream backend API is running!');
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', fediverseRoutes);
app.use('/api/feed', feedRoutes);

// Add database status endpoint
app.get('/health', async (req, res) => {
    try {
        const dbConnected = await testDatabaseConnection();
        const cacheConnected = cacheService.isReady();
        
        res.json({
            status: 'ok',
            database: dbConnected ? 'connected' : 'disconnected',
            cache: cacheConnected ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            database: 'error',
            cache: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

async function startServer() {
    try {
        // Test database connection
        const dbConnected = await testDatabaseConnection();
        if (!dbConnected) {
            console.error('❌ Database connection failed');
            throw new Error('Unable to connect to database');
        }

        // Initialize database schema
        await initializeDatabase();

        // Initialize Redis cache
        try {
            await cacheService.connect();
            console.log('🔗 Cache service initialized successfully');
        } catch (error) {
            console.warn('⚠️  Cache service failed to initialize (continuing without cache):', error.message);
        }

        // Start the server
        app.listen(PORT, () => {
            console.log(`🚀 Server listening on port ${PORT}`);
            console.log(`📊 Health check available at http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    const { closeDatabaseConnection } = require('./config/database');
    
    try {
        // Close database connection
        await closeDatabaseConnection();
        console.log('✅ Database connection closed');
        
        // Close cache connection
        await cacheService.disconnect();
        console.log('✅ Cache connection closed');
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
    }
    
    process.exit(0);
});

// Start the server
startServer();
