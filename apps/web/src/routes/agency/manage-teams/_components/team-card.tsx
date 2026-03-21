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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MoreHorizontal, Edit, Trash2, Building2, Users, Calendar, Globe } from "lucide-react";
import { teamSchema } from "./schema";
import { useUserLookup } from "@/hooks/use-user-lookup";

interface TeamCardProps {
  data: z.infer<typeof teamSchema>;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function TeamCard({
  data,
  onView,
  onEdit,
  onDelete,
  className,
}: TeamCardProps) {
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);
  const creatorQuery = useUserLookup(data.createdById);

  const handleCardClick = () => {
    if (onView) {
      onView(data.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsActionMenuOpen(false);
    if (onEdit) {
      setTimeout(() => onEdit(data.id), 0);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsActionMenuOpen(false);
    if (onDelete) {
      setTimeout(() => onDelete(data.id), 0);
    }
  };

  return (
    <Card
      className={cn("group cursor-pointer transition-all hover:shadow-md", className)}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={data.isActive ? "default" : "secondary"}>
              {data.isActive ? "Active" : "Inactive"}
            </Badge>
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
                  handleEdit(e as any);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleDelete(e as any);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Team Name */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Team Name
          </p>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium line-clamp-2">{data.name}</p>
          </div>
        </div>

        {/* Slug */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Slug
          </p>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-mono">{data.slug}</p>
          </div>
        </div>

        {/* Currency */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Currency
          </p>
          <Badge variant="outline" className="text-xs">
            {data.baseCurrency}
          </Badge>
        </div>

        {/* Member Count */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Members
          </p>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">{data.memberCount} member{data.memberCount !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Created By */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Created By
          </p>
          <p className="text-sm font-medium">
            {(() => {
              if (creatorQuery.isLoading) return "Loading...";
              if (creatorQuery.isError) {
                // Log error for debugging
                console.warn("Failed to load creator:", creatorQuery.error);
                return "Error loading";
              }
              if (!creatorQuery.data) return "Loading...";
              // Check both name and email, handle null/undefined/empty string
              const name = creatorQuery.data.name;
              const email = creatorQuery.data.email;
              if (name && typeof name === "string" && name.trim()) return name;
              if (email && typeof email === "string" && email.trim()) return email;
              // If we have data but no name/email, log it
              console.warn("Creator data exists but no name/email:", creatorQuery.data);
              return "Unknown";
            })()}
          </p>
        </div>

        {/* Created At */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Created On
          </p>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">
              {new Date(data.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TeamCardsListProps {
  data: z.infer<typeof teamSchema>[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function TeamCardsList({
  data,
  onView,
  onEdit,
  onDelete,
  cols = 1,
  className,
}: TeamCardsListProps) {
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
      {data.map((team) => (
        <TeamCard
          key={team.id}
          data={team}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

