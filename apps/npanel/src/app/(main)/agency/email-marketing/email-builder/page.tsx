"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateEmailBuilderDesign } from "./_api/use-create-email-builder-design";
import { ProjectsSection } from "./_components/projects-section";
import { Spinner } from "@/components/npanel-ui/spinner";

const DEFAULT_JSON = JSON.stringify({
  root: {
    type: "EmailLayout",
    data: {
      backdropColor: "#F5F5F5",
      canvasColor: "#FFFFFF",
      textColor: "#262626",
      fontFamily: "MODERN_SANS",
      childrenIds: []
    }
  }
});

export default function EmailBuilderLandingPage() {
  const router = useRouter();
  const createMutation = useCreateEmailBuilderDesign();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    setIsCreating(true);
    createMutation.mutate(
      {
        name: "Untitled Email",
        json: DEFAULT_JSON,
      },
      {
        onSuccess: (data) => {
          router.push(`/agency/email-marketing/email-builder/editor/${data.data.id}`);
        },
        onError: () => {
          setIsCreating(false);
        }
      }
    );
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Banner */}
        <div className="text-white aspect-[5/1] min-h-[248px] flex gap-x-6 p-6 items-center rounded-xl bg-gradient-to-r from-[#2e62cb] via-[#0073ff] to-[#3faff5]">
          <div className="rounded-full size-28 items-center justify-center bg-white/50 hidden md:flex shrink-0">
            <div className="rounded-full size-20 flex items-center justify-center bg-white">
              <Sparkles className="h-10 w-10 text-[#0073ff] fill-[#0073ff]" />
            </div>
          </div>
          <div className="flex flex-col gap-y-2">
            <h1 className="text-xl md:text-3xl font-semibold">
              Design Beautiful Emails
            </h1>
            <p className="text-xs md:text-sm mb-4 max-w-lg">
              Create responsive, professional email templates with our drag-and-drop builder.
              No coding required.
            </p>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              variant="secondary"
              className="w-[160px]"
            >
              {isCreating ? (
                <>
                  Creating...
                  <Spinner size={16} className="ml-2" />
                </>
              ) : (
                <>
                  Create Email
                  <ArrowRight className="size-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Existing Projects List */}
        <ProjectsSection />
      </div>
    </div>
  );
}
