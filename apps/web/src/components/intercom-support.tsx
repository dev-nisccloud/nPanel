"use client";

import { useEffect } from "react";
import Intercom, { shutdown } from "@intercom/messenger-js-sdk";

const INTERCOM_APP_ID = import.meta.env.VITE_INTERCOM_APP_ID ?? "jd7bfrv8";

export type IntercomSessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  createdAt?: Date | string | number | null;
};

function toUnixSeconds(value: IntercomSessionUser["createdAt"]): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number") {
    return value > 1_000_000_000_000 ? Math.floor(value / 1000) : Math.floor(value);
  }
  const d = typeof value === "string" ? new Date(value) : value;
  const ms = d.getTime();
  if (Number.isNaN(ms)) return undefined;
  return Math.floor(ms / 1000);
}

function createdAtDependencyKey(user: IntercomSessionUser): string {
  const v = user.createdAt;
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v instanceof Date) return v.toISOString();
  return "";
}

/**
 * Boots Intercom for an authenticated dashboard user. Renders nothing; call only from
 * customer or agency layouts (not auth layouts or create-team).
 */
export function IntercomSupport({ user }: { user: IntercomSessionUser }) {
  const createdKey = createdAtDependencyKey(user);

  useEffect(() => {
    if (!INTERCOM_APP_ID) return;

    const created_at = toUnixSeconds(user.createdAt);
    Intercom({
      app_id: INTERCOM_APP_ID,
      user_id: user.id,
      name: user.name ?? undefined,
      email: user.email ?? undefined,
      ...(created_at !== undefined ? { created_at } : {}),
    });

    return () => {
      shutdown();
    };
  }, [user.id, user.name, user.email, createdKey]);

  return null;
}
