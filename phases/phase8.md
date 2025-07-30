# Phase 8: Implement User Authentication API (Local)

## What Was Done

1. **Created modular authentication API endpoints in the backend:**
   - `/api/auth/signup`: Register a new user (hash password, store in users table).
   - `/api/auth/login`: Authenticate user, generate JWT token.
   - `/api/auth/logout`: Endpoint for extensibility (JWT logout is client-side).
   - `/api/auth/user`: Get current user details (JWT-protected).

2. **Modularized backend structure:**
   - Added `src/routes.js` for route definitions.
   - Added `src/controllers/authController.js` for authentication logic.
   - Added `src/middleware/auth.js` for JWT authentication middleware.
   - Updated `src/index.js` to use modular routes.

3. **Used best practices:**
   - Passwords are hashed with bcryptjs.
   - JWT tokens are signed with a secret and expire in 7 days.
   - All DB access uses parameterized queries with pg.
   - Error handling and status codes are clear and RESTful.

## How It Works (for Interview)
- **Signup:** User submits email and password. Password is hashed and stored. Duplicate emails are rejected.
- **Login:** User submits email and password. If valid, a JWT is returned. The JWT is used for authenticated requests.
- **Logout:** Endpoint exists for future extensibility (JWT logout is client-side).
- **Get User:** Requires a valid JWT. Returns user info (id, email, created_at).
- **Modularity:** All logic is separated into controllers, middleware, and routes for easy extension (e.g., OAuth, more endpoints).

## Troubleshooting & How Issues Were Resolved
- **Problem:** Duplicate email on signup.
  - **Solution:** Returns 409 Conflict with clear error message.
- **Problem:** Invalid credentials on login.
  - **Solution:** Returns 401 Unauthorized.
- **Problem:** JWT errors (missing, invalid, expired).
  - **Solution:** Returns 401 Unauthorized with clear error message.
- **Problem:** Database connection issues.
  - **Solution:** Uses environment variable for DATABASE_URL. Check logs and DB status.

## Verification
1. **Start all services:**
   ```sh
   docker compose up -d
   ```
2. **Test signup:**
   ```sh
   curl -X POST http://localhost:3000/api/auth/signup -H 'Content-Type: application/json' -d '{"email":"test@example.com","password":"testpass"}'
   ```
3. **Test login:**
   ```sh
   curl -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"test@example.com","password":"testpass"}'
   # Save the returned token
   ```
4. **Test get user:**
   ```sh
   curl http://localhost:3000/api/auth/user -H 'Authorization: Bearer <token>'
   ```
5. **Test logout:**
   ```sh
   curl -X POST http://localhost:3000/api/auth/logout -H 'Authorization: Bearer <token>'
   ```

## Next Steps
- Implement user settings API endpoints.
- Continue following the plan in `todo.md` for further modular development. 