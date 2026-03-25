"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import type { ServicePlan } from "./schema";
import { 
  getPlanTypeDisplayName,
  getHostingSubTypeDisplayName,
  getBillingCycleDisplayName,
  getPlanStatusBadgeVariant,
} from "./service-plans-utils";

interface HostingPlanCardProps {
  data: ServicePlan;
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function HostingPlanCard({ 
  data, 
  onViewDetails,
  onEdit,
  onDelete,
  className 
}: HostingPlanCardProps) {
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(data.id);
    }
  };

  return (
    <Card 
      className={cn("group cursor-pointer transition-all hover:shadow-md", className)}
      onClick={handleViewDetails}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg font-bold truncate">
                {data.name}
              </CardTitle>
              {data.isPopular && (
                <Badge variant="default" className="text-xs">
                  Popular
                </Badge>
              )}
              {data.isRecommended && (
                <Badge variant="secondary" className="text-xs">
                  Recommended
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={getPlanStatusBadgeVariant(data.isActive)}>
                {data.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline">
                {getPlanTypeDisplayName(data.planType)}
              </Badge>
              {data.hostingSubType && (
                <Badge variant="outline">
                  {getHostingSubTypeDisplayName(data.hostingSubType)}
                </Badge>
              )}
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEdit(data.id);
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(data.id);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
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
                Price
              </p>
              <p className="text-sm font-medium">
                {data.niscPrice ? `${data.niscPrice} ${data.niscCurrency}` : "Not set"}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Billing Cycle
              </p>
              <p className="text-sm font-medium">
                {getBillingCycleDisplayName(data.billingCycle)}
              </p>
            </div>

            {data.setupFee && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Setup Fee
                </p>
                <p className="text-sm font-medium">
                  {data.setupFee} {data.niscCurrency}
                </p>
              </div>
            )}

            {data.isDefault && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Default Plan
                </p>
                <Badge variant="secondary" className="text-xs">
                  Yes
                </Badge>
              </div>
            )}
          </div>

          {data.features.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Features ({data.features.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {data.features.slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {data.features.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{data.features.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {data.highlights.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Highlights
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {data.highlights.slice(0, 2).map((highlight, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-primary">Ã¢â‚¬Â¢</span>
                    <span className="line-clamp-1">{highlight}</span>
                  </li>
                ))}
                {data.highlights.length > 2 && (
                  <li className="text-xs text-muted-foreground">
                    +{data.highlights.length - 2} more highlights
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Hosting Plans Cards List Component
interface HostingPlansCardsListProps {
  data: ServicePlan[];
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function HostingPlansCardsList({ 
  data, 
  onViewDetails, 
  onEdit,
  onDelete,
  cols = 1,
  className 
}: HostingPlansCardsListProps) {
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
      {data.map((plan) => (
        <HostingPlanCard
          key={plan.id}
          data={plan}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

