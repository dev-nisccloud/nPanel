"use client";

import * as React from "react";
import {
  AlertTriangle,
  Download,
  HardDrive,
  LayoutDashboard,
  ListOrdered,
  Users,
  ScrollText,
} from "lucide-react";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DETAIL_TABS_LIST_CLASS,
  DETAIL_TABS_SCROLL_CLASS,
  DETAIL_TAB_CONTENT_CLASS,
  wpDetailLayout,
} from "@/components/wordpress/wp-detail-layout";
import { NiscBackupDetailTabTrigger } from "../detail-tab-trigger";
import { NiscBackupOverviewTab, type NiscBackupPageTab } from "../tabs/overview-tab";
import { NiscBackupAccountsTab } from "../tabs/accounts-tab";
import { NiscBackupJobsTab } from "../tabs/jobs-tab";
import { NiscBackupQueueTab } from "../tabs/queue-tab";
import { NiscBackupDownloadsTab } from "../tabs/downloads-tab";
import { NiscBackupAlertsTab } from "../tabs/alerts-tab";
import { NiscBackupLogsTab } from "../tabs/logs-tab";

export interface NiscBackupMainPageProps {
  basePath: string;
}

export function NiscBackupMainPage({ basePath }: NiscBackupMainPageProps) {
  const [activeTab, setActiveTab] = React.useState<NiscBackupPageTab>("overview");

  return (
    <div className={wpDetailLayout.page}>
      <div className={wpDetailLayout.container}>
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Nisc Backup</h1>
          <p className="text-xs text-muted-foreground">
            Manage backups, restores, and backup infrastructure across your hosting accounts
          </p>
        </div>

        <div className="mt-8">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as NiscBackupPageTab)}
            className="w-full"
          >
            <ScrollArea className={DETAIL_TABS_SCROLL_CLASS}>
              <TabsList className={DETAIL_TABS_LIST_CLASS}>
                <NiscBackupDetailTabTrigger
                  value="overview"
                  icon={LayoutDashboard}
                  title="Overview"
                  subtitle="Dashboard"
                />
                <NiscBackupDetailTabTrigger
                  value="accounts"
                  icon={Users}
                  title="Accounts"
                  subtitle="Hosting"
                />
                <NiscBackupDetailTabTrigger
                  value="jobs"
                  icon={HardDrive}
                  title="Jobs"
                  subtitle="Backup jobs"
                />
                <NiscBackupDetailTabTrigger
                  value="queue"
                  icon={ListOrdered}
                  title="Queue"
                  subtitle="Operations"
                />
                <NiscBackupDetailTabTrigger
                  value="downloads"
                  icon={Download}
                  title="Downloads"
                  subtitle="Save files"
                />
                <NiscBackupDetailTabTrigger
                  value="alerts"
                  icon={AlertTriangle}
                  title="Alerts"
                  subtitle="Notifications"
                />
                <NiscBackupDetailTabTrigger
                  value="logs"
                  icon={ScrollText}
                  title="Logs"
                  subtitle="Activity"
                />
              </TabsList>
              <ScrollBar orientation="horizontal" className="flex mt-0.5" />
            </ScrollArea>

            <TabsContent value="overview" className={DETAIL_TAB_CONTENT_CLASS + " mt-10"}>
              <NiscBackupOverviewTab onNavigateTab={setActiveTab} />
            </TabsContent>
            <TabsContent value="accounts" className={DETAIL_TAB_CONTENT_CLASS + " mt-10"}>
              <NiscBackupAccountsTab basePath={basePath} />
            </TabsContent>
            <TabsContent value="jobs" className={DETAIL_TAB_CONTENT_CLASS + " mt-10"}>
              <NiscBackupJobsTab />
            </TabsContent>
            <TabsContent value="queue" className={DETAIL_TAB_CONTENT_CLASS + " mt-10"}>
              <NiscBackupQueueTab />
            </TabsContent>
            <TabsContent value="downloads" className={DETAIL_TAB_CONTENT_CLASS + " mt-10"}>
              <NiscBackupDownloadsTab />
            </TabsContent>
            <TabsContent value="alerts" className={DETAIL_TAB_CONTENT_CLASS + " mt-10"}>
              <NiscBackupAlertsTab />
            </TabsContent>
            <TabsContent value="logs" className={DETAIL_TAB_CONTENT_CLASS + " mt-10"}>
              <NiscBackupLogsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
