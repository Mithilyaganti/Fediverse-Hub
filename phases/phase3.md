# Phase 3: Set Up PostgreSQL Container

## What Was Done

1. **Added a PostgreSQL service to `docker-compose.yml`:**
   - Used the official `postgres:15` image for the database service.
   - Set environment variables for `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` to configure the database credentials and name.
   - Exposed port `5432` to the host for direct database access during development.
   - Defined a named volume (`postgres_data`) to persist database data across container restarts.

2. **Updated the `docker-compose.yml` file:**
   - Added the `postgres` service block with all necessary configuration.
   - Added the `volumes` section at the bottom to define the persistent storage for PostgreSQL.

## Troubleshooting & How Issues Were Resolved

- **Problem:** If the database container fails to start, it is usually due to port conflicts or incorrect environment variables.
- **Solution:**
  - Make sure port `5432` is not already in use on the host.
  - Double-check the environment variables for typos.
  - Use `docker compose logs postgres` to view detailed error messages from the container.

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

volumes:
  postgres_data:
```

## How It Works (for Interview)
- The `postgres` service runs a PostgreSQL 15 database in a container, configured with a username, password, and database name for the application.
- The data is stored in a Docker-managed volume (`postgres_data`), so it persists even if the container is stopped or removed.
- Exposing port `5432` allows you to connect to the database from your host machine using tools like `psql` or a GUI client for development and debugging.
- The environment variables make it easy to change credentials or database names without modifying the image or code.

## Verification
- After running `docker compose up -d postgres`, check the logs with `docker compose logs postgres` to ensure the database started successfully.
- You should see output like:
  ```
  PostgreSQL Database directory appears to contain a database; Skipping initialization
  2024-XX-XX XX:XX:XX.XXX UTC [1] LOG:  database system is ready to accept connections
  ```
- You can connect to the database from your host with:
  ```sh
  psql -h localhost -U fedistream -d fedistream
  # Password: fedistreampass
  ```
- The volume `postgres_data` will appear in `docker volume ls` and persist data.

## Next Steps
- Integrate the backend API server and connect it to this PostgreSQL service in the next phase.
- Continue following the plan in `todo.md` for further development. 