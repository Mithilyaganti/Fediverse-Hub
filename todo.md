Okay, here is the revised plan for your AI Copilot, incorporating Dockerization from the start and breaking down tasks into smaller, sequential phases.

---

# AFTER COMPLETION OF EACH PHASE CHECK IF THE PROJECT IS WORKING OR NOT AND GENERATE A NEW FILE IN A PHASES FOLDER NAMED WITH THE PHASE NAME( EX: PHASE1.MD). IT SHOULD CONTAIN ALL THE THINGS YOU DID IN THIS PHASE AND ALSO HOW YOU DID IT AND IF YOU NEED TO EXPLAIN ME SOME SOME CODE DO THAT ALSO, CAUSE I CAN LEARN AND EXPLAIN TO THE INTERVIWER IF ANY ONE ASKS ME HOW SOMETHING IS BUILT IN THE PROJECT

# FediStream - Federated Social Aggregator - Development Plan for AI Copilot

## 1. Project Overview: Why This Project?

**Purpose:**
FediStream aims to solve the fragmentation problem in the Fediverse (federated social media ecosystem). Currently, users must visit multiple separate platforms (like Mastodon, Lemmy, PeerTube) to see content from their network. This project aggregates content from these diverse platforms into a single, unified, user-friendly interface, enhancing discoverability and streamlining interaction. A key innovation is implementing a deeply nested, Reddit-style threaded comment system instead of the flat replies common on some platforms.

**Key Goals:**
*   **Centralization of Content:** Provide a single feed aggregating posts from various Fediverse instances and platforms.
*   **Enhanced Interaction:** Offer a consistent way to interact with content (vote, comment, like) regardless of its original platform.
*   **Improved Readability:** Implement better threading (Reddit-style) than some current platforms.
*   **Modern User Experience:** Deliver a responsive, themable (dark/light mode) web application.

## 2. Overall Architecture Approach

The application will be a **modular, decoupled system** consisting of:

*   **Frontend (Already Built - React/TypeScript):** Provides the user interface. Communicates with the backend via REST API. Handles UI state, routing, and rendering. Will be containerized separately.
*   **Backend API Server:** The core service handling business logic, authentication, content aggregation, user management, and interaction proxying. Built as a REST API. Will be containerized.
*   **Database:** Stores user accounts, preferences, cached content, and local interaction data (votes, comments). Will run in a container.
*   **Caching Layer & Background Jobs:** Improves performance by caching frequently accessed data and handles periodic tasks like fetching new posts. Redis will be used for both and run in a container.
*   **Platform Integrations (Modules):** Separate, modular components or services dedicated to interacting with each specific Fediverse platform's API (Mastodon, Lemmy, PeerTube). These will be integrated into the backend.

All services will be containerized using Docker and orchestrated using Docker Compose for local development.

## 3. Technology Stack

*   **Frontend:** React 18+ with TypeScript, Vite, Tailwind CSS, shadcn/ui, React Query, React Router DOM (Already chosen and partially implemented).
*   **Backend API Server:** Node.js with Express.js.
*   **Database:** PostgreSQL.
*   **Caching & Background Jobs:** Redis (Used for both caching and job queue management, e.g., with BullMQ).
*   **Authentication:** Passport.js (or similar OAuth2 library) for handling OAuth flows with Fediverse platforms.
*   **Containerization:** Docker & Docker Compose.

## 4. Phased Development Plan (Sequential Parts)

This plan breaks down the backend development into manageable, sequential parts. Each part should be a self-contained module or set of functionalities that can be developed, tested, and run within Docker.

### Phase 1: Dockerize the Existing Frontend

**Objective:** Set up Docker for the frontend application that you have already built.

**What to Code/Configure:**
1.  Create a `Dockerfile` in the root of your frontend project directory.
    *   Use a Node.js base image (e.g., `node:18-alpine`).
    *   Set the working directory inside the container.
    *   Copy `package*.json` and run `npm install`.
    *   Copy the rest of the frontend source code.
    *   Expose the port Vite uses (typically 5173).
    *   Define the `CMD` to run the development server (e.g., `npm run dev -- --host`).
2.  Create a `.dockerignore` file to exclude `node_modules`, `dist`, etc.
3.  Update the frontend's development server command (in `vite.config.js` or `package.json`) to listen on `0.0.0.0` instead of `localhost` to work correctly inside the container.

### Phase 2: Set Up Docker Compose Skeleton

**Objective:** Create a `docker-compose.yml` file to orchestrate the entire application stack, starting with just the frontend.

**What to Code/Configure:**
1.  Create a `docker-compose.yml` file in the root of your main project directory (or a dedicated `docker` folder).
2.  Define a service for the frontend:
    *   Build from the `Dockerfile` created in Phase 1.
    *   Map the exposed port (e.g., `5173:5173`) to access the frontend from the host.
    *   Mount the source code volume (e.g., `.:/app`) for live reloading during development.
    *   Set environment variables if needed (e.g., `VITE_API_BASE_URL`).
3.  Add a basic `version` (e.g., `version: '3.8'`) to the top of the file.

### Phase 3: Set Up PostgreSQL Container

**Objective:** Add a PostgreSQL database service to the Docker Compose setup.

**What to Code/Configure:**
1.  Add a new service block for `postgres` in `docker-compose.yml`.
    *   Use the official `postgres` image (e.g., `postgres:15`).
    *   Set environment variables for `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`.
    *   Expose port `5432` to the host for direct database access if needed (optional for development).
    *   Define a volume to persist database data (e.g., `postgres_data:/var/lib/postgresql/data`).
2.  Add a named volume definition at the bottom of `docker-compose.yml` (e.g., `volumes: postgres_data:`).

### Phase 4: Set Up Redis Container

**Objective:** Add a Redis service to the Docker Compose setup for caching and background jobs.

**What to Code/Configure:**
1.  Add a new service block for `redis` in `docker-compose.yml`.
    *   Use the official `redis` image (e.g., `redis:7-alpine`).
    *   Expose port `6379` to the host (optional for development).
    *   Define a volume to persist Redis data if needed (e.g., `redis_data:/data`).
2.  Add the named volume definition for Redis (e.g., `redis_data:`).

### Phase 5: Initialize Backend API Server Structure

**Objective:** Create the basic structure and Docker setup for the Node.js/Express backend API server.

**What to Code/Configure:**
1.  Create a new directory for the backend (e.g., `backend`).
2.  Inside the `backend` directory:
    *   Initialize a new Node.js project (`npm init -y`).
    *   Install core dependencies: `express`, `cors`, `helmet`, `dotenv`, `pg` (PostgreSQL client), `redis`, `bullmq`, `passport`, `jsonwebtoken`, `bcryptjs`.
    *   Create a basic folder structure (e.g., `src/`, `src/controllers/`, `src/routes/`, `src/models/`, `src/middleware/`, `src/config/`, `src/services/`, `src/utils/`).
    *   Create a basic Express server entry point (e.g., `src/index.js` or `src/server.js`) with middleware setup (body parser, CORS, helmet). Make it listen on a configurable port (e.g., from environment variable `PORT`, default 3000).
3.  Create a `Dockerfile` inside the `backend` directory.
    *   Use a Node.js base image.
    *   Set working directory.
    *   Copy `package*.json` and run `npm install`.
    *   Copy the backend source code.
    *   Expose the backend port (e.g., 3000).
    *   Define the `CMD` to run the server (e.g., `node src/index.js`).
4.  Create a `.dockerignore` file inside the `backend` directory.

### Phase 6: Integrate Backend into Docker Compose

**Objective:** Add the newly created backend service to the Docker Compose setup and configure networking.

**What to Code/Configure:**
1.  Add a new service block for `api` (or `backend`) in `docker-compose.yml`.
    *   Build from the `backend/Dockerfile`.
    *   Map the exposed port (e.g., `3000:3000`).
    *   Mount the backend source code volume for live reloading during development (if desired).
    *   Set environment variables for database connection (`DATABASE_URL`), Redis connection (`REDIS_URL` or individual host/port vars), and potentially `PORT`.
    *   Use `depends_on` to ensure `postgres` and `redis` are started before the backend attempts to connect.
2.  Update the frontend service in `docker-compose.yml` to set the `VITE_API_BASE_URL` environment variable to point to the backend service (e.g., `http://api:3000` or `http://localhost:3000` depending on context - likely `http://localhost:3000` for the browser running on the host accessing the exposed port).

### Phase 7: Define Database Schema

**Objective:** Define the initial database tables required for user management.

**What to Code/Configure:**
1.  Inside the `backend` directory, create SQL scripts or use a migration tool (like `node-pg-migrate`) to define tables:
    *   `users`: `id` (UUID/PK), `email` (Unique), `password_hash`, `created_at`, `updated_at`.
    *   `user_profiles`: `id` (UUID/PK/FK to users), `display_name`, `bio`, `avatar_url`, etc.
    *   `settings`: `user_id` (FK/PK), `theme` (dark/light), etc.
2.  Create a script or mechanism (e.g., using a library like `pg` in a setup script) to execute these schema definitions against the PostgreSQL database when the backend starts (or manually for now).

### Phase 8: Implement User Authentication API (Local)

**Objective:** Build the core user authentication endpoints (signup, login, logout, get user) for local accounts.

**What to Code/Configure:**
1.  Create route files (e.g., `src/routes/auth.js`) to define endpoints:
    *   `POST /api/auth/signup`: Register a new local user. Hash password, store in `users` table. Return success or error.
    *   `POST /api/auth/login`: Authenticate local user (check email/password). Generate JWT token. Return token and user data.
    *   `POST /api/auth/logout`: Handle logout (primarily client-side invalidation for JWT).
    *   `GET /api/auth/user`: Get current user details. Requires authentication middleware. Return user data.
2.  Implement controller functions (e.g., `src/controllers/authController.js`) to handle the logic for these routes.
3.  Implement authentication middleware (e.g., `src/middleware/auth.js`) to verify JWT tokens on protected routes.
4.  Ensure the backend server loads these routes.

### Phase 9: Implement User Settings API

**Objective:** Create endpoints for users to manage their settings.

**What to Code/Configure:**
1.  Create route file (e.g., `src/routes/settings.js`):
    *   `GET /api/settings`: Get user settings. Requires auth.
    *   `PUT /api/settings`: Update user settings. Requires auth.
2.  Implement controller functions (e.g., `src/controllers/settingsController.js`) to handle getting and updating settings in the `settings` table.
3.  Load these routes in the main server file.

### Phase 10: Implement Mastodon OAuth2 Integration (Part A - Initiate Flow)

**Objective:** Allow users to connect their Mastodon accounts by initiating the OAuth2 flow.

**What to Code/Configure:**
1.  Create a route (e.g., in `src/routes/auth.js` or a new `src/routes/fediverse.js`):
    *   `POST /api/auth/mastodon/connect`: Accept `instance_url` in the request body. Generate the Mastodon authorization URL using the instance's OAuth endpoints and your app's client ID/secret (stored in environment variables). Redirect the user (or send the URL to the frontend to handle redirect).
2.  Create a service (e.g., `src/services/mastodonAuthService.js`) containing the logic to construct the authorization URL.

### Phase 11: Implement Mastodon OAuth2 Integration (Part B - Handle Callback)

**Objective:** Handle the OAuth2 callback from Mastodon, exchange the code for tokens, and store the connection.

**What to Code/Configure:**
1.  Create a route:
    *   `GET /api/auth/mastodon/callback`: This is the URL you register with Mastodon as the redirect URI. It receives the `code` and `state` parameters.
2.  In the controller/route handler:
    *   Extract the `code`.
    *   Use the `mastodonAuthService` to exchange the `code` for an access token by making a POST request to the Mastodon instance's `/oauth/token` endpoint.
    *   Fetch the user's Mastodon profile details using the access token.
    *   Save the `access_token`, `refresh_token` (if provided), `instance_url`, `user_id` (local), and `remote_user_id` (Mastodon's ID) into a `user_servers` table in the database.
    *   Redirect the user back to the frontend application (e.g., to a success page or dashboard).

### Phase 12: Create Basic Feed Endpoint

**Objective:** Set up the endpoint structure for fetching the aggregated feed, initially returning mock or placeholder data.

**What to Code/Configure:**
1.  Create a route file (e.g., `src/routes/feed.js`):
    *   `GET /api/feed/timeline`: Fetch and return a list of posts. Initially, this can return an empty array or static mock data.
2.  Implement a basic controller (e.g., `src/controllers/feedController.js`).
3.  Load the feed routes.

### Phase 13: Set Up Redis Caching

**Objective:** Integrate Redis into the backend for caching purposes.

**What to Code/Configure:**
1.  In the backend, install a Redis client library (e.g., `ioredis` or use the one already installed `redis`).
2.  Create a configuration or service file (e.g., `src/config/redis.js` or `src/services/cacheService.js`) to establish a connection to the Redis container using environment variables (host: `redis`, port: `6379`).
3.  Modify the `GET /api/auth/user` endpoint or another suitable endpoint to demonstrate caching: fetch user data, store it in Redis with a TTL, and on subsequent requests, check Redis first before querying the database.

### Phase 14: Set Up Background Job Queue (BullMQ)

**Objective:** Configure BullMQ to manage background tasks, like fetching posts.

**What to Code/Configure:**
1.  Ensure `bullmq` is installed.
2.  Create a configuration or service file (e.g., `src/services/queueService.js`) to initialize a BullMQ `Queue` and `Worker`. Connect them to the Redis instance.
3.  Define a basic job processor function (e.g., a placeholder that logs "Fetching posts...").
4.  Create a mechanism (e.g., an endpoint or startup script) to add a sample job to the queue to test the setup.

### Phase 15: Implement Mastodon Content Fetching (Basic)

**Objective:** Fetch posts from a connected Mastodon account's home timeline and store them in the database.

**What to Code/Configure:**
1.  Create a service (e.g., `src/services/mastodonApiClient.js`) to make authenticated requests to the Mastodon API. It should take the access token and instance URL.
2.  Create a service or extend `contentAggregator.js` logic to:
    *   Query the `user_servers` table for connected Mastodon accounts.
    *   For each account, use `mastodonApiClient` to call the Mastodon API (e.g., `/api/v1/timelines/home`).
    *   Normalize the fetched Mastodon `Status` objects into a common `Post` schema.
    *   Insert or update these normalized posts into a `posts` cache table in PostgreSQL. Define this table schema (id, original_id, platform, instance_url, author_username, content, timestamp, url, etc.).
3.  Update the BullMQ job processor created in Phase 14 to call this content fetching logic.

### Phase 16: Populate Feed Endpoint with Cached Posts

**Objective:** Make the `/api/feed/timeline` endpoint return actual posts fetched and cached in Phase 15.

**What to Code/Configure:**
1.  Update the `feedController.js`:
    *   Instead of returning mock data, query the `posts` table in PostgreSQL.
    *   Implement basic pagination using query parameters (`limit`, `offset` or `cursor`).
    *   Return the list of posts ordered by timestamp.

### Phase 17: Implement Basic Interaction Proxy (Mastodon Like)

**Objective:** Allow users to like a post aggregated from Mastodon through the FediStream interface.

**What to Code/Configure:**
1.  Create a route:
    *   `POST /api/feed/posts/:postId/like`: Accept the local `postId`.
2.  Implement controller logic:
    *   Find the post in the `posts` table by `postId`.
    *   Verify the post's `platform` is 'mastodon'.
    *   Find the corresponding user's Mastodon access token from `user_servers`.
    *   Use `mastodonApiClient` to send a POST request to Mastodon's `/api/v1/statuses/:id/favourite` endpoint.
    *   Return success or error to the frontend.

### Phase 18: Implement Local Commenting System

**Objective:** Allow users to comment on aggregated posts, storing comments locally in the database.

**What to Code/Configure:**
1.  Define the `comments` table schema in the database (id, post_id, parent_comment_id, author_user_id, content, timestamp, upvotes, downvotes).
2.  Create routes:
    *   `GET /api/posts/:postId/comments`: Fetch comments for a post, potentially handling nested structure.
    *   `POST /api/posts/:postId/comments`: Create a new comment. Accept `content` and optionally `parent_comment_id` in the request body.
3.  Implement controller logic to handle getting and creating comments in the `comments` table.

### Phase 19: Implement Local Comment Voting

**Objective:** Allow users to upvote/downvote comments stored locally.

**What to Code/Configure:**
1.  Decide on a data model for storing votes (e.g., a `comment_votes` table: user_id, comment_id, vote_type).
2.  Create routes:
    *   `POST /api/comments/:commentId/vote`: Accept `vote_type` (up/down/none) in the request body.
3.  Implement controller logic to record the vote and update the comment's `upvotes`/`downvotes` count in the `comments` table.

### Phase 20: Add Lemmy Integration (Authentication & Basic Fetching)

**Objective:** Reuse the established patterns to add Lemmy support.

**What to Code/Configure:**
1.  Create routes for Lemmy OAuth/JWT login (e.g., `POST /api/auth/lemmy/connect`).
2.  Implement `lemmyAuthService.js` to handle Lemmy's login process (username/password -> JWT).
3.  Store Lemmy credentials (JWT, instance) in `user_servers`.
4.  Create `lemmyApiClient.js` for making authenticated requests to Lemmy.
5.  Modify the content fetching logic and BullMQ job to also fetch from connected Lemmy accounts (e.g., user's subscribed communities).
6.  Normalize Lemmy `Post`/`Comment` data into the common schema and store in the `posts` table.
7.  Update the feed endpoint to include Lemmy posts.

*(Continue similar steps for PeerTube and other advanced features like real-time updates, search, etc., building upon the established modular structure and Docker setup.)*

## 5. Modularity for Future Improvements

*   **Platform Integrations:** Each platform (Mastodon, Lemmy, PeerTube) has its own auth, API client, and potentially interaction services (`*AuthService.js`, `*ApiClient.js`). This makes adding or modifying support for a specific platform easier.
*   **Services:** Core functionalities like authentication, content aggregation, caching, and interactions are separated into distinct service files.
*   **Routes/Controllers:** Group related endpoints and their logic into specific route and controller files.
*   **Configuration:** Centralize configuration (database, Redis, API keys) using environment variables.
*   **Docker:** Each major component (Frontend, Backend, DB, Redis) runs in its own container, defined in `docker-compose.yml`, promoting isolation and scalability.