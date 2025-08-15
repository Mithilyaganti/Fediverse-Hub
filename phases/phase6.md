# Phase 6: Integrate Backend into Docker Compose

## What Was Done

1. **Backend service was already integrated into `docker-compose.yml`:**
   - The backend service is properly defined with build context pointing to `./backend`.
   - Port mapping `3000:3000` exposes the backend API to the host.
   - Environment variables are configured for database and Redis connections.
   - `depends_on` ensures PostgreSQL and Redis start before the backend.

2. **Verified Docker Compose networking:**
   - All services are running successfully in the same Docker network.
   - Backend can connect to PostgreSQL using `postgres:5432` (internal Docker networking).
   - Backend can connect to Redis using `redis:6379` (internal Docker networking).
   - Frontend can access backend via `backend:3000` (internal Docker networking).
   - Host can access frontend at `localhost:5173` and backend at `localhost:3000`.

3. **Environment Variables Configuration:**
   - `DATABASE_URL=postgres://fedistream:fedistreampass@postgres:5432/fedistream`
   - `REDIS_URL=redis://redis:6379`
   - `JWT_SECRET=your_jwt_secret_here`
   - `VITE_API_BASE_URL=http://localhost:3000` (for browser access from host)

## Troubleshooting & How Issues Were Resolved

- **Problem:** Docker permission denied when running `docker compose up -d`.
- **Solution:** Used `sudo docker compose up -d` to run with proper permissions.

- **Problem:** Ensuring proper networking between services.
- **Solution:** 
  - Used Docker Compose's default networking which creates a bridge network.
  - Services can communicate using service names as hostnames.
  - Backend connects to `postgres:5432` and `redis:6379` internally.
  - Frontend (browser) connects to `localhost:3000` for API calls.

## Current Working `docker-compose.yml`
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

### Docker Compose Networking
- **Default Bridge Network:** Docker Compose creates a default bridge network where all services can communicate using service names as hostnames.
- **Internal Communication:** Backend connects to PostgreSQL using `postgres:5432` and Redis using `redis:6379`.
- **External Access:** Services expose ports to the host (frontend: 5173, backend: 3000, postgres: 5432, redis: 6379).

### Service Dependencies
- **`depends_on`:** Ensures PostgreSQL and Redis containers start before the backend container.
- **Environment Variables:** Backend receives database and Redis connection strings via environment variables.
- **Port Mapping:** Allows host machine to access services and frontend (browser) to access backend API.

### Frontend-Backend Communication
- **Browser Context:** The React app runs in the browser on the host machine, so it accesses the backend via `http://localhost:3000`.
- **Container Context:** If services need to communicate internally, they use service names (e.g., `http://backend:3000`).

## Verification Steps
1. **All services running:** `sudo docker compose ps` shows all services as "Up".
2. **Backend API accessible:** Backend responds with "FediStream backend API is running!" at `http://localhost:3000`.
3. **Internal networking works:** Frontend container can reach backend using `http://backend:3000`.
4. **Database and Redis available:** Backend can connect to both PostgreSQL and Redis services.
5. **Frontend accessible:** Vite dev server running at `http://localhost:5173`.

## What's Next (Phase 7)
- Define database schema with tables for users, user_profiles, and settings.
- Create SQL migration scripts or use a migration tool.
- Set up database initialization when the backend starts.
