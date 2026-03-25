"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users } from "lucide-react";

import { TeamSettingsTab } from "./_components/team-settings-tab";

export default function SettingsPage() {
  const pathname = usePathname();
  const teamSlug = pathname.split("/")[1] ?? "";
  const [activeTab, setActiveTab] = useState("team-settings");

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground">
            Manage your company billing, invitations, and members in one place
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-1">
              <TabsTrigger value="team-settings" className="gap-2">
                <Users className="h-4 w-4" />
                Company Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="team-settings" className="mt-6">
              <TeamSettingsTab teamSlug={teamSlug} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
