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
import { MoreHorizontal, Ban, Lock, Unlock, ShieldCheck, ShieldX, BadgeCheck } from "lucide-react";
import { clientSchema } from "./schema";

interface ClientCardProps {
  data: z.infer<typeof clientSchema>;
  onView?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onBan?: (id: string) => void;
  onUnban?: (id: string) => void;
  onSuspend?: (id: string) => void;
  onUnsuspend?: (id: string) => void;
  className?: string;
}

export function ClientCard({
  data,
  onView,
  onDeactivate,
  onReactivate,
  onBan,
  onUnban,
  onSuspend,
  onUnsuspend,
  className,
}: ClientCardProps) {
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);

  const handleCardClick = () => {
    if (onView) {
      onView(data.id);
    }
  };

  const handleDeactivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsActionMenuOpen(false);
    if (data.status === "DEACTIVATED" && onReactivate) {
      setTimeout(() => onReactivate(data.id), 0);
    } else if (onDeactivate) {
      setTimeout(() => onDeactivate(data.id), 0);
    }
  };

  const handleBan = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsActionMenuOpen(false);
    if (data.status === "BANNED" && onUnban) {
      setTimeout(() => onUnban(data.id), 0);
    } else if (onBan) {
      setTimeout(() => onBan(data.id), 0);
    }
  };

  const handleSuspend = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsActionMenuOpen(false);
    if (data.status === "SUSPENDED" && onUnsuspend) {
      setTimeout(() => onUnsuspend(data.id), 0);
    } else if (onSuspend) {
      setTimeout(() => onSuspend(data.id), 0);
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      SUSPENDED: "secondary",
      BANNED: "destructive",
      DEACTIVATED: "outline",
    };
    return (
      <Badge variant={variants[data.status] || "secondary"}>
        {data.status}
      </Badge>
    );
  };

  const isDeactivated = data.status === "DEACTIVATED";
  const isBanned = data.status === "BANNED";
  const isSuspended = data.status === "SUSPENDED";

  return (
    <Card
      className={cn("group cursor-pointer transition-all hover:shadow-md", className)}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        {/* Top row: Status badge on left, action menu on right */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
          <DropdownMenu open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
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
            <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
              {isDeactivated ? (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handleDeactivate(e as any);
                  }}
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  Reactivate Account
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleDeactivate(e as any);
                    }}
                    disabled={isDeactivated}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Deactivate Account
                  </DropdownMenuItem>
                  {isBanned ? (
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        handleBan(e as any);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Unlock className="mr-2 h-4 w-4" />
                      Unban Account
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        handleBan(e as any);
                      }}
                      disabled={isBanned}
                      className="text-destructive focus:text-destructive"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Ban Account
                    </DropdownMenuItem>
                  )}
                  {isSuspended ? (
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        handleSuspend(e as any);
                      }}
                    >
                      <Unlock className="mr-2 h-4 w-4" />
                      Unsuspend Account
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        handleSuspend(e as any);
                      }}
                      disabled={isSuspended}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Suspend Account
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Name - can wrap to two lines, then ellipsis */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Name
          </p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium line-clamp-2">
              {data.name}
            </p>
            {data.emailVerified && (
              <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0 fill-blue-500" />
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Email
            </p>
            {data.emailVerified ? (
              <ShieldCheck className="h-3 w-3 text-green-500" />
            ) : (
              <ShieldX className="h-3 w-3 text-gray-400" />
            )}
          </div>
          <p className="text-sm font-medium">{data.email}</p>
        </div>

        {/* Role */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Role
          </p>
          <Badge variant="outline" className="text-xs">
            {data.role}
          </Badge>
        </div>

        {/* Created on */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Created On
          </p>
          <p className="text-sm font-medium">
            {new Date(data.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Updated on */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Updated On
          </p>
          <p className="text-sm font-medium">
            {new Date(data.updatedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Last login at - only if available */}
        {data.lastLoginAt && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Last Login At
            </p>
            <p className="text-sm font-medium">
              {new Date(data.lastLoginAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ClientCardsListProps {
  data: z.infer<typeof clientSchema>[];
  onView?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onBan?: (id: string) => void;
  onUnban?: (id: string) => void;
  onSuspend?: (id: string) => void;
  onUnsuspend?: (id: string) => void;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function ClientCardsList({
  data,
  onView,
  onDeactivate,
  onReactivate,
  onBan,
  onUnban,
  onSuspend,
  onUnsuspend,
  cols = 1,
  className,
}: ClientCardsListProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 md:grid-cols-2",
        cols === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {data.map((client) => (
        <ClientCard
          key={client.id}
          data={client}
          onView={onView}
          onDeactivate={onDeactivate}
          onReactivate={onReactivate}
          onBan={onBan}
          onUnban={onUnban}
          onSuspend={onSuspend}
          onUnsuspend={onUnsuspend}
        />
      ))}
    </div>
  );
}

