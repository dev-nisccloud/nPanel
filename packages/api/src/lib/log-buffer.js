import { db, getPoolMetrics } from "@npanel/db";
import { apiRequestLog } from "@npanel/db/schema";
import * as crypto from "crypto";
const SENSITIVE_KEYS = ["password", "token", "secret", "key", "apiKey", "auth", "credential"];
/**
 * Recursively redacts sensitive keys from an object.
 */
function redact(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj !== "object")
        return obj;
    if (Array.isArray(obj))
        return obj.map(redact);
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const isSensitive = SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk.toLowerCase()));
        if (isSensitive) {
            result[key] = "[REDACTED]";
        }
        else if (typeof value === "object") {
            result[key] = redact(value);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
function isTransientDbError(error) {
    const msg = error instanceof Error ? error.message : String(error);
    return /timeout|terminat|ECONN|ENOTFOUND|ECONNREFUSED|too many clients|Connection terminated/i.test(msg);
}
/**
 * Buffered batch logger for API requests to minimize DB overhead.
 *
 * Hardening:
 * - Skips flush when the Postgres pool is contended (waiting/saturated)
 * - Exponential backoff after flush failures so we don't hammer a sick DB
 * - Caps retained logs and prefers keeping ERROR rows when trimming
 */
class LogBuffer {
    buffer = [];
    maxBufferSize = 50;
    maxRetainedLogs = 1000;
    flushInterval = 5000; // 5 seconds
    minBackoffMs = 15_000;
    maxBackoffMs = 120_000;
    intervalId = null;
    isFlushing = false;
    hasLoggedFlushFailure = false;
    hasLoggedPoolDeferral = false;
    backoffUntilMs = 0;
    backoffMs = 0;
    droppedCount = 0;
    constructor() {
        // Start background flush timer if in a long-running process
        if (typeof setInterval !== "undefined") {
            this.intervalId = setInterval(() => {
                void this.flush();
            }, this.flushInterval);
            // Don't keep the process alive solely for audit flushes (workers/tests).
            this.intervalId.unref?.();
        }
    }
    /**
     * Push a log entry to the buffer.
     */
    push(log) {
        this.buffer.push({
            id: crypto.randomUUID(),
            timestamp: new Date(),
            ...log,
            input: redact(log.input),
        });
        this.enforceCap();
        if (this.buffer.length >= this.maxBufferSize &&
            !this.isInBackoff() &&
            !this.isPoolContended()) {
            // Don't await here to keep the request path fast
            void this.flush().catch((err) => {
                console.error("[LogBuffer] Immediate flush failed:", err);
            });
        }
    }
    isInBackoff() {
        return Date.now() < this.backoffUntilMs;
    }
    /** True when a flush would compete with request traffic for pool slots. */
    isPoolContended() {
        try {
            const metrics = getPoolMetrics();
            const inUse = metrics.total - metrics.idle;
            return metrics.waiting > 0 || (metrics.max > 0 && inUse >= metrics.max);
        }
        catch {
            // If metrics are unavailable, allow flush attempts.
            return false;
        }
    }
    scheduleBackoff(transient) {
        // Connection timeouts get a longer first pause so we don't keep competing
        // for pool slots while the DB is recovering.
        const floor = transient ? this.minBackoffMs * 2 : this.minBackoffMs;
        this.backoffMs =
            this.backoffMs === 0
                ? floor
                : Math.min(this.backoffMs * 2, this.maxBackoffMs);
        this.backoffUntilMs = Date.now() + this.backoffMs;
    }
    clearBackoff() {
        this.backoffMs = 0;
        this.backoffUntilMs = 0;
    }
    /**
     * Cap memory use. Prefer retaining ERROR rows when trimming under pressure.
     */
    enforceCap() {
        if (this.buffer.length <= this.maxRetainedLogs)
            return;
        const overflow = this.buffer.length - this.maxRetainedLogs;
        const errors = this.buffer.filter((e) => e.status === "ERROR");
        const rest = this.buffer.filter((e) => e.status !== "ERROR");
        const errorBudget = Math.min(errors.length, this.maxRetainedLogs);
        const restBudget = this.maxRetainedLogs - errorBudget;
        this.buffer = [
            ...errors.slice(-errorBudget),
            ...rest.slice(-restBudget),
        ];
        const previousDropped = this.droppedCount;
        this.droppedCount += overflow;
        if (Math.floor(previousDropped / 100) !== Math.floor(this.droppedCount / 100)) {
            console.warn(`[LogBuffer] Dropped ${this.droppedCount} API log(s) under retention cap`);
        }
    }
    /**
     * Periodically flushes buffered logs to the database.
     */
    async flush() {
        if (this.isFlushing || this.buffer.length === 0)
            return;
        if (this.isInBackoff())
            return;
        if (this.isPoolContended()) {
            if (!this.hasLoggedPoolDeferral) {
                console.warn("[LogBuffer] Deferring API log flush: Postgres pool is contended");
                this.hasLoggedPoolDeferral = true;
            }
            return;
        }
        this.isFlushing = true;
        const batch = this.buffer.splice(0, this.buffer.length);
        try {
            await db.insert(apiRequestLog).values(batch);
            this.clearBackoff();
            this.hasLoggedFlushFailure = false;
            this.hasLoggedPoolDeferral = false;
            if (this.droppedCount > 0) {
                console.warn(`[LogBuffer] Flush recovered; ${this.droppedCount} log(s) were dropped during the outage`);
                this.droppedCount = 0;
            }
        }
        catch (error) {
            // Requeue and cap retained logs so DB outages don't leak memory.
            this.buffer = [...batch, ...this.buffer];
            this.enforceCap();
            this.scheduleBackoff(isTransientDbError(error));
            // Emit full stack only once per outage period to avoid log storms.
            if (!this.hasLoggedFlushFailure) {
                console.error("[LogBuffer] Failed to flush API logs:", error);
                this.hasLoggedFlushFailure = true;
            }
            else {
                console.error(`[LogBuffer] Failed to flush API logs (suppressed); retry in ${this.backoffMs}ms`);
            }
        }
        finally {
            this.isFlushing = false;
        }
    }
}
export const logBuffer = new LogBuffer();
