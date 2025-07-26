# Phase 1: Dockerize the Existing Frontend

## What Was Done

1. **Created a Dockerfile** for the React frontend:
   - Used `node:18-alpine` as the base image for a lightweight environment.
   - Set the working directory to `/app`.
   - Copied `package*.json` and installed dependencies with `npm install`.
   - Copied the rest of the source code into the container.
   - Exposed port `5173` (Vite's default).
   - Set the container's command to run the Vite dev server on `0.0.0.0` for external access using the local install: `CMD ["npm", "run", "dev", "--", "--host"]`.

2. **Created a `.dockerignore` file** to exclude unnecessary files from the Docker build context:
   - Excluded `node_modules`, `dist`, `.git`, and other files to speed up builds and reduce image size.

3. **Updated Vite configuration** in `vite.config.ts`:
   - Set the dev server to listen on `0.0.0.0` and port `5173` to match Docker and allow access from the host.

## Troubleshooting & How Issues Were Resolved

- **Problem:** The build or run would sometimes fail with a DNS error (`EAI_AGAIN`) or a Vite module not found error.
- **Root Cause:**
  - The DNS error was due to Docker's internal network sometimes failing to resolve npm registry addresses. This was fixed by building with `--network=host`.
  - The Vite module not found error happened when the install step failed or when trying to run Vite globally or with `npx` instead of using the local install. The fix was to always use the local install via `npm run dev`.
- **Solution:**
  - Used `docker build --network=host --no-cache -t fedistream-frontend .` to ensure a clean, successful install of all dependencies.
  - Used `CMD ["npm", "run", "dev", "--", "--host"]` in the Dockerfile to always use the local Vite install from `node_modules`.
  - Confirmed the Vite dev server starts and is accessible at `http://localhost:5173`.

## Final Working Dockerfile
```Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

## How It Works (for Interview)
- The Dockerfile sets up a Node.js environment, installs dependencies, and runs the Vite dev server so you can develop and preview your React app inside a container.
- The `.dockerignore` file ensures that unnecessary files are not sent to the Docker daemon, making builds faster and images smaller.
- The Vite config ensures the dev server is accessible from outside the container, which is required for Dockerized development.
- Using `--network=host` during build ensures npm can always reach the registry, avoiding DNS issues that sometimes occur in Docker's default network mode.
- Using the local Vite install (not global or npx) ensures all config and plugins work as expected, since Vite is present in `node_modules`.

## Verification
- After building and running the container, the Vite dev server was accessible at `http://localhost:5173`.
- The output confirmed:
  ```
  > vite_react_shadcn_ts@0.0.0 dev
  > vite --host
    VITE v5.4.10  ready in 2750 ms
    ➜  Local:   http://localhost:5173/
    ➜  Network: http://172.17.0.2:5173/
  ```
- A `curl` request to `localhost:5173` returned `HTTP/1.1 200 OK`, confirming the frontend is running inside Docker.

## Next Steps
- Proceed to Phase 2 (Docker Compose skeleton) after confirming the frontend works in Docker. 