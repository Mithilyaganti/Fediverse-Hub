# Phase 7: Define Database Schema

## What Was Done

1. **Created a comprehensive database schema** in `/backend/src/database/schema.sql`:
   - **Users table**: Core user authentication with UUID primary key, email (unique), password hash, and timestamps
   - **User profiles table**: Extended user information (display name, bio, avatar URL)
   - **Settings table**: User preferences (theme, language, notifications)
   - **User servers table**: Connected Fediverse accounts (Mastodon, Lemmy, etc.) with OAuth tokens
   - **Posts table**: Cached content from various platforms with normalized schema
   - **Comments table**: Local comments system with nested threading support
   - **Comment votes table**: Voting system for local comments

2. **Database Configuration System**:
   - Created `/backend/src/config/database.js` for connection pool management
   - Implemented database initialization function that reads and executes schema.sql
   - Added connection testing and graceful shutdown functionality

3. **Database Query Utilities** in `/backend/src/database/queries.js`:
   - Generic query execution functions
   - Transaction support
   - CRUD operations helpers (insert, update, delete, getOne, getMany)
   - Error handling and connection management

4. **Database Setup Script** in `/backend/src/database/setup.js`:
   - Standalone script for database initialization
   - Can be run independently for setup/reset operations

5. **Enhanced Backend Server** in `/backend/src/index.js`:
   - Added automatic database connection testing on startup
   - Automatic schema initialization when server starts
   - New `/health` endpoint for monitoring database connectivity
   - Graceful shutdown handling for database connections

## Database Schema Details

### Core Tables
- **users**: Authentication and basic user data
- **user_profiles**: Extended profile information
- **settings**: User preferences and configuration
- **user_servers**: Connected Fediverse platform accounts
- **posts**: Aggregated content cache from all platforms
- **comments**: Local commenting system
- **comment_votes**: User voting on comments

### Key Features
- **UUID Primary Keys**: All tables use UUID for better scalability
- **Foreign Key Constraints**: Proper relationships with CASCADE deletes
- **Indexes**: Performance optimization for common queries
- **Triggers**: Automatic `updated_at` timestamp updates
- **JSON Fields**: Flexible storage for media attachments, tags, mentions
- **Constraints**: Data validation (theme choices, vote types)

## Troubleshooting & How Issues Were Resolved

- **Problem**: Interactive psql commands can get stuck in terminal sessions.
- **Solution**: Always use non-interactive commands with `-c` flag and limit output with `head` or `tail`.

- **Problem**: Database connection timing during container startup.
- **Solution**: Implemented proper `depends_on` in docker-compose and connection testing before schema initialization.

- **Problem**: Schema idempotency (running multiple times).
- **Solution**: Used `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` to make schema creation safe to run multiple times.

## Current Working Database Schema
```sql
-- Key tables created:
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    language VARCHAR(10) DEFAULT 'en',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Plus user_servers, posts, comments, comment_votes tables...
```

## How It Works (for Interview)

### Database Design Philosophy
- **Normalized Structure**: Separated user authentication, profiles, and settings for better data management
- **Federated Integration**: `user_servers` table designed to handle multiple platform connections per user
- **Content Aggregation**: `posts` table provides a unified schema for content from different platforms
- **Local Enhancements**: Comments and voting system adds value beyond what individual platforms offer

### Connection Management
- **Connection Pooling**: Uses `pg.Pool` for efficient connection management
- **Automatic Initialization**: Schema is created automatically when the backend starts
- **Health Monitoring**: `/health` endpoint provides real-time database status
- **Graceful Shutdown**: Proper cleanup of database connections on server shutdown

### Schema Features
- **UUID Keys**: Better for distributed systems and privacy
- **Cascade Deletes**: Automatic cleanup when users are deleted
- **Timestamps**: Automatic tracking of creation and modification times
- **Indexes**: Optimized for common query patterns (user lookups, content feeds)
- **JSON Storage**: Flexible storage for platform-specific metadata

### Migration Strategy
- **Idempotent Scripts**: Schema can be run multiple times safely
- **Extension Management**: Automatically enables required PostgreSQL extensions
- **Trigger Functions**: Automatic timestamp updates reduce application complexity

## Verification Steps

1. **Database Connection**: ✅ Backend connects successfully to PostgreSQL
2. **Schema Creation**: ✅ All 7 tables created with proper structure
3. **Health Endpoint**: ✅ Returns database status at `/health`
4. **Automatic Initialization**: ✅ Schema loads on backend startup
5. **Container Integration**: ✅ Works seamlessly with Docker Compose

## Database Tables Verification
```
              List of relations
 Schema |     Name      | Type  |   Owner    
--------+---------------+-------+------------
 public | comment_votes | table | fedistream
 public | comments      | table | fedistream
 public | posts         | table | fedistream
 public | settings      | table | fedistream
 public | user_profiles | table | fedistream
 public | user_servers  | table | fedistream
 public | users         | table | fedistream
```

## What's Next (Phase 8)

Phase 8 will implement the User Authentication API with:
- User registration (signup) endpoint
- User login endpoint with JWT tokens
- Authentication middleware for protected routes
- User profile retrieval endpoint
- Password hashing with bcrypt

The database schema is now ready to support all the authentication and user management functionality!
