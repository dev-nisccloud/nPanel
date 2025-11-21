"use client";

import * as React from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Upload, Check, X, Globe, MoreHorizontal, Edit, Archive, ArchiveRestore, Lock } from "lucide-react";
import { formatFileSize, formatDate } from "./utils";
import { creativeAssetSchema, creativeAssetVersionSchema } from "./schema";
import { VersionStatusBadge } from "./version-status-badge";
import { VersionDetailDialog } from "./version-detail-dialog";

interface VersionsTabProps {
  asset: z.infer<typeof creativeAssetSchema>;
  onUploadVersion?: () => void;
  onUpdateVersionStatus?: (versionId: string, status: "PENDING" | "APPROVED" | "REJECTED" | "NOT_APPLICABLE") => void;
  onMakePrivate?: (versionId: string) => void;
  onEditVersion?: (versionId: string) => void;
}

export function VersionsTab({
  asset,
  onUploadVersion,
  onUpdateVersionStatus,
  onMakePrivate,
  onEditVersion,
}: VersionsTabProps) {
  const versions = asset.versions || [];
  const sortedVersions = [...versions].sort(
    (a, b) => b.internalVersionNumber - a.internalVersionNumber
  );
  const [selectedVersion, setSelectedVersion] = React.useState<z.infer<typeof creativeAssetVersionSchema> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Version History</h3>
          <p className="text-sm text-muted-foreground">
            Manage internal and public versions of this asset
          </p>
        </div>
        {onUploadVersion && (
          <Button onClick={onUploadVersion}>
            <Upload className="mr-2 h-4 w-4" />
            Upload New Version
          </Button>
        )}
      </div>

      {/* Versions List */}
      {sortedVersions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No versions uploaded yet</p>
            {onUploadVersion && (
              <Button className="mt-4" variant="outline" onClick={onUploadVersion}>
                <Upload className="mr-2 h-4 w-4" />
                Upload First Version
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {sortedVersions.map((version, index) => (
              <VersionCard
                key={version.id}
                version={version}
                isLatest={index === 0}
                onUpdateStatus={onUpdateVersionStatus}
                onMakePrivate={onMakePrivate}
                onEdit={onEditVersion}
                onClick={() => {
                  setSelectedVersion(version);
                  setIsDialogOpen(true);
                }}
              />
            ))}
          </div>
          {selectedVersion && (
            <VersionDetailDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              version={selectedVersion}
            />
          )}
        </>
      )}
    </div>
  );
}

interface VersionCardProps {
  version: z.infer<typeof creativeAssetVersionSchema>;
  isLatest: boolean;
  onUpdateStatus?: (versionId: string, status: "PENDING" | "APPROVED" | "REJECTED" | "NOT_APPLICABLE") => void;
  onMakePrivate?: (versionId: string) => void;
  onEdit?: (versionId: string) => void;
  onClick?: () => void;
}

function VersionCard({
  version,
  isLatest,
  onUpdateStatus,
  onMakePrivate,
  onEdit,
  onClick,
}: VersionCardProps) {
  const isArchived = version.internalApprovalStatus === "NOT_APPLICABLE";
  const canMakePrivate = version.isPublic && onMakePrivate;

  const handleCardClick = React.useCallback((e: React.MouseEvent) => {
    // Don't open dialog if clicking on dropdown menu or its trigger
    const target = e.target as HTMLElement;
    const isDropdownClick = target.closest('[data-slot="dropdown-menu"]') || 
                           target.closest('[data-slot="dropdown-menu-trigger"]') ||
                           target.closest('[data-slot="dropdown-menu-content"]') ||
                           target.closest('[data-slot="dropdown-menu-sub"]') ||
                           target.closest('[data-slot="dropdown-menu-sub-content"]');
    
    if (!isDropdownClick && onClick) {
      onClick();
    }
  }, [onClick]);

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCardClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <VersionStatusBadge status={version.internalApprovalStatus} />
            {isLatest && <Badge variant="outline">Latest</Badge>}
            {version.isPublic && (
              <Badge variant="default">
                <Globe className="mr-1 h-3 w-3" />
                Public v{version.publicVersionNumber}
              </Badge>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(version.id);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                {/* Change Status Submenu */}
                {onUpdateStatus && (
                  <>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        Change Status
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(version.id, "PENDING");
                          }}
                        >
                          Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(version.id, "APPROVED");
                          }}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approved
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(version.id, "REJECTED");
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Rejected
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(version.id, "NOT_APPLICABLE");
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Not Applicable
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Make Private (only if public) */}
                {canMakePrivate && (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onMakePrivate?.(version.id);
                      }}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Make Private
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Archive/Unarchive */}
                {!isArchived ? (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus?.(version.id, "NOT_APPLICABLE");
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus?.(version.id, "PENDING");
                    }}
                  >
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Unarchive
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="space-y-1 mt-2">
          <CardTitle className="text-base">
            Version {version.internalVersionNumber}
            {version.isPublic && version.publicVersionNumber && (
              <span className="text-muted-foreground ml-2">
                (Public v{version.publicVersionNumber})
              </span>
            )}
          </CardTitle>
          {version.versionNotes && (
            <p className="text-sm text-muted-foreground">{version.versionNotes}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              File Name
            </p>
            <p className="text-sm font-medium">{version.fileName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              File Size
            </p>
            <p className="text-sm font-medium">{formatFileSize(version.fileSize)}</p>
          </div>
        </div>

        {/* Changes Summary */}
        {version.changesSummary && (
          <div className="pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Changes Summary
            </p>
            <p className="text-sm text-muted-foreground">{version.changesSummary}</p>
          </div>
        )}

        {/* Timestamps and Click Hint */}
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Created {formatDate(version.createdAt)}</span>
            <span>Updated {formatDate(version.updatedAt)}</span>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Click card to view version details and preview
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

