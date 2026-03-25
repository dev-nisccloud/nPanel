"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

import { wordpressInstallationSchema } from "./schema";

interface WordPressCardProps {
  data: z.infer<typeof wordpressInstallationSchema>;
  onEdit?: (id: number | undefined) => void;
  onDelete?: (id: number | undefined) => void;
  onCopy?: (data: z.infer<typeof wordpressInstallationSchema>) => void;
  onSettings?: (id: number | undefined) => void;
  className?: string;
}

export function WordPressCard({
  data,
  onEdit,
  onDelete,
  onCopy,
  onSettings,
  className,
}: WordPressCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    if (data.id) {
      router.push(`/agency/wordpress/${data.id}`);
    }
  };

  const getStatusBadge = () => {
    const isActive = data.status?.alive && !data.status?.infected && !data.status?.unsupported;
    if (isActive) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800">
        Suspended
      </Badge>
    );
  };

  const getWordPressVersion = () => {
    return data.version || "Unknown";
  };

  const getDomainName = () => {
    return data.domain?.name || "Unknown Domain";
  };

  const getSslStatus = () => {
    return data.domain?.ssl?.enabled || false;
  };

  return (
    <Card
      className={cn("group cursor-pointer transition-all hover:shadow-md hover:border-primary/50 h-full flex flex-col", className)}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold line-clamp-2 flex-1">
            {data.displayTitle || data.title || "Unknown Installation"}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Domain
            </p>
            <p className="text-sm font-semibold line-clamp-1">{getDomainName()}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              WordPress Version
            </p>
            <Badge
              variant={data.version ? "default" : "secondary"}
              className="text-xs w-fit"
            >
              {getWordPressVersion()}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              SSL Security
            </p>
            <Badge
              variant="outline"
              className={cn(
                "text-xs w-fit",
                getSslStatus()
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800"
              )}
            >
              {getSslStatus() ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          {(data.features?.updates?.amountOfPluginsWithUpdates || data.features?.updates?.amountOfThemesWithUpdates) && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Updates Available
              </p>
              <p className="text-sm font-semibold">
                {(data.features?.updates?.amountOfPluginsWithUpdates || 0) + (data.features?.updates?.amountOfThemesWithUpdates || 0)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface WordPressCardsListProps {
  data: z.infer<typeof wordpressInstallationSchema>[];
  onEdit?: (id: number | undefined) => void;
  onDelete?: (id: number | undefined) => void;
  onCopy?: (data: z.infer<typeof wordpressInstallationSchema>) => void;
  onSettings?: (id: number | undefined) => void;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function WordPressCardsList({
  data,
  onEdit,
  onDelete,
  onCopy,
  onSettings,
  cols = 3,
  className,
  ...props
}: WordPressCardsListProps) {
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
      {...props}
    >
      {data.map((item) => (
        <WordPressCard
          key={item.id || `${item.displayTitle}-${item.url}`}
          data={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onCopy={onCopy}
          onSettings={onSettings}
        />
      ))}
    </div>
  );
}
