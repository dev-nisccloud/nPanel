"use client";

import { Link } from "react-router";
import { useEffect } from "react";
import { ImageGeneratorInterface } from "./_agency.gen-ai/image-generator/_components/image-generator-interface";
import { captureEvent } from "@/lib/posthog";

export default function ImageGeneratorPage() {
  useEffect(() => {
    captureEvent("simple_image_generator_used", { user_type: "agency" });
  }, []);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 flex-1 min-h-0">
      <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 min-h-0">
        <div className="flex flex-col gap-2 flex-shrink-0">
          <h1 className="text-base font-semibold tracking-tight">Image generator</h1>
          <p className="text-xs text-muted-foreground">
            Effortlessly create anything from quick AI-generated images to striking posters right from your text prompt. For advanced creative control and fine-tuned design features, try{" "}
            <Link to="/agency/gen-ai/image-gen-studio" className="text-primary underline hover:no-underline">
              Visual Studio
            </Link>
            .
          </p>
        </div>
        <div className="mt-6 flex-1 min-h-0 flex flex-col">
          <ImageGeneratorInterface />
        </div>
      </div>
    </div>
  );
}
