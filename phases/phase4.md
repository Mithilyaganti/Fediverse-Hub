# Phase 4: Set Up Redis Container

## What Was Done

1. **Added a Redis service to `docker-compose.yml`:**
   - Used the official `redis:7-alpine` image for the Redis service.
   - Exposed port `6379` to the host for direct access during development.
   - Defined a named volume (`redis_data`) to persist Redis data across container restarts.
   - Set `restart: unless-stopped` for reliability.

2. **Updated the `docker-compose.yml` file:**
   - Added the `redis` service block with all necessary configuration.
   - Added the `redis_data` volume to the `volumes` section at the bottom for persistent storage.

## Troubleshooting & How Issues Were Resolved

- **Problem:** If the Redis container fails to start, it is usually due to port conflicts or volume permission issues.
- **Solution:**
  - Make sure port `6379` is not already in use on the host.
  - Use `docker compose logs redis` to view detailed error messages from the container.
  - If there are volume permission issues, try removing the volume with `docker volume rm fediverse-hub_redis_data` and restarting the service.

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

volumes:
  postgres_data:
  redis_data:
```

## How It Works (for Interview)
- The `redis` service runs a Redis 7 instance in a container, exposing the default port for use by the backend and for development/debugging.
- The data is stored in a Docker-managed volume (`redis_data`), so it persists even if the container is stopped or removed.
- Exposing port `6379` allows you to connect to Redis from your host machine using tools like `redis-cli` or a GUI client for development and debugging.
- The `restart: unless-stopped` policy ensures Redis will restart automatically unless explicitly stopped.

## Verification
- After running `docker compose up -d redis`, check the logs with `docker compose logs redis` to ensure the service started successfully.
- You should see output like:
  ```
  1:C 01 Jan 2024 00:00:00.000 # oO0OoO0OoO0Oo Redis is starting oO0OoO0OoO0Oo
  1:M 01 Jan 2024 00:00:00.000 * Ready to accept connections
  ```
- You can connect to Redis from your host with:
  ```sh
  redis-cli -h localhost -p 6379
  ```
- The volume `redis_data` will appear in `docker volume ls` and persist data.

## Next Steps
- Integrate the backend API server and connect it to this Redis service in the next phase.
- Continue following the plan in `todo.md` for further development. 