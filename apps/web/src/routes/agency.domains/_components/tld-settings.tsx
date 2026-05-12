"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Network } from "lucide-react";
import { NameserverGroupsCards } from "./nameserver-groups-cards";
import { TldSettingsCards } from "./tld-settings-cards";
import { DomainsRequestIpTable } from "./domains-request-ip-table";

type SettingsSubTab = "tld-settings" | "nameservers" | "request-ip";

/**
 * Keep each sub-panel mounted after first visit (display toggled), matching domain category tabs:
 * switching away and back does not remount or refetch unless the query cache invalidates.
 */
export function TldSettings() {
  const [activeTab, setActiveTab] = React.useState<SettingsSubTab>("tld-settings");
  const visitedRef = React.useRef<Set<SettingsSubTab>>(new Set(["tld-settings"]));

  const selectTab = React.useCallback((tab: SettingsSubTab) => {
    visitedRef.current.add(tab);
    setActiveTab(tab);
  }, []);

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
            onClick={() => selectTab("tld-settings")}
            className="flex items-center gap-2"
          >
            <Icons.Database className="h-4 w-4" />
            TLD Settings
          </Button>
          <Button
            variant={activeTab === "nameservers" ? "default" : "ghost"}
            size="sm"
            onClick={() => selectTab("nameservers")}
            className="flex items-center gap-2"
          >
            <Icons.Security className="h-4 w-4" />
            Nameservers
          </Button>
          <Button
            variant={activeTab === "request-ip" ? "default" : "ghost"}
            size="sm"
            onClick={() => selectTab("request-ip")}
            className="flex items-center gap-2"
          >
            <Network className="h-4 w-4" />
            Domains Request IP address
          </Button>
        </div>

        {/* Tab panels: mount after first visit; keep mounted when switching (hidden via display). */}
        <div className="mt-0">
          <div
            role="tabpanel"
            aria-hidden={activeTab !== "tld-settings"}
            style={{ display: activeTab === "tld-settings" ? "block" : "none" }}
          >
            {visitedRef.current.has("tld-settings") ? <TldSettingsCards /> : null}
          </div>
          <div
            role="tabpanel"
            aria-hidden={activeTab !== "nameservers"}
            style={{ display: activeTab === "nameservers" ? "block" : "none" }}
          >
            {visitedRef.current.has("nameservers") ? <NameserverGroupsCards /> : null}
          </div>
          <div
            role="tabpanel"
            aria-hidden={activeTab !== "request-ip"}
            style={{ display: activeTab === "request-ip" ? "block" : "none" }}
          >
            {visitedRef.current.has("request-ip") ? <DomainsRequestIpTable /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
