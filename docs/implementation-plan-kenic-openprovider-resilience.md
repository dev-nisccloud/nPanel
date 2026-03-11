# Implementation Plan: KENIC Fault Tolerance & OpenProvider Kenic-Level Speed

This document outlines the implementation plan to (1) make KENIC fault-tolerant and (2) bring OpenProvider domain-check latency and consistency in line with KENIC, using Upstash Redis, auth/token reuse, removal of the unused “get all TLDs” path, and retries.

---

## Part 1: KENIC – Fault tolerance

### Goals

- Reduce user-visible timeouts when the registry is slow or the network is jittery.
- Keep the existing “one connection, few frames” model so normal-case latency stays low.

### 1.1 Retry with exponential backoff (domain check)

**Where:** `packages/api/src/routers/kenic/domain-check.ts`

- Wrap the entire EPP flow (createConnection → login → domain check(s) → logout) in a retry loop.
- **Max attempts:** 3 (configurable via `KENIC_EPP_MAX_RETRIES` env, default 3).
- **Backoff:** exponential (e.g. 1s, 2s) or fixed (e.g. 1s) between attempts. Only retry on:
  - Timeout (message includes `"timeout"`).
  - Connection refused / `ECONNREFUSED`.
  - Other transient network errors (e.g. `ECONNRESET`, `ETIMEDOUT`).
- Do **not** retry on:
  - Login failure (EPP result code ≠ 1000).
  - Domain check business errors (e.g. invalid domain, 2400).
  - Missing credentials (config throw).
- On each retry, use a **new** connection (current code already destroys the socket in `finally`; ensure no reuse of a broken socket).

**Pseudocode:**

```ts
const maxRetries = Number(process.env.KENIC_EPP_MAX_RETRIES ?? "3");
let lastError: Error | null = null;
for (let attempt = 0; attempt < maxRetries; attempt++) {
  try {
    // existing flow: createConnection, readFrame, login, chunks, logout
    return result;
  } catch (error) {
    lastError = error;
    const msg = error instanceof Error ? error.message : String(error);
    const isRetryable = msg.toLowerCase().includes("timeout") || msg.includes("ECONNREFUSED") || msg.includes("ECONNRESET") || msg.includes("ETIMEDOUT");
    if (!isRetryable || attempt === maxRetries - 1) throw error;
    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }
}
```

### 1.2 Optional: refresh socket timeout per read (reduce false timeouts)

**Where:** `packages/api/src/lib/epp/epp-client.ts`

- Node’s `socket.setTimeout(ms)` is an **idle** timeout: it fires when no data is received for `ms`. Today a single 30s idle applies for the whole connection, so one slow server response can trigger a timeout even if the rest of the flow is fast.
- **Option A (recommended first):** Keep 30s as-is and rely on retries (1.1). Simpler and already improves fault tolerance.
- **Option B (if timeouts still frequent):** Before each `readFrame` (or after each successful read), call `socket.setTimeout(timeoutMs)` again to reset the idle timer. Then the 30s applies per “wait for next frame” instead of for the entire connection. Implement in the **caller** (domain-check router) by resetting timeout after login response and after each check response, or add a small helper in `epp-client.ts` that wraps `readFrame` and resets timeout.

### 1.3 Optional: increase timeout for slow environments

- **Where:** Env / `packages/api/src/lib/epp/kenic-config.ts` (already reads `KENIC_EPP_TIMEOUT_MS`).
- If in production the registry often needs >30s under load, increase default or set `KENIC_EPP_TIMEOUT_MS=45000` (or 60000) so that retries are used less often. Prefer retries + current 30s first; only increase if metrics show many retries succeeding on the second attempt.

### 1.4 Documentation

- **Where:** `docs/kenic-epp-integration.md`
- Add a short “Fault tolerance” section: retries (and optional timeout refresh), which errors are retried, and optional env vars (`KENIC_EPP_MAX_RETRIES`, `KENIC_EPP_TIMEOUT_MS`).

---

## Part 2: OpenProvider – Same speed as KENIC (plan)

### Goals

- **No “get all TLDs” path:** UI always sends extensions; remove the branch that calls `getTlds` when `extensions` is missing.
- **Reuse Upstash Redis** for domain-check response cache (same pattern as elsewhere in the codebase).
- **Minimize latency:** Avoid extra round-trips (auth only when needed; cache where helpful).
- **Resilience:** Retry on expired token (401) and optionally on timeout/5xx, with a single re-auth and one retry.

### 2.1 Use shared Upstash Redis for OpenProvider domain-check cache

**Where:** `packages/api/src/routers/openprovider/domains.ts`

- **Current:** Local `redisInstance` and local `getRedisClient()` duplicate the pattern in `packages/api/src/lib/redis.ts`.
- **Change:**
  - Remove the local Redis instance and local `getRedisClient()` in the OpenProvider domains router.
  - Import and use the shared `getRedisClient()` from `packages/api/src/lib/redis.ts`.
- **Why:** One place for Redis config (Upstash URL/token), consistent with products cache and currency conversion. No new “extra” latency: you already do a Redis GET before the API call; using the shared client doesn’t add a hop (same process, same Redis).

**Latency note:** Upstash Redis is a single REST call (GET/SETEX). Typical latency is low (tens of ms). For a cache hit you **avoid** auth + OpenProvider check (saving hundreds of ms to a few seconds), so the net effect is a large **reduction** in latency for repeated queries. For a cache miss, one extra Redis GET is negligible compared to auth + domain check.

### 2.2 Require extensions when `name` is provided (remove “get all TLDs”)

**Where:** `packages/api/src/routers/openprovider/domains.ts`

- **Current:** If `input.name` is set and `input.extensions` is missing or empty, the code calls `client.getTlds({ limit: 1000 })` and then builds a huge check request. The UI never uses this (all call sites pass explicit extensions).
- **Change:**
  - In `checkAvailability`, when `input.name` is present and `input.domains` is not, **require** `input.extensions` and that `input.extensions.length > 0`.
  - If `input.name` is set but `input.extensions` is missing or empty, throw a `TRPCError` with `BAD_REQUEST` and a message like: `"extensions are required when checking by name (e.g. ['.com', '.net']). The UI must pass the TLDs to check."`
  - Remove the entire block that fetches TLDs and the fallback list (the `else` branch that calls `client.getTlds` and the fallback array).
- **Result:** One less HTTP round-trip (getTlds) on every request that currently omits extensions; no behavior change for the UI, which always passes extensions.

### 2.3 Auth only when needed + retry once on 401 (expired token)

**Where:**  
- `packages/api/src/lib/openprovider-client.ts`  
- `packages/api/src/routers/openprovider/domains.ts` (and any other router that uses the client for domain check)

**Client (`openprovider-client.ts`):**

- On **401** (HTTP status or OpenProvider body code 401): clear the stored token (e.g. `this.clearAuth()` or set `this.token = null`) before throwing `OpenProviderApiError`. This way the next call will not use a stale token.
- Optionally: add a small helper `isAuthError(code: number): boolean` (e.g. `code === 401 || code === 403`) and use it when clearing token so any “auth required” response clears the token.

**Router (`domains.ts` – `checkAvailability`):**

- **Ensure auth only when needed:**
  - Get client: `const client = createOpenProviderClient();`
  - Call `await client.authenticate({ ... })` **only if** `!client.isAuthenticated()`. If the client is the singleton and already has a token from a previous request, skip auth so you save one HTTP round-trip on every request after the first.
- **Retry once on auth failure:**
  - After calling `client.checkDomains(checkRequest)` (or the batched equivalent), if the error is an `OpenProviderApiError` with code 401 (or `isAuthError(error.code)`), then:
    - Call `client.authenticate({ ... })` again (force new token).
    - Retry the domain check **once** (single retry only to avoid loops).
  - If the retry also fails, throw the last error.

**Result:** First request in a “session” does auth + check; subsequent requests (same process) do check only, unless the token expires (401) in which case we re-auth and retry once. This matches the goal of “proper retry in case of expired token” without adding latency when the token is valid.

### 2.4 Optional: retry on timeout / 5xx (transient errors)

**Where:** `packages/api/src/routers/openprovider/domains.ts` or inside `openprovider-client.ts`

- For **checkAvailability** only (or for all `makeRequest` calls if desired): on timeout (504) or server error (5xx), retry the **same** request once after a short delay (e.g. 1s). Do not retry on 4xx (except 401 as above). This improves consistency when OpenProvider or the network is briefly slow.
- Prefer implementing this in the **router** for domain check so only that path gets the extra retry; keep the client simple (clear token on 401, throw on others).

### 2.5 Cache key and TTL (unchanged; ensure Redis is used)

- Keep cache key: `domain-check:${input.name}:${extensionsKey}:${input.with_price}:${input.with_whois}`.
- Keep TTL: 300 seconds (5 min). Optionally make TTL configurable via env (e.g. `OPENPROVIDER_CACHE_TTL_SEC`) later.
- Ensure cache is written only after a successful response (already the case). Use the shared Redis client (2.1) so cache hits are fast and consistent with the rest of the app.

### 2.6 Singleton and token expiry (no change to factory behaviour)

- **Where:** `packages/api/src/lib/openprovider-client.ts` – `createOpenProviderClient()`.
- Keep returning the same client instance when `tokenExpiry > Date.now()` so the in-memory token is reused. The router will call `authenticate()` only when `!client.isAuthenticated()`, so the singleton + “auth only when needed” together remove the redundant auth round-trip on every request.
- When the client clears the token on 401, the next request in the same process will see `!client.isAuthenticated()` and will call `authenticate()` again; no change needed to the factory.

### 2.7 Batching and delays (keep as-is for now)

- Keep batching when `checkRequest.domains.length > 10` (batch size 10, concurrency 2, 150 ms between groups). The UI usually sends small extension lists (e.g. 1–3 for exact match; section “popular” ~17; “all” capped at 150). So the main latency win is from “no getTlds” + “auth only when needed” + cache. If needed later, you can reduce the 150 ms delay or increase concurrency after measuring.

---

## Part 3: Implementation order and checklist

### Phase 1 – KENIC fault tolerance

1. **[ ]** In `packages/api/src/routers/kenic/domain-check.ts`, add retry loop (max 3 attempts, exponential backoff, retry only on timeout / connection refused / reset / timed out). Document in `docs/kenic-epp-integration.md`.
2. **[ ]** (Optional) In `epp-client.ts` or domain-check router, reset socket timeout after each successful read so the 30s is per-frame. Re-test timeout behaviour.
3. **[ ]** (Optional) Add or document `KENIC_EPP_MAX_RETRIES` and consider `KENIC_EPP_TIMEOUT_MS` for slow environments.

### Phase 2 – OpenProvider speed and resilience

4. **[ ]** In `packages/api/src/routers/openprovider/domains.ts`, switch to shared Redis: remove local Redis instance and local `getRedisClient`, import `getRedisClient` from `@/lib/redis` (or relative path to `packages/api/src/lib/redis.ts`). Use it for the existing cache key and `setex(300, ...)`.
5. **[ ]** In `checkAvailability`, require `input.extensions.length > 0` when `input.name` is set; remove the `getTlds` branch and fallback list; return `BAD_REQUEST` when extensions are missing.
6. **[ ]** In `openprovider-client.ts`, on 401 (and optionally 403), clear the client token before throwing.
7. **[ ]** In `checkAvailability`, call `client.authenticate(...)` only when `!client.isAuthenticated()`. Wrap the domain check (and batching) in a try/catch: on `OpenProviderApiError` with code 401 (or auth-related), call `client.authenticate(...)` once and retry the check once; then throw if still failing.
8. **[ ]** (Optional) Add one retry on 504/timeout or 5xx for the domain check request (in the router).

### Phase 3 – Verification

9. **[ ]** Run existing tests (if any) for KENIC domain check and OpenProvider domain check.
10. **[ ]** Manually test: KENIC with simulated slow response or timeout (e.g. mock or env with short timeout) and confirm retries and backoff.
11. **[ ]** Manually test: OpenProvider with cache hit (same name + extensions within 5 min) and confirm no auth call and fast response.
12. **[ ]** Manually test: OpenProvider with expired token (e.g. wait 48h or mock 401) and confirm one re-auth + retry and then success.

---

## Summary

| Area | Change | Effect |
|------|--------|--------|
| **KENIC** | Retry (3 attempts, backoff) on timeout/connection errors | Fewer user-visible timeouts; same speed when registry is fast. |
| **KENIC** | Optional: reset socket timeout per read | Fewer false timeouts on slow responses. |
| **OpenProvider** | Shared Upstash Redis for domain-check cache | Same pattern as rest of codebase; cache hits much faster; negligible cost on miss. |
| **OpenProvider** | Require extensions when checking by name; remove getTlds | No “get all” path; one less round-trip; UI unchanged. |
| **OpenProvider** | Auth only when `!client.isAuthenticated()` | Saves one HTTP round-trip per request after the first. |
| **OpenProvider** | On 401, clear token; retry once after re-auth | Handles expired token without extra latency when token is valid. |
| **OpenProvider** | Optional: one retry on 504/5xx | Better consistency under transient failures. |

Together, these changes make KENIC fault-tolerant and bring OpenProvider domain-check behaviour (latency, consistency, resilience) in line with KENIC while reusing Upstash Redis and avoiding the unused “get all TLDs” path.
