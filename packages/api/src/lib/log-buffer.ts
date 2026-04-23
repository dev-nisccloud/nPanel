import { db } from "@npanel/db";
import { apiRequestLog } from "@npanel/db/schema";
import * as crypto from "crypto";

const SENSITIVE_KEYS = ["password", "token", "secret", "key", "apiKey", "auth", "credential"];

/**
 * Recursively redacts sensitive keys from an object.
 */
function redact(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_KEYS.some(sk => 
      key.toLowerCase().includes(sk.toLowerCase())
    );
    
    if (isSensitive) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      result[key] = redact(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Buffered batch logger for API requests to minimize DB overhead.
 */
class LogBuffer {
  private buffer: any[] = [];
  private readonly maxBufferSize = 50;
  private readonly maxRetainedLogs = 1000;
  private readonly flushInterval = 5000; // 5 seconds
  private intervalId: any = null;
  private isFlushing = false;
  private hasLoggedFlushFailure = false;

  constructor() {
    // Start background flush timer if in a long-running process
    if (typeof setInterval !== 'undefined') {
      this.intervalId = setInterval(() => this.flush(), this.flushInterval);
    }
  }

  /**
   * Push a log entry to the buffer.
   */
  public push(log: {
    path: string;
    type: string;
    userId?: string | null;
    teamId?: string | null;
    apiKeyId?: string | null;
    input: any;
    status: "SUCCESS" | "ERROR";
    errorCode?: string | null;
    durationMs: number;
    ipAddress?: string | null;
  }) {
    this.buffer.push({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...log,
      input: redact(log.input)
    });

    if (this.buffer.length >= this.maxBufferSize) {
      // Don't await here to keep the request path fast
      this.flush().catch(err => {
        console.error("Immediate flush failed:", err);
      });
    }
  }

  /**
   * Periodically flushes buffered logs to the database.
   */
  private async flush() {
    if (this.isFlushing || this.buffer.length === 0) return;

    this.isFlushing = true;
    const batch = [...this.buffer];
    this.buffer = [];

    try {
      await db.insert(apiRequestLog).values(batch);
      this.hasLoggedFlushFailure = false;
    } catch (error) {
      // Requeue and cap retained logs so DB outages don't lose all logs or leak memory.
      this.buffer = [...batch, ...this.buffer].slice(-this.maxRetainedLogs);

      // Emit full stack only once per outage period to avoid log storms.
      if (!this.hasLoggedFlushFailure) {
        console.error("[LogBuffer] Failed to flush API logs:", error);
        this.hasLoggedFlushFailure = true;
      } else {
        console.error("[LogBuffer] Failed to flush API logs (suppressed repeated stack traces)");
      }
    } finally {
      this.isFlushing = false;
    }
  }
}

export const logBuffer = new LogBuffer();
