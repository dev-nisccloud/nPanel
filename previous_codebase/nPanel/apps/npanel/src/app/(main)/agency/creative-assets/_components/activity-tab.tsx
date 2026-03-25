"use client";

import * as React from "react";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, User, Clock } from "lucide-react";
import { formatDate } from "./utils";
import { creativeAssetSchema, creativeAssetActivityLogSchema } from "./schema";

interface ActivityTabProps {
  asset: z.infer<typeof creativeAssetSchema>;
}

export function ActivityTab({ asset }: ActivityTabProps) {
  const activityLogs = asset.activityLogs || [];

  // Combine asset and version activity logs
  const allActivities: Array<z.infer<typeof creativeAssetActivityLogSchema> & { type: "asset" | "version" }> = [
    ...activityLogs.map((log) => ({ ...log, type: "asset" as const })),
    // Version activity logs would be added here
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Activity Log</h3>
        <p className="text-sm text-muted-foreground">
          Complete history of actions performed on this asset
        </p>
      </div>

      {allActivities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No activity recorded yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ActivityCardProps {
  activity: z.infer<typeof creativeAssetActivityLogSchema> & { type: "asset" | "version" };
}

function ActivityCard({ activity }: ActivityCardProps) {
  const getActionBadgeVariant = (action: string) => {
    if (action.includes("CREATE") || action.includes("APPROVE")) {
      return "default";
    }
    if (action.includes("REJECT") || action.includes("DELETE")) {
      return "destructive";
    }
    return "secondary";
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{activity.userId}</span>
              <Badge variant={getActionBadgeVariant(activity.action)} className="text-xs">
                {activity.action}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {activity.type}
              </Badge>
            </div>
            {activity.description && (
              <p className="text-sm text-muted-foreground">{activity.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDate(activity.createdAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

