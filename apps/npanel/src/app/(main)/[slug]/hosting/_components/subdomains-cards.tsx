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
import { MoreHorizontal, Trash2, Globe, Shield, Code, FolderOpen, ExternalLink } from "lucide-react";
import { subdomainSchema } from "./subdomains-schema";

interface SubdomainCardProps {
  data: z.infer<typeof subdomainSchema>;
  onDelete?: (id: number | undefined) => void;
  className?: string;
}

export function SubdomainCard({ 
  data, 
  onDelete,
  className 
}: SubdomainCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(data.id);
    }
  };

  const getStatusBadgeVariant = () => {
    if (data.status === "ok") return "default";
    return "destructive";
  };

  const getStatusText = () => {
    if (data.status === "ok") return "Active";
    return "Inactive";
  };

  const getPhpVersion = () => {
    if (!data.properties?.php_handler_id) return "N/A";
    // Extract version from handler ID like "plesk-php83-fpm-dedicated"
    const match = data.properties.php_handler_id.match(/php(\d+)/);
    return match ? `PHP ${match[1]}` : data.properties.php_handler_id;
  };

  return (
    <Card 
      className={cn("group cursor-pointer transition-all hover:shadow-md", className)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <CardTitle className="text-lg font-bold truncate">
              {data.name || "Unknown Subdomain"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant()}>
              {getStatusText()}
            </Badge>
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
                <DropdownMenuItem onClick={() => window.open(`https://${data.name}`, '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in New Tab
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Parent Domain
            </p>
            <p className="text-sm font-medium truncate">
              {data.parent || "N/A"}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              SSL Security
            </p>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-muted-foreground" />
              <Badge 
                variant={data.properties?.ssl ? "default" : "secondary"}
                className="text-xs"
              >
                {data.properties?.ssl ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Document Root
            </p>
            <div className="flex items-center gap-1">
              <FolderOpen className="h-3 w-3 text-muted-foreground" />
              <p className="text-sm font-medium truncate">
                {data.properties?.www_root ? data.properties.www_root.split('/').pop() : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {(data.properties?.webstat || data.properties?.fastcgi || data.properties?.cgi || data.properties?.perl || data.properties?.python) && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Web Statistics
                </p>
                <Badge variant="outline" className="text-xs">
                  {data.properties?.webstat || "None"}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Additional Features
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.properties?.fastcgi && <Badge variant="secondary" className="text-xs">FastCGI</Badge>}
                  {data.properties?.cgi && <Badge variant="secondary" className="text-xs">CGI</Badge>}
                  {data.properties?.perl && <Badge variant="secondary" className="text-xs">Perl</Badge>}
                  {data.properties?.python && <Badge variant="secondary" className="text-xs">Python</Badge>}
                  {!data.properties?.fastcgi && !data.properties?.cgi && !data.properties?.perl && !data.properties?.python && (
                    <Badge variant="outline" className="text-xs">None</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Subdomain Cards List Component
interface SubdomainCardsListProps {
  data: z.infer<typeof subdomainSchema>[];
  onDelete?: (id: number | undefined) => void;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function SubdomainCardsList({ 
  data, 
  onDelete,
  cols = 1,
  className 
}: SubdomainCardsListProps) {
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
      {data.map((subdomain, index) => (
        <SubdomainCard
          key={subdomain.id || `subdomain-${index}`}
          data={subdomain}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
