import { and, desc, eq, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { getRedisClient } from "./redis";
import { getSesSendQuotaSnapshot } from "./ses-quota";
import {
  niscEmQuotaReservation,
  niscEmQuotaWindow,
} from "@npanel/db/schema";

export interface QuotaStatus {
  windowStart: Date;
  windowEnd: Date;
  maxSendRate: number;
  max24HourSend: number;
  sentLast24HoursAtStart: number;
  reservedEmails: number;
  remainingEmails: number;
}

interface ResultOk<T> {
  ok: true;
  value: T;
}

interface ResultErr<E> {
  ok: false;
  error: E;
}

type Result<T, E> = ResultOk<T> | ResultErr<E>;

export type ReserveQuotaError =
  | { kind: "NOT_ENOUGH_QUOTA"; remainingEmails: number }
  | { kind: "SES_QUOTA_UNAVAILABLE"; message: string };

function addHours(d: Date, hours: number): Date {
  return new Date(d.getTime() + hours * 60 * 60 * 1000);
}

async function findActiveWindow(now: Date) {
  const [row] = await db
    .select()
    .from(niscEmQuotaWindow)
    .where(
      and(
        sql`${niscEmQuotaWindow.windowStart} <= ${now}`,
        sql`${niscEmQuotaWindow.windowEnd} > ${now}`,
      ),
    )
    .orderBy(desc(niscEmQuotaWindow.windowStart))
    .limit(1);

  return row ?? null;
}

async function getOrCreateActiveWindow(now: Date) {
  const existing = await findActiveWindow(now);
  if (existing) return existing;

  const quota = await getSesSendQuotaSnapshot();

  // Rolling window approximation:
  // we snapshot the current SES quota and treat it as a 24h "active" window.
  const windowStart = now;
  const windowEnd = addHours(now, 24);

  const [created] = await db
    .insert(niscEmQuotaWindow)
    .values({
      id: randomUUID(),
      windowStart,
      windowEnd,
      maxSendRate: quota.maxSendRate,
      max24HourSend: quota.max24HourSend,
      sentLast24HoursAtStart: quota.sentLast24Hours,
      reservedEmails: 0,
      actualSentEmails: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return created;
}

async function computeReservedEmailsForWindow(windowId: string) {
  const [reservedRow] = await db
    .select({
      value: sql<number>`coalesce(sum(${niscEmQuotaReservation.requestedEmails}), 0)`,
    })
    .from(niscEmQuotaReservation)
    .where(
      and(
        eq(niscEmQuotaReservation.windowId, windowId),
        eq(niscEmQuotaReservation.status, "RESERVED"),
      ),
    );

  return Number(reservedRow?.value ?? 0);
}

export async function getQuotaStatus(now = new Date()): Promise<QuotaStatus> {
  const window = await getOrCreateActiveWindow(now);
  const reservedEmails = await computeReservedEmailsForWindow(window.id);

  const remainingEmails = Math.max(
    0,
    window.max24HourSend - (window.sentLast24HoursAtStart + reservedEmails),
  );

  return {
    windowStart: window.windowStart,
    windowEnd: window.windowEnd,
    maxSendRate: window.maxSendRate,
    max24HourSend: window.max24HourSend,
    sentLast24HoursAtStart: window.sentLast24HoursAtStart,
    reservedEmails,
    remainingEmails,
  };
}

export async function reserveQuotaForSendJob(params: {
  teamId: string | null;
  userId: string | null;
  campaignId: string | null;
  sendJobId: string | null;
  requestedEmails: number;
  now?: Date;
}): Promise<Result<{ windowId: string; remainingAfter: number }, ReserveQuotaError>> {
  const requestedEmails = Math.max(0, Math.floor(params.requestedEmails));
  if (requestedEmails <= 0) {
    return { ok: true, value: { windowId: "", remainingAfter: 0 } };
  }

  const now = params.now ?? new Date();
  const window = await getOrCreateActiveWindow(now);

  const redis = getRedisClient();
  const lockKey = `nisc_em_quota_lock:${window.id}`;
  const lockTtlSeconds = 10;

  // Optional: prevent obvious race when many workers reserve at once.
  const lockHeld = redis
    ? await redis.set(lockKey, "1", "EX", lockTtlSeconds, "NX")
    : true;

  if (redis && !lockHeld) {
    const status = await getQuotaStatus(now);
    if (status.remainingEmails < requestedEmails) {
      return {
        ok: false,
        error: { kind: "NOT_ENOUGH_QUOTA", remainingEmails: status.remainingEmails },
      };
    }
  }

  const res = await db.transaction(async (tx) => {
    const [reservedRow] = await tx
      .select({
        value: sql<number>`coalesce(sum(${niscEmQuotaReservation.requestedEmails}), 0)`,
      })
      .from(niscEmQuotaReservation)
      .where(
        and(
          eq(niscEmQuotaReservation.windowId, window.id),
          eq(niscEmQuotaReservation.status, "RESERVED"),
        ),
      );

    const reservedEmails = Number(reservedRow?.value ?? 0);
    const remainingEmails = Math.max(
      0,
      window.max24HourSend - (window.sentLast24HoursAtStart + reservedEmails),
    );

    if (remainingEmails < requestedEmails) {
      return {
        ok: false as const,
        error: { kind: "NOT_ENOUGH_QUOTA", remainingEmails },
      };
    }

    const reservationId = randomUUID();

    await tx.insert(niscEmQuotaReservation).values({
      id: reservationId,
      windowId: window.id,
      teamId: params.teamId,
      userId: params.userId,
      campaignId: params.campaignId,
      sendJobId: params.sendJobId,
      requestedEmails,
      status: "RESERVED",
      createdAt: now,
      updatedAt: now,
    });

    await tx
      .update(niscEmQuotaWindow)
      .set({
        reservedEmails: reservedEmails + requestedEmails,
        updatedAt: now,
      })
      .where(eq(niscEmQuotaWindow.id, window.id));

    return {
      ok: true as const,
      value: {
        windowId: window.id,
        remainingAfter: remainingEmails - requestedEmails,
      },
    };
  });

  if (redis) {
    try {
      await redis.del(lockKey);
    } catch {
      // ignore
    }
  }

  return res;
}

