const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Create a connection pool
const pool = new Pool(dbConfig);

// Function to initialize the database schema
async function initializeDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Initializing database schema...');
        
        // Read the schema file
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute the schema
        await client.query(schema);
        
        console.log('✅ Database schema initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing database schema:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Function to test database connection
async function testDatabaseConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection successful:', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}

// Function to close the database connection pool
async function closeDatabaseConnection() {
    try {
        await pool.end();
        console.log('✅ Database connection pool closed');
    } catch (error) {
        console.error('❌ Error closing database connection pool:', error);
    }
}

module.exports = {
    pool,
    initializeDatabase,
    testDatabaseConnection,
    closeDatabaseConnection,
};
