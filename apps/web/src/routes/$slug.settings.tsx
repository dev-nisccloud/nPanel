"use client";

import { useLocation } from "react-router";

import { TeamSettingsTab } from "./$slug.settings/_components/team-settings-tab";

export default function SettingsPage() {
  const { pathname } = useLocation();
  const teamSlug = pathname.split("/")[1] ?? "";

  return <TeamSettingsTab teamSlug={teamSlug} />;
}
