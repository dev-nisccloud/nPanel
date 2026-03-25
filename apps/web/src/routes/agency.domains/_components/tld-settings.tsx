"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { NameserverGroupsCards } from "./nameserver-groups-cards";
import { TldSettingsCards } from "./tld-settings-cards";

export function TldSettings() {
  const [activeTab, setActiveTab] = React.useState("tld-settings");

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">TLD Settings</h2>
          <p className="text-muted-foreground">
            Manage TLD configurations and nameserver groups settings
          </p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 rounded-lg bg-muted p-1">
          <Button
            variant={activeTab === "tld-settings" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("tld-settings")}
            className="flex items-center gap-2"
          >
            <Icons.Database className="h-4 w-4" />
            TLD Settings
          </Button>
          <Button
            variant={activeTab === "nameservers" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("nameservers")}
            className="flex items-center gap-2"
          >
            <Icons.Security className="h-4 w-4" />
            Nameservers
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "tld-settings" && <TldSettingsCards />}
        {activeTab === "nameservers" && <NameserverGroupsCards />}
      </div>
    </div>
  );
}
