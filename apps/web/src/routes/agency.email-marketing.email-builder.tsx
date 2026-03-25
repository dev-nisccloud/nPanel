"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateEmailBuilderDesign } from "./agency.email-marketing/email-builder/_api/use-create-email-builder-design";
import { ProjectsSection } from "./agency.email-marketing/email-builder/_components/projects-section";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { RotatingText } from "@/components/rotating-text";

const DEFAULT_JSON = JSON.stringify({
  root: {
    type: "EmailLayout",
    data: {
      backdropColor: "#F5F5F5",
      canvasColor: "#FFFFFF",
      textColor: "#262626",
      fontFamily: "MODERN_SANS",
      childrenIds: [],
    },
  },
});

export default function EmailBuilderLandingPage() {
  const navigate = useNavigate();
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
          navigate(`/agency/email-marketing/email-builder/editor/${data.data.id}`);
        },
        onError: () => {
          setIsCreating(false);
        },
      },
    );
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Banner */}
        <div
          className="text-white aspect-[5/1] min-h-[248px] flex gap-x-6 p-6 items-center rounded-xl bg-gradient-to-b from-[#2625e3] to-[#0bbaef]"
          style={{
            backgroundImage:
              "linear-gradient(52deg, rgba(163, 163, 163, 0.09) 0%, rgba(163, 163, 163, 0.09) 33.3%,rgba(100, 100, 100, 0.09) 33.3%, rgba(100, 100, 100, 0.09) 66.6%,rgba(162, 162, 162, 0.09) 66.6%, rgba(162, 162, 162, 0.09) 99%),linear-gradient(258deg, rgba(193, 193, 193, 0.06) 0%, rgba(193, 193, 193, 0.06) 33.3%,rgba(169, 169, 169, 0.06) 33.3%, rgba(169, 169, 169, 0.06) 66.6%,rgba(92, 92, 92, 0.06) 66.6%, rgba(92, 92, 92, 0.06) 99%),linear-gradient(129deg, rgba(45, 45, 45, 0.03) 0%, rgba(45, 45, 45, 0.03) 33.3%,rgba(223, 223, 223, 0.03) 33.3%, rgba(223, 223, 223, 0.03) 66.6%,rgba(173, 173, 173, 0.03) 66.6%, rgba(173, 173, 173, 0.03) 99%),linear-gradient(280deg, rgba(226, 226, 226, 0.06) 0%, rgba(226, 226, 226, 0.06) 33.3%,rgba(81, 81, 81, 0.06) 33.3%, rgba(81, 81, 81, 0.06) 66.6%,rgba(186, 186, 186, 0.06) 66.6%, rgba(186, 186, 186, 0.06) 99%),linear-gradient(85deg, rgba(225, 225, 225, 0.04) 0%, rgba(225, 225, 225, 0.04) 33.3%,rgba(95, 95, 95, 0.04) 33.3%, rgba(95, 95, 95, 0.04) 66.6%,rgba(39, 39, 39, 0.04) 66.6%, rgba(39, 39, 39, 0.04) 99%),linear-gradient(128deg, rgba(184, 184, 184, 0.06) 0%, rgba(184, 184, 184, 0.06) 33.3%,rgba(0, 0, 0, 0.06) 33.3%, rgba(0, 0, 0, 0.06) 66.6%,rgba(140, 140, 140, 0.06) 66.6%, rgba(140, 140, 140, 0.06) 99.89999999999999%),linear-gradient(323deg, rgba(40, 40, 40, 0.07) 0%, rgba(40, 40, 40, 0.07) 33.3%,rgba(214, 214, 214, 0.07) 33.3%, rgba(214, 214, 214, 0.07) 66.6%,rgba(190, 190, 190, 0.07) 66.6%, rgba(190, 190, 190, 0.07) 99.89999999999999%),linear-gradient(61deg, rgba(230, 230, 230, 0) 0%, rgba(230, 230, 230, 0) 33.3%,rgba(241, 241, 241, 0) 33.3%, rgba(241, 241, 241, 0) 66.6%,rgba(55, 55, 55, 0) 66.6%, rgba(55, 55, 55, 0) 99%),linear-gradient(0deg, #2625e3,#0bbaef)",
          }}
        >
          <div className="rounded-full size-28 items-center justify-center bg-white/60 hidden md:flex shrink-0">
            <div className="rounded-full size-20 flex items-center justify-center bg-white shadow-sm">
              <img
                src="/icons/mail_builder.png"
                alt="Email builder"
                width={64}
                height={64}
                className="h-12 w-12"
              />
            </div>
          </div>
          <div className="flex flex-col gap-y-3">
            <h1 className="text-xl md:text-4xl font-extrabold tracking-tight">
              AI-crafted emails that{" "}
              <RotatingText
                texts={[
                  "get opened and clicked",
                  "look perfectly on-brand",
                  "drive real revenue",
                  "ship in minutes, not days",
                ]}
                className="ml-2 inline-block text-yellow-100"
              />
            </h1>
            <p className="text-xs md:text-sm mb-4 max-w-lg">
              Design, personalise, and reuse beautiful email campaigns with an AI-powered builder,
              smart image tools, and your own asset library—built right into npanel.
            </p>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              variant="secondary"
              className="w-[180px] font-semibold"
            >
              {isCreating ? (
                <>
                  Creating...
                  <Spinner size={16} className="ml-2" />
                </>
              ) : (
                <>
                  Create email design
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
