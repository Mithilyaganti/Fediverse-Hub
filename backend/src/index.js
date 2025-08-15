const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const methodOverride = require('method-override');
const dotenv = require('dotenv');
const { testDatabaseConnection, initializeDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');

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

// Add database status endpoint
app.get('/health', async (req, res) => {
    try {
        const dbConnected = await testDatabaseConnection();
        res.json({
            status: 'ok',
            database: dbConnected ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Initialize database and start server
async function startServer() {
    try {
        // Test database connection
        const dbConnected = await testDatabaseConnection();
        if (!dbConnected) {
            throw new Error('Unable to connect to database');
        }

        // Initialize database schema
        await initializeDatabase();

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
    await closeDatabaseConnection();
    process.exit(0);
});

// Start the server
startServer(); 