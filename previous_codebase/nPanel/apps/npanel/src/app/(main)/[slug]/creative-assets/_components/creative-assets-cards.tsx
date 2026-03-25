"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";

import { creativeAssetSchema } from "./schema";
import { CreativeAssetCard } from "./creative-asset-card";

interface CreativeAssetsCardsListProps {
  data: z.infer<typeof creativeAssetSchema>[];
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  archivingAssetId?: string | null;
  unarchivingAssetId?: string | null;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function CreativeAssetsCardsList({
  data,
  onEdit,
  onArchive,
  onUnarchive,
  archivingAssetId = null,
  unarchivingAssetId = null,
  cols = 1,
  className,
}: CreativeAssetsCardsListProps) {
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
      {data.map((asset) => (
        <CreativeAssetCard
          key={asset.id}
          data={asset}
          onEdit={onEdit}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          isArchiving={archivingAssetId === asset.id}
          isUnarchiving={unarchivingAssetId === asset.id}
        />
      ))}
    </div>
  );
}

