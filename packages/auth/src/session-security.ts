import { and, db, eq, gt, ne } from "@npanel/db";
import { account, session, user } from "@npanel/db/schema/auth";
import {
  userActivityLog,
  userMfaSession,
  userMfaSettings,
} from "@npanel/db/schema/auth-extras";
import {
  notification,
  notificationActivityLog,
} from "@npanel/db/schema/notifications";
import { renderSecurityAlertEmail } from "react-email-starter/src/email-templates";

import { sendAuthEmail } from "./transactional-email";
import {
  claimIpAnomalyAlert,
  isSessionReauthRequired,
  markSessionReauthRequired,
} from "./session-cache";
import { invalidateSessionById } from "./session-enforcement";
import {
  ipsIndicateNetworkChange,
  normalizeIpAddress,
  normalizeUserAgent,
  SESSION_IP_ALERT_DEDUPE_SEC,
  STANDARD_SESSION_MAX_AGE_SEC,
} from "./session-policy";
import { env } from "@npanel/env/server";

function appBaseUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.CORS_ORIGIN ||
    env.CORS_ORIGIN ||
    "http://localhost:3002"
  ).replace(/\/+$/, "");
}

export async function isMfaEnabledForUser(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: userMfaSettings.id })
    .from(userMfaSettings)
    .where(
      and(
        eq(userMfaSettings.userId, userId),
        eq(userMfaSettings.emailOtpEnabled, true),
      ),
    )
    .limit(1);
  return Boolean(rows[0]);
}

/** Clear MFA verifiedAt so the next request requires OTP again. */
export async function clearSessionMfaVerification(
  sessionId: string,
  userId: string,
): Promise<void> {
  const existing = await db
    .select({ id: userMfaSession.id })
    .from(userMfaSession)
    .where(eq(userMfaSession.sessionId, sessionId))
    .limit(1);

  const now = new Date();
  if (existing[0]) {
    await db
      .update(userMfaSession)
      .set({
        verifiedAt: null,
        requiredAt: now,
        updatedAt: now,
        userId,
      })
      .where(eq(userMfaSession.sessionId, sessionId));
    return;
  }

  await db.insert(userMfaSession).values({
    id: crypto.randomUUID(),
    userId,
    sessionId,
    requiredAt: now,
    verifiedAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

export type SessionSecurityNotifyKind = "new_signin" | "ip_anomaly";

export async function notifySessionSecurityEvent(params: {
  userId: string;
  kind: SessionSecurityNotifyKind;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
}): Promise<void> {
  try {
    const userRows = await db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, params.userId))
      .limit(1);
    const u = userRows[0];
    if (!u?.email) return;

    const accessTime = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
    const ipDisplay = params.ipAddress ? ` from ${params.ipAddress}` : "";
    const title =
      params.kind === "ip_anomaly"
        ? "Sign-in location changed"
        : "New sign-in to your account";
    const message =
      params.kind === "ip_anomaly"
        ? `We detected a change in the network location for an active session at ${accessTime}${ipDisplay}. If this was not you, sign out everywhere and change your password.`
        : `Your account was signed in at ${accessTime}${ipDisplay}. If this was not you, sign out everywhere and secure your account.`;

    const nid = crypto.randomUUID();
    await db.insert(notification).values({
      id: nid,
      userId: params.userId,
      teamId: null,
      type: "SYSTEM",
      priority: "HIGH",
      title,
      message,
      link: "/account/settings",
      metadata: {
        kind: params.kind,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        sessionId: params.sessionId ?? null,
        accessTime,
      },
      seen: false,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.insert(notificationActivityLog).values({
      id: crypto.randomUUID(),
      notificationId: nid,
      userId: params.userId,
      action: "CREATE",
      description: `${params.kind} security notification created`,
      metadata: { kind: params.kind, ipAddress: params.ipAddress ?? null },
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      createdAt: new Date(),
    });

    const firstname = u.name?.split(/\s+/)[0] || "there";
    const html = await renderSecurityAlertEmail({
      userFirstname: firstname,
      resetPasswordLink: `${appBaseUrl()}/auth/forgot-password`,
      suspiciousActivity:
        params.kind === "ip_anomaly"
          ? "sign-in from a new network location"
          : "new sign-in",
    });
    await sendAuthEmail({
      to: u.email,
      subject: `Security alert: ${title}`,
      html,
    });
  } catch (error) {
    console.error("[auth][session-security] Failed to notify:", error);
  }
}

/**
 * Handle soft IP anomaly: step-up (MFA or password re-auth) + deduped alerts.
 * Google-only accounts without MFA cannot password-reauth → session is invalidated.
 */
export async function handleIpAnomaly(params: {
  userId: string;
  sessionId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt?: Date;
}): Promise<{ reauthRequired: boolean; mfaRequired: boolean; invalidated?: boolean }> {
  const boundRows = await db
    .select({ ipAddress: session.ipAddress })
    .from(session)
    .where(eq(session.id, params.sessionId))
    .limit(1);
  const boundIp = boundRows[0]?.ipAddress ?? null;
  if (!ipsIndicateNetworkChange(boundIp, params.ipAddress ?? null)) {
    return { reauthRequired: false, mfaRequired: false };
  }

  const mfaEnabled = await isMfaEnabledForUser(params.userId);

  if (mfaEnabled) {
    await clearSessionMfaVerification(params.sessionId, params.userId);
  } else {
    const credentialRows = await db
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.userId, params.userId),
          eq(account.providerId, "credential"),
        ),
      )
      .limit(1);

    if (!credentialRows[0]) {
      await invalidateSessionById(params.sessionId);
      void notifySessionSecurityEvent({
        userId: params.userId,
        kind: "ip_anomaly",
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        sessionId: params.sessionId,
      });
      return { reauthRequired: false, mfaRequired: false, invalidated: true };
    }

    const ttlSec = params.expiresAt
      ? Math.max(
          60,
          Math.floor((params.expiresAt.getTime() - Date.now()) / 1000),
        )
      : STANDARD_SESSION_MAX_AGE_SEC;
    await markSessionReauthRequired(params.sessionId, ttlSec);
  }

  const shouldAlert = await claimIpAnomalyAlert(
    params.sessionId,
    SESSION_IP_ALERT_DEDUPE_SEC,
  );
  if (shouldAlert) {
    try {
      await db.insert(userActivityLog).values({
        id: crypto.randomUUID(),
        userId: params.userId,
        action: "SESSION_IP_ANOMALY",
        description: "Session IP address changed; step-up auth required",
        metadata: {
          sessionId: params.sessionId,
          ipAddress: params.ipAddress ?? null,
          mfaEnabled,
        },
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("[auth][session-security] Failed to log IP anomaly:", error);
    }
    void notifySessionSecurityEvent({
      userId: params.userId,
      kind: "ip_anomaly",
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      sessionId: params.sessionId,
    });
  }

  return {
    reauthRequired: !mfaEnabled,
    mfaRequired: mfaEnabled,
  };
}

export async function resolveReauthRequired(sessionId: string): Promise<boolean> {
  return isSessionReauthRequired(sessionId);
}

/**
 * After a successful login, notify if this looks like a new device/session.
 */
export async function maybeNotifyNewSignIn(params: {
  userId: string;
  sessionId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    const others = await db
      .select({
        id: session.id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      })
      .from(session)
      .where(
        and(
          eq(session.userId, params.userId),
          gt(session.expiresAt, new Date()),
          ne(session.id, params.sessionId),
        ),
      )
      .limit(5);

    const requestUa = normalizeUserAgent(params.userAgent);
    const requestIp = normalizeIpAddress(params.ipAddress);

    const matchesKnownSession = others.some((s) => {
      const otherUa = normalizeUserAgent(s.userAgent);
      const otherIp = normalizeIpAddress(s.ipAddress);
      const sameBrowser = Boolean(otherUa && requestUa && otherUa === requestUa);
      const sameNetwork = !ipsIndicateNetworkChange(otherIp, requestIp);
      return sameBrowser && sameNetwork;
    });

    // Only notify when this login does not match any other active session's
    // browser + network. A second browser on the same LAN is a new device;
    // a second login from the same browser/network is not.
    if (others.length > 0 && !matchesKnownSession) {
      await notifySessionSecurityEvent({
        userId: params.userId,
        kind: "new_signin",
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        sessionId: params.sessionId,
      });
    }
  } catch (error) {
    console.error("[auth][session-security] maybeNotifyNewSignIn failed:", error);
  }
}

/** Ensure MFA pending row exists for a session when MFA is enabled (email + OAuth). */
export async function ensurePendingMfaSession(
  userId: string,
  sessionId: string,
): Promise<void> {
  const enabled = await isMfaEnabledForUser(userId);
  if (!enabled) return;

  const existing = await db
    .select({ id: userMfaSession.id })
    .from(userMfaSession)
    .where(eq(userMfaSession.sessionId, sessionId))
    .limit(1);

  const now = new Date();
  if (!existing[0]) {
    await db.insert(userMfaSession).values({
      id: crypto.randomUUID(),
      userId,
      sessionId,
      requiredAt: now,
      verifiedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    return;
  }

  await db
    .update(userMfaSession)
    .set({
      userId,
      requiredAt: now,
      verifiedAt: null,
      updatedAt: now,
    })
    .where(eq(userMfaSession.sessionId, sessionId));
}
