# Phase 7: Define Initial Database Schema for User Management

## What Was Done

1. **Created an initial SQL migration script (`backend/initialize_schema.sql`)**
   - Defined the `users` table for core user accounts (UUID PK, email, password hash, timestamps).
   - Defined the `user_profiles` table for profile info (display name, bio, avatar, FK to users).
   - Defined the `settings` table for user preferences (theme, FK to users).
   - Used `IF NOT EXISTS` and `ON DELETE CASCADE` for safe, modular, and extensible schema design.

2. **Prepared for easy schema initialization:**
   - The script can be run directly against the Postgres container using `psql`.
   - No migration tool is required for this initial setup, but the structure is compatible with future migration tools if needed.

## How It Works (for Interview)
- The `users` table stores core authentication data and timestamps for auditing.
- The `user_profiles` table is separated for extensibility (profile fields can grow without cluttering the main user table).
- The `settings` table is modular, allowing for easy addition of new user preferences.
- All tables use UUIDs for primary keys, supporting distributed/federated scenarios.
- Foreign keys use `ON DELETE CASCADE` to keep data consistent when users are deleted.

## Troubleshooting & How Issues Were Resolved
- **Problem:** `gen_random_uuid()` function does not exist error.
  - **Solution:** Enable the `pgcrypto` extension in your database with: `CREATE EXTENSION IF NOT EXISTS "pgcrypto";` (run this before the schema script if needed).
- **Problem:** Permission errors when running the script.
  - **Solution:** Ensure you connect as the correct Postgres user (e.g., `fedistream`) with sufficient privileges.
- **Problem:** Tables already exist.
  - **Solution:** The script uses `IF NOT EXISTS` to avoid errors on repeated runs.

## Verification
1. **Start the Postgres container:**
   ```sh
   docker compose up -d postgres
   ```
2. **Run the schema script against the database:**
   ```sh
   docker compose exec -T postgres psql -U fedistream -d fedistream < backend/initialize_schema.sql
   ```
3. **Check the tables:**
   ```sh
   docker compose exec -T postgres psql -U fedistream -d fedistream -c '\dt'
   # Should list users, user_profiles, settings
   ```
4. **Check columns and relationships:**
   ```sh
   docker compose exec -T postgres psql -U fedistream -d fedistream -c '\d users'
   docker compose exec -T postgres psql -U fedistream -d fedistream -c '\d user_profiles'
   docker compose exec -T postgres psql -U fedistream -d fedistream -c '\d settings'
   ```

## Next Steps
- Implement user authentication and settings API endpoints in the backend.
- Continue following the plan in `todo.md` for further modular development. 