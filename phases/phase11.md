# Phase 11: Implement Mastodon OAuth2 Integration (Part B - Handle Callback)

## What Was Done

1. **Created a modular endpoint to handle Mastodon OAuth2 callback:**
   - `GET /api/auth/mastodon/callback`: Receives `code` and `instance_url`, exchanges code for tokens, fetches Mastodon user profile, and stores the connection in the `user_servers` table.

2. **Updated database schema:**
   - Added `user_servers` table to store Mastodon (and future platform) connections, including user_id, platform, instance_url, remote_user_id, access_token, refresh_token, timestamps.

3. **Modularized backend structure:**
   - Added `handleCallback` to `src/controllers/mastodonAuthController.js`.
   - Added `exchangeCodeForToken` and `fetchUserProfile` to `src/services/mastodonAuthService.js` (using node-fetch for HTTP requests).
   - Updated `src/routes.js` to include the callback endpoint.
   - Added `node-fetch` as a dependency.

4. **Used best practices:**
   - All logic is modular and extensible for future platforms or additional OAuth2 steps.
   - Environment variables are used for Mastodon client ID, client secret, and redirect URI.
   - Input validation and error handling are clear and RESTful.
   - Upserts into `user_servers` for idempotency.

## How It Works (for Interview)
- **OAuth2 Callback:**
  - Mastodon redirects to `/api/auth/mastodon/callback?code=...&instance_url=...` after user authorizes the app.
  - The backend exchanges the code for access/refresh tokens, fetches the user's Mastodon profile, and stores the connection in the `user_servers` table.
  - The backend then redirects the user to the frontend (success page or dashboard).
- **Modularity:**
  - All Mastodon-specific logic is in a service file, making it easy to add support for more platforms or change OAuth2 details.
  - The `user_servers` table is designed for multi-platform extensibility.

## Troubleshooting & How Issues Were Resolved
- **Problem:** Missing or invalid `code` or `instance_url`.
  - **Solution:** Returns 400 Bad Request with clear error message.
- **Problem:** Token exchange or profile fetch fails.
  - **Solution:** Returns 500 error with a generic message (details in logs).
- **Problem:** Environment variables not set.
  - **Solution:** Returns a clear error or uses placeholder values for development.
- **Problem:** No user session/JWT for associating user_id.
  - **Solution:** For now, uses a placeholder user_id; in production, use state param or session to link to the logged-in user.

## Verification
1. **Start all services:**
   ```sh
   docker compose up -d
   ```
2. **Test OAuth2 flow:**
   - Initiate connect as in Phase 10 to get the authorization URL.
   - Visit the URL, authorize the app, and let Mastodon redirect to the callback endpoint.
   - Check the `user_servers` table in the database for the new connection.
3. **Check error handling:**
   - Try the callback with missing or invalid parameters to verify error responses.

## Next Steps
- Implement actual user association (use state/JWT to link OAuth2 connection to logged-in user).
- Continue following the plan in `todo.md` for further modular development. 