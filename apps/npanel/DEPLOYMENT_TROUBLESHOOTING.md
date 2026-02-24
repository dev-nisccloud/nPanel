# Deployment troubleshooting

## Preventing 500 Internal Server Error

All code paths that run for GET "/" (and the root layout) are hardened so they **never throw** uncaught. Below is the full list of guards.

### Proxy (`src/proxy.ts`) — Next.js 16+ request boundary (formerly middleware)

| Risk | Guard |
|------|--------|
| Any throw in proxy | Outer `try/catch` → `NextResponse.next()` so request continues |
| `req.nextUrl` or `pathname` undefined (proxy) | `pathname = (req.nextUrl?.pathname ?? "").trim()` |
| Root path as `""`, `"//"`, `" / "` | Normalize with `replace(/\/+/g, "/")`, treat `""` or `"/"` as root |
| `new Headers(req.headers)` or `.set()` throws | Root branch in try/catch → `NextResponse.next()` on failure |
| `isSessionValid` throws (e.g. cookies read-only) | try/catch in `isSessionValid`, return `false` on error |
| `new URL(..., req.url)` or `NextResponse.redirect` throws | `safeRedirectToLogin()` in try/catch, return `null` → caller uses `NextResponse.next()` |

### Root layout (`src/app/layout.tsx`)

| Risk | Guard |
|------|--------|
| `headers()` throws | Inner try/catch, default `pathname = "/"` |
| `x-pathname` missing or odd (`"//"`, whitespace) | Normalize like middleware; `isRootPath` = `""` or `"/"` |
| `getPreference` throws | try/catch, use default theme mode/preset |
| Any other throw in layout | Outer try/catch → `<SafeRedirectToLogin />` (200 + redirect). Re-throw only `NEXT_REDIRECT` |
| Font loader | Must be `const` at module scope (Next.js requirement); no try/catch allowed. |

### Layout module load (before request)

| Risk | Guard |
|------|--------|
| `APP_CONFIG` throws | `buildAppConfig()` in try/catch, export `FALLBACK_CONFIG` on error |
| `metadata` / `viewport` | Use only `APP_CONFIG` (now safe) and literals |

### Server actions (`src/server/server-actions.ts`)

| Risk | Guard |
|------|--------|
| `cookies()` or `cookie.value` throws in `getPreference` | try/catch, return `fallback` so caller never sees throw |

### API route used by root page (`src/app/api/auth/redirect-target/route.ts`)

| Risk | Guard |
|------|--------|
| `getRootRedirectTarget()` throws | try/catch, always return 200 with `{ redirect: "/auth/login" }` (never 5xx) |

### Summary

- **Root path**: Handled as `""` or `"/"` (and normalized variants) in both proxy and layout; minimal HTML returned, no DB/auth.
- **Redirects**: Built inside `safeRedirectToLogin()`; if URL/redirect fails, request is passed through instead of 500.
- **Session check**: `isSessionValid` never throws; on error treats as not logged in.
- **Layout**: All async and render paths in try/catch; only `NEXT_REDIRECT` is re-thrown.

### Production 500 on GET / (fixed by Service Worker update)

If you fixed the issue **locally** by changing the Service Worker (redirect mode, chrome-extension, etc.), production can still show 500 because **users’ browsers keep using the old cached SW**. The old SW causes "a redirected response was used for a request whose redirect mode is not 'follow'" and the request fails.

**What we did so production gets the new SW:**

1. **Cache-bust the registration** – The app registers `/sw.js?v=3`. After each deploy where you change the SW, bump the version (e.g. to `?v=4`) in `src/hooks/use-notification.ts` so every client fetches the new script and installs the new SW.
2. **Don’t cache sw.js** – In `next.config.ts`, `/sw.js` is served with `Cache-Control: no-store, max-age=0` so the browser always gets the latest file when checking for updates.

After deploying, users may need one reload (or close and reopen the tab) so the new SW installs. Existing tabs might keep the old SW until the next visit.

### Finding the real error when you still get 500

**Instrumentation** (`src/instrumentation.ts`) logs every request error so it appears in Cloud Run.

1. Deploy the app (with the instrumentation file).
2. Reproduce the 500 (open `https://your-run-url/`).
3. In **Google Cloud Console** → **Logging**, filter by your service and search for **`[onRequestError]`**.
4. The log line will show: **message**, **path** (e.g. `/`), **routePath**, **routeType**, **digest**, and **stack**.

Use that message and stack to fix the failing code (e.g. missing env, import error, or runtime exception).
