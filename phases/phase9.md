# Phase 9: Implement User Settings API

## What Was Done

1. **Created modular user settings API endpoints in the backend:**
   - `GET /api/settings`: Fetch user settings (requires JWT auth).
   - `PUT /api/settings`: Update user settings (requires JWT auth, only allows valid values).

2. **Modularized backend structure:**
   - Added `src/controllers/settingsController.js` for settings logic.
   - Reused `authMiddleware` for authentication.
   - Updated `src/routes.js` to include settings endpoints.

3. **Used best practices:**
   - Only allows updating known fields (currently `theme`).
   - Uses upsert (insert or update) for settings.
   - Returns default settings if none exist.
   - All DB access uses parameterized queries with pg.
   - Error handling and status codes are clear and RESTful.

## How It Works (for Interview)
- **Get Settings:** Authenticated user requests their settings. If not set, returns defaults (e.g., theme: 'light').
- **Update Settings:** Authenticated user can update their settings (currently only theme, extensible for more fields). Only valid values are accepted.
- **Modularity:** Logic is separated into controllers and routes for easy extension (add more settings fields, validation, etc.).

## Troubleshooting & How Issues Were Resolved
- **Problem:** Invalid theme value.
  - **Solution:** Returns 400 Bad Request with clear error message.
- **Problem:** JWT errors (missing, invalid, expired).
  - **Solution:** Returns 401 Unauthorized with clear error message.
- **Problem:** Database connection issues.
  - **Solution:** Uses environment variable for DATABASE_URL. Check logs and DB status.

## Verification
1. **Start all services:**
   ```sh
   docker compose up -d
   ```
2. **Test get settings:**
   ```sh
   curl http://localhost:3000/api/settings -H 'Authorization: Bearer <token>'
   ```
3. **Test update settings:**
   ```sh
   curl -X PUT http://localhost:3000/api/settings -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"theme":"dark"}'
   ```
4. **Test invalid value:**
   ```sh
   curl -X PUT http://localhost:3000/api/settings -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"theme":"invalid"}'
   # Should return 400 error
   ```

## Next Steps
- Implement Mastodon OAuth2 integration (initiate flow).
- Continue following the plan in `todo.md` for further modular development. 