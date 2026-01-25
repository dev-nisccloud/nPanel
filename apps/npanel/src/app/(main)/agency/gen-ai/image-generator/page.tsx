"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { ImageGeneratorInterface } from "./_components/image-generator-interface";
import { Button } from "@/components/ui/button";

export default function ImageGeneratorPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 h-[calc(100vh-4rem)]">
      <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex flex-col items-center justify-center py-8 px-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-lg border-2 border-primary flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Image generator</h1>
          </div>
          <div className="text-muted-foreground text-center max-w-2xl text-sm space-y-2">
            <p>
              Let's create! Powered by the leading AI models, your creative imagination has no limits.
            </p>
            <p>
              For detailed AI generations like designs and posters, use the{" "}
              <Button
                asChild
                variant="link"
                className="h-auto p-0 text-primary underline"
              >
                <Link href="/agency/gen-ai/image-gen-studio">Visual Studio</Link>
              </Button>{" "}
              feature.
            </p>
          </div>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="mt-6 flex-1 overflow-y-auto min-h-0">
          <ImageGeneratorInterface />
        </div>
      </div>
    </div>
  );
}
