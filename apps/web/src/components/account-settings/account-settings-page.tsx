"use client";

import { useState } from "react";

import { AccountSettingsShell, type AccountTab } from "./account-settings-shell";
import { ProfileHeader } from "./profile-header";
import { ProfileForm } from "./profile-form";
import { ProfileCompletionBanner } from "./profile-completion-banner";
import { AccountActivitiesList } from "./account-activities-list";
import { SecurityMfaForm } from "./security-mfa-form";

interface AccountSettingsPageProps {
  title: string;
  /** Show profile completion prompt for customers purchasing services */
  showProfileCompletionPrompt?: boolean;
}

export function AccountSettingsPage({ title, showProfileCompletionPrompt = false }: AccountSettingsPageProps) {
  const [activeTab, setActiveTab] = useState<AccountTab>("profile");

  return (
    <div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <AccountSettingsShell
        title={title}
        activeTab={activeTab}
        onTabChange={setActiveTab}
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
