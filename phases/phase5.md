# Phase 5: Initialize Backend API Server Structure

## What Was Done

1. **Created the `backend/` directory** for the Node.js/Express backend API server.

2. **Initialized a new Node.js project:**
   - Added a `package.json` with all required dependencies: `express`, `cors`, `helmet`, `dotenv`, `pg`, `redis`, `bullmq`, `passport`, `jsonwebtoken`, `bcryptjs`.
   - Added a `.env.example` file with example values for `PORT`, `DATABASE_URL`, `REDIS_URL`, and `JWT_SECRET`.

3. **Created a basic folder structure:**
   - Added `src/index.js` as the main entry point.
   - The entry point sets up Express, CORS, Helmet, dotenv, and a root route.

4. **Created a `Dockerfile` for the backend:**
   - Used `node:18-alpine` as the base image.
   - Set the working directory, copied `package*.json`, ran `npm install`, copied the rest of the backend source, exposed port 3000, and set the command to run the server.

5. **Created a `.dockerignore` file** to exclude `node_modules`, `dist`, `.git`, and `.env` from the Docker build context.

6. **Added the backend service to `docker-compose.yml`:**
   - Configured the backend to build from `backend/Dockerfile`, expose port 3000, set environment variables, and depend on `postgres` and `redis` services.

## Troubleshooting & How Issues Were Resolved

- **Problem:** If the backend container fails to start, it is usually due to missing dependencies, port conflicts, or missing environment variables.
- **Solution:**
  - Make sure all dependencies are listed in `package.json` and installed.
  - Ensure port `3000` is not already in use on the host.
  - Double-check environment variables in `docker-compose.yml` and `.env.example`.
  - Use `docker compose logs backend` to view error messages.

## Final Working `docker-compose.yml` Snippet
```yaml
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - DATABASE_URL=postgres://fedistream:fedistreampass@postgres:5432/fedistream
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your_jwt_secret_here
    depends_on:
      - postgres
      - redis
```

## Final Working `backend/Dockerfile` Snippet
```Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

## How It Works (for Interview)
- The backend service runs a Node.js/Express server in a container, exposing port 3000 for API requests.
- The backend connects to the PostgreSQL and Redis containers using environment variables for connection strings.
- The Dockerfile ensures all dependencies are installed and the server starts automatically.
- The `.dockerignore` file keeps the image small and builds fast by excluding unnecessary files.
- The `.env.example` file documents required environment variables for local development and deployment.

## Verification
- After running `docker compose up -d backend`, check the logs with `docker compose logs backend` to ensure the server started successfully.
- You should see output like:
  ```
  Server listening on port 3000
  ```
- You can test the backend by visiting `http://localhost:3000/` in your browser or with `curl`:
  ```sh
  curl http://localhost:3000/
  # Output: FediStream backend API is running!
  ```

## Next Steps
- Begin implementing database schema and authentication endpoints in the backend.
- Continue following the plan in `todo.md` for further development. 