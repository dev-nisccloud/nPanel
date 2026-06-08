"use client";

import {
  AlertTriangle,
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
import { JetBackupDetailTabTrigger } from "../detail-tab-trigger";
import { JetBackupOverviewTab } from "../tabs/overview-tab";
import { JetBackupAccountsTab } from "../tabs/accounts-tab";
import { JetBackupJobsTab } from "../tabs/jobs-tab";
import { JetBackupQueueTab } from "../tabs/queue-tab";
import { JetBackupAlertsTab } from "../tabs/alerts-tab";
import { JetBackupLogsTab } from "../tabs/logs-tab";

export interface JetBackupMainPageProps {
  basePath: string;
}

export function JetBackupMainPage({ basePath }: JetBackupMainPageProps) {
  return (
    <div className={wpDetailLayout.page}>
      <div className={wpDetailLayout.container}>
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">JetBackup 5</h1>
          <p className="text-xs text-muted-foreground">
            Manage backups, restores, and backup infrastructure across your hosting accounts
          </p>
        </div>

        <div className="mt-8">
          <Tabs defaultValue="overview" className="w-full">
            <ScrollArea className={DETAIL_TABS_SCROLL_CLASS}>
              <TabsList className={DETAIL_TABS_LIST_CLASS}>
                <JetBackupDetailTabTrigger
                  value="overview"
                  icon={LayoutDashboard}
                  title="Overview"
                  subtitle="Dashboard"
                />
                <JetBackupDetailTabTrigger
                  value="accounts"
                  icon={Users}
                  title="Accounts"
                  subtitle="Hosting"
                />
                <JetBackupDetailTabTrigger
                  value="jobs"
                  icon={HardDrive}
                  title="Jobs"
                  subtitle="Backup jobs"
                />
                <JetBackupDetailTabTrigger
                  value="queue"
                  icon={ListOrdered}
                  title="Queue"
                  subtitle="Operations"
                />
                <JetBackupDetailTabTrigger
                  value="alerts"
                  icon={AlertTriangle}
                  title="Alerts"
                  subtitle="Notifications"
                />
                <JetBackupDetailTabTrigger
                  value="logs"
                  icon={ScrollText}
                  title="Logs"
                  subtitle="Activity"
                />
              </TabsList>
              <ScrollBar orientation="horizontal" className="flex" />
            </ScrollArea>

            <TabsContent value="overview" className={DETAIL_TAB_CONTENT_CLASS + " mt-10"}>
              <JetBackupOverviewTab />
            </TabsContent>
            <TabsContent value="accounts" className={DETAIL_TAB_CONTENT_CLASS + " mt-10"}>
              <JetBackupAccountsTab basePath={basePath} />
            </TabsContent>
            <TabsContent value="jobs" className={DETAIL_TAB_CONTENT_CLASS + " mt-10"}>
              <JetBackupJobsTab />
            </TabsContent>
            <TabsContent value="queue" className={DETAIL_TAB_CONTENT_CLASS + " mt-10"}>
              <JetBackupQueueTab />
            </TabsContent>
            <TabsContent value="alerts" className={DETAIL_TAB_CONTENT_CLASS + " mt-10"}>
              <JetBackupAlertsTab />
            </TabsContent>
            <TabsContent value="logs" className={DETAIL_TAB_CONTENT_CLASS + " mt-10"}>
              <JetBackupLogsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
