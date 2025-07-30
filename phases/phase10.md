# Phase 10: Implement Mastodon OAuth2 Integration (Part A - Initiate Flow)

## What Was Done

1. **Created a modular endpoint to initiate Mastodon OAuth2 flow:**
   - `POST /api/auth/mastodon/connect`: Accepts `instance_url` in the request body, generates the Mastodon authorization URL, and returns it to the frontend.

2. **Modularized backend structure:**
   - Added `src/controllers/mastodonAuthController.js` for endpoint logic.
   - Added `src/services/mastodonAuthService.js` for Mastodon-specific OAuth2 logic.
   - Updated `src/routes.js` to include the new endpoint.

3. **Used best practices:**
   - All logic is modular and extensible for future platforms or additional OAuth2 steps.
   - Environment variables are used for Mastodon client ID and redirect URI.
   - Input validation and error handling are clear and RESTful.

## How It Works (for Interview)
- **Initiate Connect:**
  - The frontend calls `POST /api/auth/mastodon/connect` with `{ instance_url }`.
  - The backend constructs the Mastodon OAuth2 authorization URL using the provided instance, the app's client ID, redirect URI, and required scopes.
  - The backend returns the URL to the frontend, which can then redirect the user to Mastodon for authentication.
- **Modularity:**
  - All Mastodon-specific logic is in a service file, making it easy to add support for more platforms or change OAuth2 details.
  - Environment variables allow for easy configuration per deployment.

## Troubleshooting & How Issues Were Resolved
- **Problem:** Missing or invalid `instance_url`.
  - **Solution:** Returns 400 Bad Request with clear error message.
- **Problem:** Invalid instance URL format.
  - **Solution:** Service validates the URL and throws an error if invalid.
- **Problem:** Environment variables not set.
  - **Solution:** Returns a clear error or uses placeholder values for development.

## Verification
1. **Start all services:**
   ```sh
   docker compose up -d
   ```
2. **Test initiate connect:**
   ```sh
   curl -X POST http://localhost:3000/api/auth/mastodon/connect -H 'Content-Type: application/json' -d '{"instance_url":"https://mastodon.social"}'
   # Should return { "authorization_url": "https://mastodon.social/oauth/authorize?..." }
   ```
3. **Test with invalid instance_url:**
   ```sh
   curl -X POST http://localhost:3000/api/auth/mastodon/connect -H 'Content-Type: application/json' -d '{"instance_url":"not-a-url"}'
   # Should return 400 error
   ```

## Next Steps
- Implement Mastodon OAuth2 callback handling (exchange code for tokens, store connection).
- Continue following the plan in `todo.md` for further modular development. 