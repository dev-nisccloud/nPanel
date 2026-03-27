"use client";

import * as React from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Lock, FileText, User, Calendar } from "lucide-react";

import { creativeAssetSchema } from "./schema";
import { AssetStatusBadge } from "./asset-status-badge";
import { formatFileSize, formatDate } from "./utils";

interface AssetOverviewProps {
  asset: z.infer<typeof creativeAssetSchema>;
}

export function AssetOverview({ asset }: AssetOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Minimal Info Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Status
          </p>
          <AssetStatusBadge status={asset.status} />
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Category
          </p>
          <Badge variant="outline">{asset.category || "Uncategorized"}</Badge>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Internal Version
          </p>
          <p className="text-sm font-medium">v{asset.currentInternalVersion}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Public Version
          </p>
          <p className="text-sm font-medium">
            {asset.currentPublicVersion ? `v${asset.currentPublicVersion}` : "—"}
          </p>
        </div>

        {asset.versions && asset.versions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              File Type
            </p>
            <p className="text-sm font-medium">
              {asset.versions[0]?.mimeType?.split('/')[1]?.toUpperCase() || "Unknown"}
            </p>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Visibility
          </p>
          <div className="flex items-center gap-1">
            {asset.isPublic ? (
              <>
                <Globe className="h-3 w-3 text-muted-foreground" />
                <Badge variant="default" className="text-xs">Public</Badge>
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs">Internal</Badge>
              </>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Total Versions
          </p>
          <p className="text-sm font-medium">{asset.versions?.length || 0}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Created By
          </p>
          <p className="text-sm font-medium">{asset.createdBy}</p>
        </div>
      </div>
    </div>
  );
}

