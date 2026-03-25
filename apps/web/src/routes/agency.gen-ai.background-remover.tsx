"use client";

import { BackgroundRemoverInterface } from "./_agency.gen-ai/background-remover/_components/background-remover-interface";

export default function BackgroundRemoverPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 flex-1 min-h-0">
      <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 min-h-0">
        <div className="flex flex-col gap-2 flex-shrink-0">
          <h1 className="text-base font-semibold tracking-tight">Background remover</h1>
          <p className="text-xs text-muted-foreground">
            Remove backgrounds from images with AI. Drop an image below and get a clean cutout.
          </p>
        </div>
        <div className="mt-6 flex-1 min-h-0 flex flex-col">
          <BackgroundRemoverInterface />
        </div>
      </div>
    </div>
  );
}
