"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Activity } from "lucide-react";

import { ProfileHeader } from "./agency.my-account/_components/profile-header";
import { ProfileForm } from "./agency.my-account/_components/profile-form";
import { AccountActivitiesList } from "./agency.my-account/_components/account-activities-list";

export default function MyAccountPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">My Account</h1>
          <p className="text-xs text-muted-foreground">
            Manage your account settings and view your account activities
          </p>
        </div>

        {/* Profile Header Card */}
        <div className="mt-6">
          <ProfileHeader />
        </div>

        {/* Tabs for Profile and Account Activities */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="activities" className="gap-2">
                <Activity className="h-4 w-4" />
                Account Activities
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <ProfileForm />
            </TabsContent>

            <TabsContent value="activities" className="mt-6">
              <AccountActivitiesList />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
