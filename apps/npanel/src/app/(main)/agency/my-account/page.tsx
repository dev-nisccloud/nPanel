"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Activity } from "lucide-react";

import { ProfileHeader } from "./_components/profile-header";
import { ProfileForm } from "./_components/profile-form";
import { AccountActivitiesList } from "./_components/account-activities-list";

export default function MyAccountPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
        <p className="text-muted-foreground">
          Manage your account settings and view your account activities
        </p>
      </div>

      {/* Profile Header Card */}
      <ProfileHeader />

      {/* Tabs for Profile and Account Activities */}
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

        <TabsContent value="profile">
          <ProfileForm />
        </TabsContent>

        <TabsContent value="activities">
          <AccountActivitiesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
