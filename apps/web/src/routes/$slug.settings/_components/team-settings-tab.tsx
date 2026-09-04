"use client";

import { useMemo, useState } from "react";

import { SettingsPageShell } from "@/components/settings-page-shell";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useTeamPermissions } from "@/contexts/team-permissions-context";
import { trpc } from "@/utils/trpc";

import { BillingSettingsSection } from "./billing-settings-section";
import { ActiveInvitationsSection } from "./active-invitations-section";
import { MembersSection } from "./members-section";
import { UserPermissionsSection } from "./user-permissions-section";
import { TeamHeader, TeamHeaderSkeleton } from "./team-header";

const ALL_TABS = [
  { value: "billing", label: "Billing" },
  { value: "invitations", label: "Invitations" },
  { value: "members", label: "Members" },
  { value: "user-permissions", label: "User Permissions" },
] as const;

type TeamSettingsTab = (typeof ALL_TABS)[number]["value"];

interface TeamSettingsTabProps {
  teamSlug: string;
}

export function TeamSettingsTab({ teamSlug }: TeamSettingsTabProps) {
  const { can, isOwner, isLoading: permissionsLoading } = useTeamPermissions();
  const [activeTab, setActiveTab] = useState<TeamSettingsTab>("billing");

  const visibleTabs = useMemo(() => {
    return ALL_TABS.filter((tab) => {
      if (tab.value === "billing") return can("billing.team_billing", "read");
      if (tab.value === "invitations") return can("team_settings.invitations", "read");
      if (tab.value === "members") return can("team_settings.members", "read");
      if (tab.value === "user-permissions") return isOwner;
      return false;
    });
  }, [can, isOwner]);

  const resolvedTab = visibleTabs.some((tab) => tab.value === activeTab)
    ? activeTab
    : (visibleTabs[0]?.value ?? activeTab);

  const { data: teamData, isLoading } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: teamSlug },
    { enabled: !!teamSlug }
  );

  const teamId = teamData?.id ?? null;

  if (isLoading || permissionsLoading || !teamSlug) {
    return (
      <div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
        <SettingsPageShell
          title="Settings"
          description="Manage your company billing, invitations, and members"
          tabs={ALL_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          navLabel="Company settings"
          header={<TeamHeaderSkeleton />}
        >
          <div className="flex items-center justify-center py-12">
            <Spinner size={24} />
          </div>
        </SettingsPageShell>
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
        <SettingsPageShell
          title="Settings"
          description="Manage your company billing, invitations, and members"
          tabs={visibleTabs}
          activeTab={resolvedTab}
          onTabChange={setActiveTab}
          navLabel="Company settings"
        >
          <div className="rounded-lg border border-dashed px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Company not found. Please check the URL or try again later.
            </p>
          </div>
        </SettingsPageShell>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <SettingsPageShell
        title="Settings"
        description="Manage your company billing, invitations, members, and user access"
        tabs={visibleTabs}
        activeTab={resolvedTab}
        onTabChange={setActiveTab}
        navLabel="Company settings"
        header={<TeamHeader name={teamData.name} slug={teamData.slug} />}
      >
        {visibleTabs.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              You do not have access to company settings.
            </p>
          </div>
        ) : null}
        {resolvedTab === "billing" && <BillingSettingsSection teamId={teamId} />}
        {resolvedTab === "invitations" && <ActiveInvitationsSection teamId={teamId} />}
        {resolvedTab === "members" && <MembersSection teamId={teamId} />}
        {resolvedTab === "user-permissions" && <UserPermissionsSection teamId={teamId} />}
      </SettingsPageShell>
    </div>
  );
}
