"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { AccountSettingsShell, type AccountTab } from "./account-settings-shell";
import { ProfileHeader } from "./profile-header";
import { ProfileForm } from "./profile-form";
import { ProfileCompletionBanner } from "./profile-completion-banner";
import { AccountActivitiesList } from "./account-activities-list";
import { SecurityMfaForm } from "./security-mfa-form";

const ACCOUNT_TABS = new Set<AccountTab>(["profile", "security", "activities"]);

function parseAccountTab(value: string | null): AccountTab {
  if (value && ACCOUNT_TABS.has(value as AccountTab)) {
    return value as AccountTab;
  }
  return "profile";
}

interface AccountSettingsPageProps {
  title: string;
  /** Show profile completion prompt for customers purchasing services */
  showProfileCompletionPrompt?: boolean;
}

export function AccountSettingsPage({ title, showProfileCompletionPrompt = false }: AccountSettingsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = useMemo(
    () => parseAccountTab(searchParams.get("tab")),
    [searchParams],
  );
  const [activeTab, setActiveTab] = useState<AccountTab>(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleTabChange = useCallback(
    (tab: AccountTab) => {
      setActiveTab(tab);
      const next = new URLSearchParams(searchParams);
      if (tab === "profile") {
        next.delete("tab");
      } else {
        next.set("tab", tab);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return (
    <div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <AccountSettingsShell
        title={title}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        header={<ProfileHeader />}
        banner={showProfileCompletionPrompt ? <ProfileCompletionBanner /> : null}
      >
        {activeTab === "profile" && <ProfileForm />}
        {activeTab === "security" && <SecurityMfaForm />}
        {activeTab === "activities" && <AccountActivitiesList />}
      </AccountSettingsShell>
    </div>
  );
}
