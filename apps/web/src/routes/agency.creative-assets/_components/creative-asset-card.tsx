"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, FileText, Eye, Edit, Archive, ArchiveRestore, Globe, Lock } from "lucide-react";
import { useNavigate } from "react-router";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { creativeAssetSchema } from "./schema";
import { AssetStatusBadge } from "./asset-status-badge";

interface CreativeAssetCardProps {
  data: z.infer<typeof creativeAssetSchema>;
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  isArchiving?: boolean;
  isUnarchiving?: boolean;
  className?: string;
}

export function CreativeAssetCard({
  data,
  onEdit,
  onArchive,
  onUnarchive,
  isArchiving = false,
  isUnarchiving = false,
  className,
}: CreativeAssetCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/agency/creative-assets/${data.id}`);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/agency/creative-assets/${data.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(data.id);
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onArchive) {
      onArchive(data.id);
    }
  };

  const handleUnarchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnarchive) {
      onUnarchive(data.id);
    }
  };

  const isArchived = data.status === "ARCHIVED";

  return (
    <Card
      className={cn("group cursor-pointer transition-all hover:shadow-md", className)}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        {/* Status at the top */}
        <div className="flex items-center justify-between mb-3">
          <AssetStatusBadge status={data.status} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleViewDetails}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {!isArchived && <DropdownMenuSeparator />}
              {!isArchived && (
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Asset
                </DropdownMenuItem>
              )}
              {isArchived ? (
                <DropdownMenuItem 
                  onClick={handleUnarchive}
                  disabled={isUnarchiving}
                  className="text-destructive focus:text-destructive"
                >
                  {isUnarchiving ? (
                    <>
                      <Spinner variant="ellipsis" className="mr-2 h-4 w-4" size="sm" />
                      Unarchiving...
                    </>
                  ) : (
                    <>
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      Unarchive Asset
                    </>
                  )}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={handleArchive}
                  disabled={isArchiving}
                  className="text-destructive focus:text-destructive"
                >
                  {isArchiving ? (
                    <>
                      <Spinner variant="ellipsis" className="mr-2 h-4 w-4" size="sm" />
                      Archiving...
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive Asset
                    </>
                  )}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Title with more room */}
        <CardTitle className="text-lg font-bold line-clamp-2">
          {data.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {data.description && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Description
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {data.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Category
              </p>
              <Badge variant="outline" className="text-xs">
                {data.category || "Uncategorized"}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Public Status
              </p>
              <div className="flex items-center gap-1">
                {data.isPublic ? (
                  <>
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="default" className="text-xs">
                      Public
                    </Badge>
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="secondary" className="text-xs">
                      Internal
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Internal Version
              </p>
              <p className="text-sm font-medium">
                {data.currentInternalVersion ? `v${data.currentInternalVersion}` : "Ã¢â‚¬â€"}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Public Version
              </p>
              <p className="text-sm font-medium">
                {data.currentPublicVersion ? `v${data.currentPublicVersion}` : "Ã¢â‚¬â€"}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Created {new Date(data.createdAt).toLocaleDateString()}</span>
              <span>Updated {new Date(data.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

