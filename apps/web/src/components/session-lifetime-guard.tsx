"use client";

import { useEffect, useRef, useState } from "react";

import {
  isSessionLifetimeExpired,
  SESSION_TOUCH_THROTTLE_MS,
} from "@npanel/auth/session-policy";
import { authClient } from "@/lib/auth-client";
import { hasActiveTransfer, subscribeActiveTransfer } from "@/lib/active-transfer";
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
  const [transferring, setTransferring] = useState(false);

  useEffect(() => subscribeActiveTransfer(() => setTransferring(hasActiveTransfer())), []);

  useEffect(() => {
    if (!transferring || typeof window === "undefined") return;

    const touch = () => {
      void authClient.getSession();
    };
    touch();
    const timer = window.setInterval(touch, SESSION_TOUCH_THROTTLE_MS);

    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);

    let lock: WakeLockSentinel | null = null;
    let stopped = false;
    const acquireLock = () => {
      if (stopped || !("wakeLock" in navigator)) return;
      void navigator.wakeLock
        .request("screen")
        .then((next) => {
          if (stopped) {
            void next.release().catch(() => undefined);
            return;
          }
          lock = next;
        })
        .catch(() => undefined);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") acquireLock();
    };
    acquireLock();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener("beforeunload", onLeave);
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => undefined);
    };
  }, [transferring]);

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
