"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Globe, DollarSign } from "lucide-react";
import { tldSchema } from "./schema";
import { TldCellViewer } from "./tld-cell-viewer";

interface TldCardProps {
  data: z.infer<typeof tldSchema>;
  className?: string;
}

export function TldCard({ data, className }: TldCardProps) {
  const formatPrice = (price: number | undefined, currency: string | undefined) => {
    if (price === undefined || currency === undefined) {
      return 'N/A';
    }
    return `${currency} ${price.toFixed(2)}`;
  };

  const getStatusBadgeVariant = () => {
    return data.status === 'ACT' ? 'default' : 'secondary';
  };

  const getStatusIcon = () => {
    return data.status === 'ACT' ? (
      <CheckCircle className="h-3 w-3 stroke-border fill-green-500 dark:fill-green-400" />
    ) : (
      <XCircle className="h-3 w-3 stroke-border fill-gray-500 dark:fill-gray-400" />
    );
  };

  return (
    <TldCellViewer tld={data}>
      <Card 
        className={cn(
          "group cursor-pointer transition-all hover:shadow-md hover:border-primary/20",
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <CardTitle className="text-lg font-bold truncate">
                {data.name}
              </CardTitle>
            </div>
            <Badge variant={getStatusBadgeVariant()} className="flex items-center gap-1">
              {getStatusIcon()}
              {data.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Registration Price
              </p>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {formatPrice(
                    data.prices?.reseller_price?.reseller?.price,
                    data.prices?.reseller_price?.reseller?.currency
                  )}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Period Range
              </p>
              <p className="text-sm font-medium">
                {data.min_period}-{data.max_period} years
              </p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex flex-wrap gap-1">
              {data.transfer_available && (
                <Badge variant="outline" className="text-xs">
                  Transfer
                </Badge>
              )}
              {data.renew_available && (
                <Badge variant="outline" className="text-xs">
                  Renewal
                </Badge>
              )}
              {data.dnssec_allowed && (
                <Badge variant="outline" className="text-xs">
                  DNSSEC
                </Badge>
              )}
              {data.is_private_whois_allowed && (
                <Badge variant="outline" className="text-xs">
                  Private Whois
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TldCellViewer>
  );
}

// TLD Cards List Component
interface TldCardsListProps {
  data: z.infer<typeof tldSchema>[];
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function TldCardsList({ 
  data, 
  cols = 4,
  className 
}: TldCardsListProps) {
  return (
    <div 
      className={cn(
        "grid gap-4",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 md:grid-cols-2",
        cols === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        cols === 5 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
        cols === 6 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6",
        className
      )}
    >
      {data.map((tld, index) => (
        <TldCard
          key={tld.name || `tld-${index}`}
          data={tld}
        />
      ))}
    </div>
  );
}
