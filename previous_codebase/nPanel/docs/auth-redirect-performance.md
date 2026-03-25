# Login / Register Redirect Slowness – Causes & Fixes

## Why it can feel slow

1. **Extra round-trip after sign-in**  
   After `signIn.email()` succeeds, the client calls `GET /api/auth/redirect-target` to know where to send the user (e.g. `/agency/dashboard` or `/{slug}/dashboard`). That’s a full request/response, so redirect happens only after that call finishes.

2. **Retry delay when session isn’t ready**  
   If the first `redirect-target` call runs before the new session/cookie is visible to the server, it returns “go to login”. The client then waits **200ms** (reduced from 400ms) and calls `redirect-target` again. So in the worst case you get: 1st call → 200ms wait → 2nd call → redirect.

3. **Heavy work in `getRootRedirectTarget()`**  
   The redirect-target API does:
   - **Session**: Better Auth `getSession()` (DB).
   - **User + role**: From session + your DB.
   - **Customers**: `getCustomerTeamRedirectPath()`:
     - Look up team (e.g. by `lastAccessedTeamId` or list teams).
     - Update `user.lastAccessedTeamId`.
     - Write to `user_activity_log`.  
   So you have several DB round-trips before the redirect URL is returned.

4. **Full page reload**  
   Redirect uses `window.location.replace(target)`, so the browser does a full navigation and reloads the destination (HTML, JS, layout, data). That’s normal but adds to “time until I see the app”.

5. **Destination page load**  
   The first load of `/agency/dashboard` or `/{slug}/dashboard` runs auth again, layouts, and data fetching. If that’s slow, it adds to the overall “login felt slow” feeling.

## What we’ve optimized

- **Retry delay**: Reduced from 400ms to 200ms when the first redirect-target returns login (so the “wait then retry” case is shorter).
- **Redirect-target response time**: Activity log write for “team accessed” is no longer awaited before returning the redirect path; we do the user update, return the path, and log in the background so the API responds faster.

## If it’s still slow

- **Measure**: In DevTools → Network, check:
  - `POST .../sign-in` (or your sign-in endpoint) duration.
  - `GET /api/auth/redirect-target` duration (and whether it’s called once or twice).
- **Database**: Ensure indexes on `session`, `user`, and `team_member` (and any columns you filter by). Cold or distant DB makes every step above slower.
- **Consider**: Returning the redirect URL from the sign-in flow (e.g. custom callback or cookie) so the client can redirect without calling redirect-target (one less round-trip).
