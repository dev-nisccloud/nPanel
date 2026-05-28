"use client";

import { useEffect } from "react";

import { isSessionLifetimeExpired } from "@npanel/auth/session-policy";
import { authClient } from "@/lib/auth-client";
import { isPublicPath } from "@/lib/session-gate";

const SESSION_REFETCH_MS = 60_000;

function redirectToLoginAfterExpiry() {
  if (typeof window === "undefined" || isPublicPath(window.location.pathname)) {
    return;
  }
  window.location.href = "/auth/login";
}

/**
 * Periodically re-validates the session and signs out when the 30-minute
 * window from session creation has elapsed.
 */
export function SessionLifetimeGuard() {
  const { data, isPending } = authClient.useSession({
    refetchInterval: SESSION_REFETCH_MS,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (isPending) return;

    const record = data?.session;
    if (!record?.createdAt || !record?.expiresAt) return;

    const createdAt = new Date(record.createdAt);
    const expiresAt = new Date(record.expiresAt);
    if (!Number.isFinite(createdAt.getTime()) || !Number.isFinite(expiresAt.getTime())) {
      return;
    }

    if (!isSessionLifetimeExpired(createdAt, expiresAt)) return;

    void authClient.signOut().finally(redirectToLoginAfterExpiry);
  }, [data, isPending]);

  return null;
}
