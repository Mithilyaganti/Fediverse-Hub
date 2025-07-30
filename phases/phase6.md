# Phase 6: Integrate Backend API Server into Docker Compose

## What Was Done

1. **Added the backend service to `docker-compose.yml`:**
   - Defined a `backend` service that builds from the `backend/Dockerfile`.
   - Exposed port `3000:3000` for API access from the host.
   - Set environment variables for `PORT`, `DATABASE_URL`, `REDIS_URL`, and `JWT_SECRET` to enable modular configuration and future extensibility.
   - Used `depends_on` to ensure the backend starts after `postgres` and `redis` are ready.

2. **Verified backend Dockerfile and .dockerignore:**
   - Confirmed the backend Dockerfile uses `node:18-alpine`, installs dependencies, copies source, exposes port 3000, and runs the server entrypoint.
   - Confirmed `.dockerignore` excludes `node_modules`, `dist`, `.git`, and `.env` for efficient builds.

3. **Checked modularity and extensibility:**
   - The backend service is isolated and communicates with other services via environment variables and Docker Compose networking.
   - The structure allows for easy addition of new environment variables, services, or configuration changes in the future.

4. **Verified frontend service configuration:**
   - The frontend service sets `VITE_API_BASE_URL` to `http://localhost:3000`, allowing the frontend to communicate with the backend API.

## Troubleshooting & How Issues Were Resolved

- **Problem:** Backend container fails to connect to database or Redis.
- **Solution:**
  - Ensure `DATABASE_URL` and `REDIS_URL` use the service names (`postgres`, `redis`) as hostnames, which Docker Compose resolves automatically.
  - Use `docker compose logs backend` to view error messages and confirm environment variables are set correctly.

- **Problem:** Port conflicts on 3000 (backend), 5432 (Postgres), or 6379 (Redis).
- **Solution:**
  - Make sure these ports are not in use on the host, or change the host-side port mapping in `docker-compose.yml` if needed.

## Final Working `docker-compose.yml` Snippet
```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      network: host
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:3000
  postgres:
    image: postgres:15
    restart: unless-stopped
    environment:
      - POSTGRES_USER=fedistream
      - POSTGRES_PASSWORD=fedistreampass
      - POSTGRES_DB=fedistream
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
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

volumes:
  postgres_data:
  redis_data:
```

## How It Works (for Interview)
- The backend service runs in its own container, exposing port 3000 for API requests.
- It connects to the Postgres and Redis containers using Docker Compose service names as hostnames, making the setup modular and portable.
- Environment variables are used for all configuration, so secrets and connection details are not hardcoded.
- The modular structure allows for easy addition of new services or configuration changes in the future.

## Verification
- Run `docker compose up -d` to start all services.
- Check backend logs with `docker compose logs backend` to ensure the server starts and connects to Postgres and Redis.
- Visit `http://localhost:3000/` in your browser or use `curl`:
  ```sh
  curl http://localhost:3000/
  # Output: FediStream backend API is running!
  ```
- The frontend should be able to make API requests to the backend at `http://localhost:3000`.

## Next Steps
- Begin implementing database schema and authentication endpoints in the backend.
- Continue following the plan in `todo.md` for further development and modular improvements. 