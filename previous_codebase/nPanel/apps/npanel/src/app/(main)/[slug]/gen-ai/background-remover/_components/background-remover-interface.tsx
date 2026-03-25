"use client";

import * as React from "react";
import { BackgroundRemoverResultsView } from "./background-remover-results-view";
import { FloatingInputBar } from "./floating-input-bar";
import { useGetBackgroundRemovals } from "../_api/use-get-background-removals";

export type BackgroundRemovalView = {
  id: string;
  createdAt: Date;
  status: string;
  errorMessage: string | null;
  originalImageUrl: string;
  originalImageMimeType: string;
  processedImageUrl: string | null;
  processedImageMimeType: string | null;
};

function apiDataToView(
  data: { data?: Array<Record<string, unknown>> } | undefined,
): BackgroundRemovalView[] {
  const raw = data?.data;
  if (!Array.isArray(raw)) return [];
  return raw.map((g) => ({
    id: String(g?.id ?? ""),
    createdAt: g?.createdAt instanceof Date ? g.createdAt : new Date(String(g?.createdAt ?? Date.now())),
    status: String(g?.status ?? "QUEUED"),
    errorMessage: g?.errorMessage != null ? String(g.errorMessage) : null,
    originalImageUrl: String(g?.originalImageUrl ?? ""),
    originalImageMimeType: String(g?.originalImageMimeType ?? "image/png"),
    processedImageUrl: g?.processedImageUrl != null && g.processedImageUrl ? String(g.processedImageUrl) : null,
    processedImageMimeType: g?.processedImageMimeType != null ? String(g.processedImageMimeType) : null,
  }));
}

interface BackgroundRemoverInterfaceProps {
  teamId?: string;
  creditsValue?: number | null;
}

export function BackgroundRemoverInterface({ teamId, creditsValue }: BackgroundRemoverInterfaceProps) {
  const { data: generationsData, isLoading: isLoadingHistory } = useGetBackgroundRemovals({
    page: 1,
    limit: 50,
    teamId,
  });

  const generations = React.useMemo(
    () => apiDataToView(generationsData),
    [generationsData],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="w-full">
          <BackgroundRemoverResultsView
            generations={generations}
            isLoadingHistory={isLoadingHistory}
          />
        </div>
      </div>
      <div className="h-[72px] shrink-0" aria-hidden />
      <FloatingInputBar teamId={teamId} creditsValue={creditsValue} />
    </div>
  );
}
