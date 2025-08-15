const { initializeDatabase, testDatabaseConnection, closeDatabaseConnection } = require('../config/database');

async function setupDatabase() {
    console.log('🔄 Setting up database...');
    
    try {
        // Test connection first
        const connected = await testDatabaseConnection();
        if (!connected) {
            throw new Error('Cannot connect to database');
        }

        // Initialize schema
        await initializeDatabase();
        
        console.log('✅ Database setup completed successfully!');
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    } finally {
        await closeDatabaseConnection();
    }
}

// Run if called directly
if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase };
