# Deployment troubleshooting

## Preventing 500 Internal Server Error

All code paths that run for GET "/" (and the root layout) are hardened so they **never throw** uncaught. Below is the full list of guards.

### Middleware (`src/middleware.ts`)

| Risk | Guard |
|------|--------|
| Any throw in middleware | Outer `try/catch` → `NextResponse.next()` so request continues |
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
| `Inter()` (next/font) throws at module load | try/catch, fallback `{ className: "" }` |

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

- **Root path**: Handled as `""` or `"/"` (and normalized variants) in both middleware and layout; minimal HTML returned, no DB/auth.
- **Redirects**: Built inside `safeRedirectToLogin()`; if URL/redirect fails, request is passed through instead of 500.
- **Session check**: `isSessionValid` never throws; on error treats as not logged in.
- **Layout**: All async and render paths in try/catch; only `NEXT_REDIRECT` is re-thrown.

If a 500 still occurs, check Cloud Run / Firebase logs for the exact error (e.g. `[Middleware]`, `[RootLayout]`, or an uncaught stack trace).
