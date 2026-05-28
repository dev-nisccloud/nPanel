"use client";

import { useEffect, useRef } from "react";

import {
  isSessionLifetimeExpired,
  SESSION_TOUCH_THROTTLE_MS,
} from "@npanel/auth/session-policy";
import { authClient } from "@/lib/auth-client";
import { isPublicPath } from "@/lib/session-gate";

const SESSION_POLL_MS = 60_000;

function redirectToLoginAfterExpiry() {
  if (typeof window === "undefined" || isPublicPath(window.location.pathname)) {
    return;
  }
  window.location.href = "/auth/login";
}

/**
 * Keeps idle sessions alive while the user is active and signs out after
 * 30 minutes of inactivity.
 */
export function SessionLifetimeGuard() {
  const lastActivityTouchRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const touchSession = () => {
      if (document.visibilityState === "hidden") return;
      if (isPublicPath(window.location.pathname)) return;

      const now = Date.now();
      if (now - lastActivityTouchRef.current < SESSION_TOUCH_THROTTLE_MS) return;
      lastActivityTouchRef.current = now;
      void authClient.getSession();
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    for (const event of events) {
      window.addEventListener(event, touchSession, { passive: true });
    }

    return () => {
      for (const event of events) {
        window.removeEventListener(event, touchSession);
      }
    };
  }, []);

  const { data, isPending } = authClient.useSession({
    refetchInterval: SESSION_POLL_MS,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (isPending) return;

    const record = data?.session;
    if (!record?.expiresAt) return;

    const expiresAt = new Date(record.expiresAt);
    if (!Number.isFinite(expiresAt.getTime())) return;

    if (!isSessionLifetimeExpired(expiresAt)) return;

    void authClient.signOut().finally(redirectToLoginAfterExpiry);
  }, [data, isPending]);

  return null;
}
