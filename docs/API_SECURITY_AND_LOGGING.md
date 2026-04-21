# API Security & Audit Logging Documentation

This document outlines the implementation of the API Key system and the high-performance audit logging mechanism in the nPanel backend.

---

## 1. API Key System

The nPanel API supports authentication via Secret Keys (`SK`), designed for programmatic access and external integrations.

### Key Structure & Storage
- **Format**: Keys use the prefix `npanel_sk_` followed by a cryptographically secure random string.
- **Hashing**: To protect the database from leaks, keys are never stored in plain text. Instead, a **SHA-256 hash** of the key is stored in the `api_key.key_hash` column.
- **Permissions (Scopes)**: Each key contains a `permissions` field (JSONB array) defining which tRPC paths it can access (e.g., `["plesk.domains.getAll", "domainTransfer.checkTransfer"]`). It also supports the `*` wildcard for full access.

### Authentication Flow
1. **Extraction**: The `createContext` function (in `context.ts`) extracts the token from the `Authorization: Bearer <token>` header.
2. **Validation**: The token is hashed and matched against the database.
3. **Identity**: If valid, the system retrieves the associated User and attaches their identity to the tRPC context (`ctx.apiKey`, `ctx.session.user`).
4. **Last Used**: The system asynchronously updates `lastUsedAt` without blocking the request.

### Authorization (The Guard)
The `apiKeyGuard` middleware in `trpc.ts` acts as the gatekeeper:
- If an API Key is used, it validates the current request `path` against the key's permissions list.
- If the permission is missing, it throws a `403 FORBIDDEN` error.

---

## 2. API Request Logging

The system maintains a detailed audit trail of all API activity using a non-blocking, buffered architecture.

### Schema: `api_request_log`
Every interaction is logged with the following metadata:
- **Identity**: User ID, Team ID, and API Key ID.
- **Request**: Path (e.g., `plesk.wordpress.list`), Type (Query/Mutation), and IP Address.
- **Payload**: The input parameters (scrubbed of secrets).
- **Performance**: Execution duration in milliseconds (`durationMs`).
- **Status**: Success/Error status and specific error codes (e.g., `UNAUTHORIZED`).

### High-Performance Batching
To ensure zero latency for end-users, we use a **Buffered Batcher**:
- **In-Memory Buffer**: Logs are initially held in a local memory array.
- **Flush Mechanism**: The system flushes logs to the database only when:
    - The buffer reaches **50 entries**.
    - **5 seconds** have passed since the last flush.
- This reduces database IOPS significantly, turning 50 individual writes into a single bulk insert.

### Automatic Redaction (Privacy)
The system protects sensitive user data through a recursive redaction utility:
- Any key in the input object containing words like `password`, `secret`, `token`, `key`, or `credential` is automatically replaced with `[REDACTED]`.
- This ensures that accidental logging of credentials never occurs.

---

## 3. Middleware Chain
The logic is integrated globally into the tRPC procedure definition:

1. **`loggingMiddleware`**: Starts the timer and captures final status.
2. **`apiKeyGuard`**: Enforces security scopes.
3. **`protectedProcedure`**: Enforces session cookies for browser-based users.

> [!TIP]
> **Performance Impact**: Because flushing happens in the background via timers or async fire-and-forget, the logging system adds **< 1ms** of overhead to the critical path of the request.
