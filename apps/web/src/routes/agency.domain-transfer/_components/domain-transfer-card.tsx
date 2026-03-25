"use client";

import * as React from "react";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  MoreHorizontal,
  Globe,
  Calendar,
  User,
  Mail,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface DomainTransfer {
  id: string;
  domain: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";
  requestedAt: Date;
  completedAt: Date | null;
  clientName: string;
  clientEmail: string;
  previousRegistrar: string;
  authCode: string;
  failureReason: string | null;
}

interface DomainTransferCardProps {
  data: DomainTransfer;
  onView?: (id: string) => void;
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
  className?: string;
}

export function DomainTransferCard({
  data,
  onView,
  onRetry,
  onCancel,
  className,
}: DomainTransferCardProps) {
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);

  const handleCardClick = () => {
    if (onView) {
      onView(data.id);
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDING: "secondary",
      IN_PROGRESS: "default",
      COMPLETED: "default",
      FAILED: "destructive",
      CANCELLED: "outline",
    };

    const statusColors: Record<string, string> = {
      PENDING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      IN_PROGRESS: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
      COMPLETED: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      FAILED: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      CANCELLED: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300",
    };

    const statusIcons: Record<string, React.ReactNode> = {
      PENDING: <Clock className="h-3 w-3 mr-1" />,
      IN_PROGRESS: <RefreshCw className="h-3 w-3 mr-1 animate-spin" />,
      COMPLETED: <CheckCircle className="h-3 w-3 mr-1" />,
      FAILED: <XCircle className="h-3 w-3 mr-1" />,
      CANCELLED: <AlertCircle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge
        variant={variants[data.status] || "secondary"}
        className={cn("text-xs flex items-center", statusColors[data.status] || "")}
      >
        {statusIcons[data.status]}
        {data.status.replace("_", " ")}
      </Badge>
    );
  };

  const getDaysSinceRequested = () => {
    const days = Math.floor(
      (new Date().getTime() - data.requestedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

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
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  if (onView) onView(data.id);
                }}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {data.status === "FAILED" && onRetry && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    onRetry(data.id);
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Transfer
                </DropdownMenuItem>
              )}
              {(data.status === "PENDING" || data.status === "IN_PROGRESS") && onCancel && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    onCancel(data.id);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Transfer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Domain name */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Domain
          </p>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm font-semibold line-clamp-1">
              {data.domain}
            </p>
          </div>
        </div>

        {/* Client Information */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Client
          </p>
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <p className="text-sm font-medium line-clamp-1">
              {data.clientName}
            </p>
          </div>
          <div className="flex items-center gap-2 pl-5">
            <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground line-clamp-1">
              {data.clientEmail}
            </p>
          </div>
        </div>

        {/* Previous Registrar */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Previous Registrar
          </p>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <p className="text-sm font-medium">
              {data.previousRegistrar}
            </p>
          </div>
        </div>

        {/* Requested Date */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Requested
          </p>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <p className="text-sm font-medium">
              {data.requestedAt.toLocaleDateString()}
            </p>
            <span className="text-xs text-muted-foreground">
              ({getDaysSinceRequested()} days ago)
            </span>
          </div>
        </div>

        {/* Completed Date (if completed) */}
        {data.completedAt && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Completed
            </p>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                {data.completedAt.toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Failure Reason (if failed) */}
        {data.failureReason && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Failure Reason
            </p>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive line-clamp-2">
                {data.failureReason}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DomainTransferCardsListProps {
  data: DomainTransfer[];
  onView?: (id: string) => void;
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function DomainTransferCardsList({
  data,
  onView,
  onRetry,
  onCancel,
  cols = 1,
  className,
}: DomainTransferCardsListProps) {
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
      {data.map((transfer) => (
        <DomainTransferCard
          key={transfer.id}
          data={transfer}
          onView={onView}
          onRetry={onRetry}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}

