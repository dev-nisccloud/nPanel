"use client";

import * as React from "react";
import { GeneratedImagesView } from "./generated-images-view";
import { FloatingInputBar } from "./floating-input-bar";
import { useGetGenerations } from "../_api/use-get-generations";
import { apiGenerationsToView } from "../_types";

export function ImageGeneratorInterface() {
  const { data: generationsData, isLoading: isLoadingHistory } = useGetGenerations({
    page: 1,
    limit: 50,
  });

  const generations = React.useMemo(
    () => apiGenerationsToView(generationsData ?? undefined),
    [generationsData],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="w-full">
          <GeneratedImagesView
            generations={generations}
            isLoadingHistory={isLoadingHistory}
          />
        </div>
      </div>
      <div className="h-[152px] shrink-0" aria-hidden />
      <FloatingInputBar />
    </div>
  );
}
