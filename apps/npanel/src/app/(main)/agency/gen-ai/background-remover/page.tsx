"use client";

import * as React from "react";
import { Scissors } from "lucide-react";
import { BackgroundRemoverInterface } from "./_components/background-remover-interface";

export default function BackgroundRemoverPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 h-[calc(100vh-4rem)]">
      <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex flex-col items-center justify-center py-8 px-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-lg border-2 border-primary flex items-center justify-center">
                <Scissors className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Background Remover</h1>
          </div>
          <p className="text-muted-foreground text-center max-w-md text-sm">
            Remove backgrounds from your images instantly with AI-powered precision.
          </p>
        </div>

        {/* Main Content Area */}
        <div className="mt-6 flex-1 min-h-0">
          <BackgroundRemoverInterface />
        </div>
      </div>
    </div>
  );
}

