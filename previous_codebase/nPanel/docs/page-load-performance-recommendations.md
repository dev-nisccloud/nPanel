# Page & Menu Load Time Performance Recommendations

This document contains a full list of recommendations for improving page and menu load times in the nPanel app after login. Use it as a reference when implementing changes. Nothing here is implemented yet—these are recommendations only.

---

## Table of Contents

1. [Reduce Duplicate Session Work](#1-reduce-duplicate-session-work)
2. [Parallelize and Trim Layout Server Work](#2-parallelize-and-trim-layout-server-work)
3. [Avoid Re-fetching Session in Every Layout and Page](#3-avoid-re-fetching-session-in-every-layout-and-page)
4. [Reduce DB Round-trips in verifyTeamAccess](#4-reduce-db-round-trips-in-verifyteamaccess)
5. [Defer or Limit Header Queries (TeamSwitcher, NotificationSwitcher)](#5-defer-or-limit-header-queries-teamswitcher-notificationswitcher)
6. [Break Client-Side Data Waterfalls on Heavy Pages](#6-break-client-side-data-waterfalls-on-heavy-pages-eg-dashboard)
7. [Use Streaming So the Shell Doesn’t Wait for Everything](#7-use-streaming-so-the-shell-doesnt-wait-for-everything)
8. [Trim Dev-Only Overhead](#8-trim-dev-only-overhead)
9. [Review force-dynamic](#9-review-force-dynamic)
10. [Faster Dev Compilation](#10-faster-dev-compilation-backend-compiling)
11. [Single Shared (main) Layout](#11-single-shared-main-layout)
12. [Dashboard Page: Avoid Redundant getCurrentUser()](#12-dashboard-page-avoid-redundant-getcurrentuser)
13. [Priority Order for Implementation](#priority-order-for-implementation)

---

## 1. Reduce Duplicate Session Work

### Current behavior

- **Middleware** runs on protected routes and calls `isSessionValid()`, which performs a **fetch** to `/api/auth/get-session`.
- **Layout** (e.g. `[slug]/layout.tsx` or `agency/layout.tsx`) then runs and calls `getSession()` (in auth-server), which does **another fetch** to the same `/api/auth/get-session` endpoint.
- Result: **two session fetches per request** for every authenticated page load.

### Recommendation

- In **middleware**, only do a lightweight check—e.g. presence of the session cookie (or a minimal check that doesn’t hit the auth API). Avoid calling `/api/auth/get-session` in middleware if the layout will call it anyway.
- Alternatively, have the layout **reuse** the result of the middleware check (e.g. by having middleware set a header or use a request-scoped cache that the layout can read) so the auth API is only called **once** per request.
- Goal: **one session resolution per request**, not two.

### Files to consider

- `apps/npanel/src/middleware.ts` — `isSessionValid()` and its fetch to `/api/auth/get-session`.
- `apps/npanel/src/lib/auth-server.ts` — `getSession()` and its fetch to the same URL.

---

## 2. Parallelize and Trim Layout Server Work

### Current behavior

- **[slug] layout** (`apps/npanel/src/app/(main)/[slug]/layout.tsx`):
  - Runs sequentially: `getCurrentUser()` → `requireRole()` → `verifyTeamAccess(slug)` → `cookies()` → then three `getPreference()` calls (sidebar variant, collapsible, content layout).
  - Some of this could run in parallel.
- **Agency layout** (`apps/npanel/src/app/(main)/agency/layout.tsx`):
  - Similar pattern: `requireAuth()` (and optionally `ensureCustomerHasTeam()`) then cookies and three `getPreference()` calls.

### Recommendation

- Run **independent** work in parallel. For example:
  - Auth (getCurrentUser / requireRole / verifyTeamAccess) must stay in a sensible order.
  - Reading **cookies** and **getPreference** (which only reads cookies) does not depend on auth result for the same request—they can be started in parallel with auth where possible, or at least not delayed unnecessarily.
- Use `Promise.all` (or similar) for any group of independent async calls (e.g. auth + preferences) so the layout doesn’t wait longer than necessary.
- Keep `getPreference` as-is (cookie-only); the main gain is **avoiding unnecessary sequencing** between auth and preferences.

### Files to consider

- `apps/npanel/src/app/(main)/[slug]/layout.tsx`
- `apps/npanel/src/app/(main)/agency/layout.tsx`

---

## 3. Avoid Re-fetching Session in Every Layout and Page

### Current behavior

- **Root layout** (`apps/npanel/src/app/layout.tsx`): calls `getPreference` (theme); no session.
- **[slug] layout**: calls `getCurrentUser()` (which uses `getSession()`), then `requireRole()`, then `verifyTeamAccess()`.
- **Agency layout**: calls `requireAuth()` (which uses `getCurrentUser()` → `getSession()`).
- **Dashboard page** (`apps/npanel/src/app/(main)/[slug]/dashboard/page.tsx`): calls `getCurrentUser()` again for display name.

So session is requested from multiple places in the tree. React `cache()` in auth-server deduplicates **within the same request**, but you still have multiple call sites and the session is needed before the shell can render.

### Recommendation

- Resolve session (and optionally role) in **one place** (e.g. a single shared layout or a dedicated auth helper that runs once per request).
- Pass the result down via:
  - Props / React context, or
  - A request-scoped store or cache that other layouts and pages read from.
- Other layouts and pages should **not** call the auth API again for the same request; they should consume the already-resolved session/user.
- This reduces redundant logic and keeps “who is the user?” as a single source of truth per request.

### Files to consider

- `apps/npanel/src/app/layout.tsx`
- `apps/npanel/src/app/(main)/[slug]/layout.tsx`
- `apps/npanel/src/app/(main)/agency/layout.tsx`
- `apps/npanel/src/app/(main)/[slug]/dashboard/page.tsx`
- `apps/npanel/src/lib/auth-server.ts`

---

## 4. Reduce DB Round-trips in verifyTeamAccess

### Current behavior

- `verifyTeamAccess(slug)` in `auth-server.ts`:
  1. `getCurrentUser()` (cached per request; may still imply session work).
  2. `prisma.team.findUnique({ where: { slug } })`.
  3. `prisma.teamMember.findUnique({ where: { teamId_userId: ... } })`.
  4. If `lastAccessedTeamId` differs: a `prisma.$transaction` that updates the user and creates a `UserActivityLog` entry.

So every [slug] page load can trigger **2–3 database round-trips** (team, membership, optional transaction) before the layout finishes.

### Recommendation

- **Combine** the team and membership read into a single query where possible (e.g. one query with `include` or `select` that fetches team and the current user’s membership in one go).
- Consider making the “update lastAccessedTeamId + write activity log” **non-blocking** for the response:
  - Fire-and-forget after you’ve determined access, or
  - Move to a background job/queue so the HTTP response isn’t waiting on that write.
- Goal: **fewer DB round-trips** and **no unnecessary waiting** on non-critical writes.

### Files to consider

- `apps/npanel/src/lib/auth-server.ts` — `verifyTeamAccess()`.

---

## 5. Defer or Limit Header Queries (TeamSwitcher, NotificationSwitcher)

### Current behavior

- **TeamSwitcher** (`apps/npanel/src/app/(main)/[slug]/_components/sidebar/team-switcher.tsx`):
  - Uses `trpc.teams.getUserTeams.useQuery(...)` and shows a **spinner** until data loads.
  - **PrefetchTeams** runs in `useEffect`, so it runs **after** the layout has already rendered; it doesn’t prevent the initial TeamSwitcher spinner.
- **NotificationSwitcher** (`apps/npanel/src/app/(main)/[slug]/_components/sidebar/notification-switcher.tsx`):
  - Uses `trpc.notifications.getAll.useQuery(...)` with `enabled: true` (runs on mount).
  - Uses `trpc.notifications.getUnseenCount.useQuery(...)` (also runs on mount).
  - So **two tRPC calls** run in the header on **every** page load/navigation.

### Recommendation

- **Teams:**
  - Either **prefetch teams on the server** (e.g. in the layout or a server component) and pass the list into the shell so TeamSwitcher can render immediately with data (no client fetch for initial render), **or**
  - Keep client fetch but show a **skeleton/placeholder** instead of a spinner and let the dropdown populate when data arrives (better perceived performance).
- **Notifications:**
  - In the header, only fetch **getUnseenCount** (for the badge). Use `enabled: true` for that so the count appears.
  - For the **full list** (`getAll`), set `enabled: isOpen` (or similar) so the list is only fetched when the user **opens** the notifications popover. That removes one heavy query from every page load and speeds up navigation.

### Files to consider

- `apps/npanel/src/app/(main)/[slug]/_components/prefetch-teams.tsx`
- `apps/npanel/src/app/(main)/[slug]/_components/sidebar/team-switcher.tsx`
- `apps/npanel/src/app/(main)/[slug]/_components/sidebar/notification-switcher.tsx`
- `apps/npanel/src/app/(main)/agency/_components/sidebar/notification-switcher.tsx` (if same pattern)

---

## 6. Break Client-Side Data Waterfalls on Heavy Pages (e.g. Dashboard)

### Current behavior

- **SectionCards** (`apps/npanel/src/app/(main)/[slug]/dashboard/_components/section-cards.tsx`):
  1. `trpc.teams.getTeamIdBySlug.useQuery({ slug: teamSlug })` — waits for `teamId`.
  2. `trpc.domains.getByTeam.useQuery({ teamId })` — enabled when `teamId` exists.
  3. `trpc.invoicing.list.useQuery({ teamId, ... })` — same.
  4. `trpc.orders.getSummaryByTeam.useQuery({ teamId })` — same.
  5. `trpc.serviceSubscriptions.getAll.useQuery({ teamId })` — same.

So you have a **chain of five queries**; the last four only start after `teamId` is available. The UI waits for the slowest link in this chain.

### Recommendation

- **Option A:** Get `teamId` earlier and pass it in so the four “content” queries can start in parallel:
  - E.g. have the layout (or a parent server component) resolve `teamId` from the slug and pass it as a prop or via context, so the client doesn’t need to wait for `getTeamIdBySlug` before starting the other four.
- **Option B:** Add a **single server/API** that returns “dashboard summary” (e.g. team id, domains count/summary, invoices summary, orders summary, subscriptions summary) in one call. The client then makes **one** request instead of five and can show the section cards as soon as that returns.
- Either way, the goal is to **parallelize** the dependent queries or **collapse** them into one round-trip.

### Files to consider

- `apps/npanel/src/app/(main)/[slug]/dashboard/_components/section-cards.tsx`
- `apps/npanel/src/app/(main)/[slug]/layout.tsx` (if passing `teamId` from server)
- tRPC router(s) for teams, domains, invoicing, orders, serviceSubscriptions (if adding a dashboard summary procedure)

---

## 7. Use Streaming So the Shell Doesn’t Wait for Everything

### Current behavior

- Layouts are **fully blocking**: auth, DB (`verifyTeamAccess`, etc.), and preferences all complete before any shell (sidebar, header) is sent.
- So even though many routes have `loading.tsx`, the user often sees **nothing** until the layout has finished—because the layout itself is not streamed.

### Recommendation

- Where possible, **stream** the response:
  - Send a **minimal shell** (e.g. sidebar + header skeleton) as soon as you know “this request is allowed” (e.g. after a quick session/role check).
  - Then stream the rest (team-specific data, heavy components) in separate chunks or via Suspense boundaries.
- Concretely: resolve only what’s strictly needed for “is this route allowed?” (e.g. session + role), then **render the shell** and let team details or heavy data load in streamed server components or client components wrapped in Suspense.
- That way `loading.tsx` and skeletons are visible **sooner**, and the user perceives faster load.

### Files to consider

- `apps/npanel/src/app/(main)/[slug]/layout.tsx`
- `apps/npanel/src/app/(main)/agency/layout.tsx`
- Use of `<Suspense>` and `loading.tsx` in the app router.

---

## 8. Trim Dev-Only Overhead

### Current behavior

- **auth-server.ts** has many `console.log` calls (e.g. in `getSession`, `requireAuth`, `requireRole`, redirect paths). In development these run on **every** request and add I/O and string work.
- Next.js config uses `compiler.removeConsole` only in **production**, so dev keeps all logs.

### Recommendation

- **Guard** verbose logs with a dev/debug flag, e.g.:
  - `if (process.env.NODE_ENV === 'development' && process.env.DEBUG_AUTH === 'true') { console.log(...) }`, or
  - Remove or reduce the noisiest logs so that normal dev requests aren’t slowed by logging.
- Goal: keep logging available for debugging when needed, but avoid slowing every request in dev.

### Files to consider

- `apps/npanel/src/lib/auth-server.ts` — all `console.log` / `console.error` usages.

---

## 9. Review force-dynamic

### Current behavior

- **[slug] layout** and **agency layout** both use `export const dynamic = "force-dynamic"`. So every request to these segments is dynamic; nothing is statically optimized or cached at the edge.

### Recommendation

- Keep `force-dynamic` only where you **truly** need fresh auth/team data on every request.
- If any sub-segment could be static or use a short `revalidate`, consider **removing** `force-dynamic` from that segment so Next.js can optimize (and so dev doesn’t re-execute as much).
- This is a trade-off: less dynamic execution can improve both dev and production performance, but you must ensure security and correctness (e.g. no stale user/team data).

### Files to consider

- `apps/npanel/src/app/(main)/[slug]/layout.tsx`
- `apps/npanel/src/app/(main)/agency/layout.tsx`

---

## 10. Faster Dev Compilation (Backend “Compiling”)

### Current behavior

- In development, Next.js compiles routes **on demand**. The first hit to a route (or a changed route) triggers compilation, which can feel slow (“backend is compiling”).
- The app has many routes (agency/*, [slug]/*, etc.), so there are many compilation points.

### Recommendation

- **Enable Turbopack** for the Next.js dev server (e.g. `next dev --turbo` or equivalent in `package.json`) to speed up dev compilation.
- **Pre-warm** the critical path after login: e.g. after the user logs in, trigger a fetch to the first dashboard or agency URL (or the API routes that the layout will hit) so that the **next** user navigation is already compiled.
- Optionally, a small **warmup** script or a one-off request after dev server start that hits the main layout and dashboard route can reduce “first load” delay.

### Files to consider

- `apps/npanel/package.json` — dev script for Next.js.
- Login redirect / post-login hook (e.g. where you send the user after auth) for pre-warming.

---

## 11. Single Shared (main) Layout

### Current behavior

- There is **no** shared `(main)/layout.tsx`. The `(main)` group contains:
  - `[slug]/layout.tsx` — customer team routes.
  - `agency/layout.tsx` — agency routes.
  - Other segments (auth, create-team, etc.).
- So **each** of these layouts does its own auth and (where applicable) preferences. That duplicates session and preference work and spreads auth logic.

### Recommendation

- Introduce a **single** `(main)/layout.tsx` that:
  - Runs **once** per request for all (main) routes: e.g. session fetch, role check, and high-level redirect (e.g. unauthenticated → login, or “/” → correct dashboard).
- Child layouts (`agency/layout.tsx`, `[slug]/layout.tsx`) then only do:
  - **Agency:** agency-specific checks (no need to re-fetch session).
  - **[slug]:** team-specific checks (e.g. `verifyTeamAccess(slug)`) and preferences.
- This reduces duplicate auth work and keeps “who is the user and what’s their role?” in one place.

### Files to consider

- Create: `apps/npanel/src/app/(main)/layout.tsx`
- Update: `apps/npanel/src/app/(main)/[slug]/layout.tsx`, `apps/npanel/src/app/(main)/agency/layout.tsx` to assume session/role already resolved.

---

## 12. Dashboard Page: Avoid Redundant getCurrentUser()

### Current behavior

- The dashboard page (`apps/npanel/src/app/(main)/[slug]/dashboard/page.tsx`) calls `getCurrentUser()` again **only** to get the user’s display name for “Welcome, {displayName}”.
- The layout has already called `getCurrentUser()` (via `requireRole` / `verifyTeamAccess`). React `cache()` deduplicates within the same request, but the page still triggers the same logical dependency and doesn’t reuse the layout’s result explicitly.

### Recommendation

- Have the **layout** (or the shared auth layer) pass the **user** (or at least `displayName`) into the page, e.g. via props or a request-scoped context/store that the layout sets and the page reads.
- The dashboard page should **not** call `getCurrentUser()` again; it should consume the user/display name from that single source. This keeps the contract clear and avoids any extra session lookup (even if cached).

### Files to consider

- `apps/npanel/src/app/(main)/[slug]/layout.tsx` — pass user or displayName to children or context.
- `apps/npanel/src/app/(main)/[slug]/dashboard/page.tsx` — remove `getCurrentUser()`, use passed/context value.

---

## Priority Order for Implementation

If implementing in phases, a suggested order:

1. **Session:** One session check per request (middleware vs layout) and one place that resolves session for the whole tree.  
2. **Header:** Defer notifications full list to popover open; consider server-passed teams for TeamSwitcher.  
3. **Layout:** Parallelize server work and streamline `verifyTeamAccess` (fewer DB round-trips, async “last accessed” update).  
4. **Dashboard:** One server “dashboard summary” or parallel client queries with `teamId` from layout/URL.  
5. **Streaming:** Minimal shell first, then stream the rest.  
6. **Dev:** Less logging in auth, Turbopack, optional warmup.

---

## Summary Table

| # | Area | Main change |
|--|------|-------------|
| 1 | Session | Single session resolution per request (middleware + layout). |
| 2 | Layout | Parallelize auth and preferences where possible. |
| 3 | Session | One place resolves session; pass or expose to rest of tree. |
| 4 | DB | Fewer round-trips in `verifyTeamAccess`; async “last accessed” update. |
| 5 | Header | Defer notifications list to popover; server teams or skeleton for TeamSwitcher. |
| 6 | Dashboard | Parallel or single “dashboard summary” instead of 5 chained queries. |
| 7 | Shell | Stream minimal shell first; stream heavy data after. |
| 8 | Dev | Reduce auth-server logging in dev. |
| 9 | Dynamic | Review `force-dynamic`; remove where not needed. |
| 10 | Dev | Turbopack + optional route warmup. |
| 11 | Structure | Single (main) layout for shared auth. |
| 12 | Dashboard | Pass user/displayName from layout; no getCurrentUser in page. |

---

*Document created for implementation reference. No code changes are applied by this document.*
