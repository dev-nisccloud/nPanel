"use client";

/**
 * Wrapper that renders TeamSwitcher and NotificationSwitcher.
 * This file is only ever loaded via dynamic(..., { ssr: false }), so tRPC hooks
 * inside these components never run during server render (avoids "Unable to find tRPC Context").
 */
import { TeamSwitcher } from "./sidebar/team-switcher";
import { NotificationSwitcher } from "./sidebar/notification-switcher";

export function ClientTrpcSwitchers() {
  return (
    <>
      <TeamSwitcher />
      <NotificationSwitcher />
    </>
  );
}
