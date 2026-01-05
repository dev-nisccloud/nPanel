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
  RefreshCw,
  Settings,
  ExternalLink,
  Trash2,
} from "lucide-react";

export type DomainPortfolio = {
  id: string;
  domain: string;
  status: "ACTIVE" | "EXPIRED" | "PENDING" | "SUSPENDED" | "TRANSFERRING";
  registrationDate: Date | string;
  expiryDate: Date | string;
  clientName: string;
  clientEmail?: string;
  tld: string;
  autoRenewal: boolean;
  nameservers: string[];
  // Additional OpenProvider fields (optional)
  ownerHandle?: string;
  adminHandle?: string;
  techHandle?: string;
  billingHandle?: string;
  isLocked?: boolean;
  isPrivateWhois?: boolean;
  isDnssecEnabled?: boolean;
  authCode?: string;
  renewalDate?: Date | string;
  // Extended fields
  resellerId?: number;
  nsgroupId?: number;
  nsGroup?: string;
  type?: string;
  canRenew?: boolean;
  isLockable?: boolean;
  isDeleted?: boolean;
  isPremium?: boolean;
  isAbusive?: boolean;
  isParked?: boolean;
  orderDate?: string;
  activeDate?: string;
  registryExpirationDate?: string;
  lastChanged?: string;
  ownerCompanyName?: string;
  ownerFullName?: string;
  comments?: string;
  unit?: string;
  dnssec?: string;
  nameServersFull?: Array<{
    name: string;
    ip?: string;
    ip6?: string;
    seqNr?: number;
  }>;
};

interface DomainPortfolioCardProps {
  data: DomainPortfolio;
  onView?: (id: string) => void;
  onManage?: (id: string) => void;
  onRenew?: (id: string) => void;
  onTransfer?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function DomainPortfolioCard({
  data,
  onView,
  onManage,
  onRenew,
  onTransfer,
  onDelete,
  className,
}: DomainPortfolioCardProps) {
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);

  const handleCardClick = () => {
    if (onView) {
      onView(data.id);
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      PENDING: "secondary",
      EXPIRED: "destructive",
      SUSPENDED: "outline",
      TRANSFERRING: "secondary",
    };

    const statusColors: Record<string, string> = {
      ACTIVE: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      PENDING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      EXPIRED: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      SUSPENDED: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300",
      TRANSFERRING: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    };

    return (
      <Badge
        variant={variants[data.status] || "secondary"}
        className={cn("text-xs", statusColors[data.status] || "")}
      >
        {data.status}
      </Badge>
    );
  };

  const isExpiringSoon = () => {
    const expiryDate = new Date(data.expiryDate);
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = () => {
    const expiryDate = new Date(data.expiryDate);
    return expiryDate.getTime() < new Date().getTime();
  };

  return (
    <Card
      className={cn("group cursor-pointer transition-all hover:shadow-md p-4", className)}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left side: Domain info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm font-semibold truncate">
              {data.domain}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge()}
            {data.autoRenewal && (
              <Badge variant="outline" className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                Auto-renew
              </Badge>
            )}
            {isExpiringSoon() && !isExpired() && (
              <Badge variant="outline" className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                Expiring Soon
              </Badge>
            )}
            {isExpired() && (
              <Badge variant="destructive" className="text-xs">
                Expired
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Expires {new Date(data.expiryDate).toLocaleDateString()}</span>
            </div>
            {data.nameservers.length > 0 && (
              <span>{data.nameservers.length} NS</span>
            )}
          </div>
        </div>

        {/* Right side: Action menu */}
        <DropdownMenu open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 flex-shrink-0"
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
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                if (onManage) onManage(data.id);
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Manage Domain
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {data.status === "ACTIVE" && (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  if (onRenew) onRenew(data.id);
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Renew Domain
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                if (onTransfer) onTransfer(data.id);
              }}
            >
              <Globe className="mr-2 h-4 w-4" />
              Transfer Domain
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                if (onDelete) onDelete(data.id);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}

interface DomainPortfolioCardsListProps {
  data: DomainPortfolio[];
  onView?: (id: string) => void;
  onManage?: (id: string) => void;
  onRenew?: (id: string) => void;
  onTransfer?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function DomainPortfolioCardsList({
  data,
  onView,
  onManage,
  onRenew,
  onTransfer,
  onDelete,
  cols = 1,
  className,
}: DomainPortfolioCardsListProps) {
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
      {data.map((domain) => (
        <DomainPortfolioCard
          key={domain.id}
          data={domain}
          onView={onView}
          onManage={onManage}
          onRenew={onRenew}
          onTransfer={onTransfer}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

