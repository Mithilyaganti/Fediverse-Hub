# Phase 2: Set Up Docker Compose Skeleton

## What Was Done

1. **Moved all frontend code into a `frontend/` directory**
   - This prepares the project for a multi-service setup (frontend, backend, db, etc.).
   - All React app files, configs, and Dockerfile are now under `frontend/`.

2. **Created/Updated `docker-compose.yml`**
   - Defined a `frontend` service:
     - Build context set to `./frontend`.
     - Uses the Dockerfile in the `frontend` directory.
     - Exposes port `5173:5173` for Vite dev server.
     - Sets environment variable `VITE_API_BASE_URL` for future backend integration.
   - Removed all volumes for now (pure Docker, no live reload) to avoid node_modules issues.

3. **Troubleshooting & Fixes**
   - Initial attempts to use bind mounts for live reload caused `vite: not found` errors due to node_modules being hidden/overwritten.
   - Solution: Use only Docker image's node_modules, no bind mounts.
   - Ensured `vite` is present in `devDependencies` in `frontend/package.json`.
   - If you ever see `vite: not found`, it means devDependencies were not installed (check for `.npmrc` or use `npm install --include=dev`).

4. **Rebuilt and ran the service**
   - Used `docker compose build --no-cache frontend` to ensure a clean install.
   - Used `docker compose up -d frontend` to start the service.
   - Confirmed the frontend is accessible at `http://localhost:5173`.

## Final Working `docker-compose.yml`
```yaml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:3000
```

## How It Works (for Interview)
- The frontend code is isolated in its own directory, making the project modular and ready for backend/db services.
- Docker Compose orchestrates the build and run of the frontend container, exposing the Vite dev server to the host.
- No volumes are used, so the container always uses its own installed dependencies, avoiding node_modules issues.
- The environment variable is set up for easy backend API integration in later phases.

## Verification
- After running `docker compose up -d frontend`, the logs show:
  ```
  > vite_react_shadcn_ts@0.0.0 dev
  > vite --host
    VITE v5.4.10  ready in XXXX ms
    ➜  Local:   http://localhost:5173/
    ➜  Network: http://172.17.0.2:5173/
  ```
- Accessing `http://localhost:5173` in a browser shows the running frontend app.

## Next Steps
- Add backend, database, and other services to the Compose file in future phases.
- Continue following the plan in `todo.md` for the next phase. 