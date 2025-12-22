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
import { MoreHorizontal, Edit, Trash2, Copy } from "lucide-react";
import { dnsRecordSchema } from "./dns-schema";

interface DnsCardProps {
  data: z.infer<typeof dnsRecordSchema>;
  onEdit?: (id: number | undefined) => void;
  onDelete?: (id: number | undefined) => void;
  onCopy?: (data: z.infer<typeof dnsRecordSchema>) => void;
  className?: string;
}

export function DnsCard({ 
  data, 
  onEdit, 
  onDelete, 
  onCopy,
  className 
}: DnsCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(data.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(data.id);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopy) {
      onCopy(data);
    }
  };

  const getTypeBadgeVariant = (type: string | undefined) => {
    switch (type?.toUpperCase()) {
      case "A":
        return "default";
      case "AAAA":
        return "secondary";
      case "CNAME":
        return "outline";
      case "MX":
        return "destructive";
      case "TXT":
        return "secondary";
      case "NS":
        return "outline";
      default:
        return "outline";
    }
  };

  const handleCardClick = () => {
    // Only open edit drawer if onEdit is provided
    if (onEdit) {
      onEdit(data.id);
    }
  };

  return (
    <Card 
      className={cn("group cursor-pointer transition-all hover:shadow-md", className)}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-bold truncate">
            {data.host === "@" ? "@" : data.host || "Unknown Host"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getTypeBadgeVariant(data.type)}>
              {data.type || "Unknown"}
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
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Record
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Record
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
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Type
            </p>
            <Badge variant={getTypeBadgeVariant(data.type)} className="text-xs">
              {data.type || "Unknown"}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              TTL
            </p>
            <p className="text-sm font-medium">
              {typeof data.opt === 'number' ? data.opt : (data.opt || "3600")}s
            </p>
          </div>
          
          <div className="space-y-1 col-span-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Value
            </p>
            <p className="text-sm font-medium font-mono break-all">
              {data.value || "No value"}
            </p>
          </div>
        </div>

        {data.status && (
          <div className="mt-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </p>
              <Badge variant={data.status === "ok" ? "default" : "destructive"}>
                {data.status}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// DNS Cards List Component
interface DnsCardsListProps {
  data: z.infer<typeof dnsRecordSchema>[];
  onEdit?: (id: number | undefined) => void;
  onDelete?: (id: number | undefined) => void;
  onCopy?: (data: z.infer<typeof dnsRecordSchema>) => void;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function DnsCardsList({ 
  data, 
  onEdit, 
  onDelete, 
  onCopy,
  cols = 1,
  className 
}: DnsCardsListProps) {
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
      {data.map((record, index) => (
        <DnsCard
          key={record.id || `dns-${index}`}
          data={record}
          onEdit={onEdit}
          onDelete={onDelete}
          onCopy={onCopy}
        />
      ))}
    </div>
  );
}
