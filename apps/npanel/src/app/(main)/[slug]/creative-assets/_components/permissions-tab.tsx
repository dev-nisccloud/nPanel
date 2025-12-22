"use client";

import * as React from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, Eye, Edit, MessageSquare, CheckCircle, Globe, Trash } from "lucide-react";
import { formatDate } from "./utils";
import { creativeAssetSchema, creativeAssetPermissionSchema } from "./schema";
import { useUserNames } from "./use-user-names";

interface PermissionsTabProps {
  asset: z.infer<typeof creativeAssetSchema>;
  onManagePermissions?: () => void;
}

export function PermissionsTab({ asset, onManagePermissions }: PermissionsTabProps) {
  const permissions = asset.permissions || [];

  // Collect all user IDs from permissions (userId and grantedBy)
  const allUserIds = React.useMemo(() => {
    const userIds: string[] = [];
    permissions.forEach((permission) => {
      if (permission.userId) userIds.push(permission.userId);
      if (permission.grantedBy) userIds.push(permission.grantedBy);
    });
    return userIds;
  }, [permissions]);

  // Fetch user names with caching
  const { getUserName } = useUserNames(allUserIds);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Manage agency user permissions for this asset
          </p>
        </div>
        {onManagePermissions && (
          <Button onClick={onManagePermissions}>
            <UserPlus className="mr-2 h-4 w-4" />
            Manage Permissions
          </Button>
        )}
      </div>

      {permissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No permissions set</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add permissions to grant access to agency users
            </p>
            {onManagePermissions && (
              <Button className="mt-4" variant="outline" onClick={onManagePermissions}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Permissions
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {permissions.map((permission) => (
            <PermissionCard key={permission.id} permission={permission} getUserName={getUserName} />
          ))}
        </div>
      )}
    </div>
  );
}

interface PermissionCardProps {
  permission: z.infer<typeof creativeAssetPermissionSchema>;
  getUserName: (userId: string | null | undefined) => string;
}

function PermissionCard({ permission, getUserName }: PermissionCardProps) {
  const permissionItems = [
    { key: "canView", label: "View", icon: Eye },
    { key: "canEdit", label: "Edit", icon: Edit },
    { key: "canComment", label: "Comment", icon: MessageSquare },
    { key: "canApprove", label: "Approve", icon: CheckCircle },
    { key: "canPublish", label: "Publish", icon: Globe },
    { key: "canDelete", label: "Delete", icon: Trash },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">User: {getUserName(permission.userId)}</CardTitle>
          <Badge variant="outline">Granted by {getUserName(permission.grantedBy)}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {permissionItems.map((item) => {
            const hasPermission = permission[item.key as keyof typeof permission] as boolean;
            const Icon = item.icon;
            return (
              <div key={item.key} className="flex items-center gap-2">
                <Icon
                  className={`h-4 w-4 ${hasPermission ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className="text-sm">{item.label}</span>
                {hasPermission ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          Granted {formatDate(permission.createdAt)} • Updated {formatDate(permission.updatedAt)}
        </div>
      </CardContent>
    </Card>
  );
}

