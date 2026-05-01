"use client";

import { useNavigate } from "react-router";
import { ArrowRight, Loader2 } from "lucide-react";

import { useCreateProject } from "../_api/use-create-project";

import { Button } from "@/components/ui/button";
import { RotatingText } from "@/components/rotating-text";
import { useState } from "react";
import ColorBends from "../../_agency.gen-ai/image-gen-studio/_dashboard/ColorBends"; // Reuse the same cool animation

export const Banner = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const mutation = useCreateProject();

  const onClick = () => {
    setLoading(true);
    mutation.mutate(
      {
        name: "Untitled Canvas",
        canvasJson: { nodes: [], edges: [] },
        width: 1200,
        height: 800,
        teamId: undefined, // Agency users don't use teamId in this context
      },
      {
        onSuccess: (data) => {
          navigate(`/agency/zeepo-canvas/editor/${data.data.id}`);
        },
        onSettled: () => {
          setLoading(false);
        }
      }
    );
  };

  return (
    <div className="relative aspect-[5/1] min-h-[248px] overflow-hidden rounded-xl text-white bg-gradient-to-b from-[#8a5cff] to-[#00ffd1]">
      <div className="absolute inset-0">
        <ColorBends
          colors={["#2625e3", "#ff5c7a", "#0bbaef"]}
          rotation={0}
          speed={0.2}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          parallax={0.5}
          noise={0.1}
          transparent
          autoRotate={0}
        />
      </div>
      {/* Primary-tinted overlay for better text contrast */}
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-r from-primary/55 via-primary/30 to-transparent"
        aria-hidden
      />
      <div className="relative z-10 flex h-full items-center gap-x-6 p-6">
        <div className="hidden md:flex size-28 shrink-0 items-center justify-center rounded-full bg-white/50 backdrop-blur-sm">
          <div className="flex size-20 items-center justify-center rounded-full bg-white shadow-sm">
            {/* You can change this icon to something more canvas-like if preferred */}
            <img
              src="/icons/visual_studio.png"
              alt="Zeepo Canvas"
              width={64}
              height={64}
              className="h-12 w-12"
            />
          </div>
        </div>
        <div className="flex flex-col gap-y-2">
          <h1 className="text-xl font-extrabold tracking-tight drop-shadow-md md:text-4xl [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
            AI Workflows that{" "}
            <RotatingText
              texts={[
                "connect seamlessly",
                "flow at your fingertips",
                "feel like magic",
                "empower your vision",
                "build complex apps",
              ]}
              className="ml-1 inline-block text-yellow-100"
            />
          </h1>
          <p className="mb-2 max-w-lg text-xs md:text-sm [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
            Design multi-step AI pipelines. Connect Text, Image, Video, and Audio nodes visually to create complex workflows in minutes.
          </p>
          <Button
            type="button"
            disabled={mutation.isPending}
            onClick={onClick}
            variant="secondary"
            className="w-[160px]"
          >
            Start creating
            {loading ? (
              <Loader2 className="size-4 ml-2 animate-spin" />
            ) : (
              <ArrowRight className="size-4 ml-2" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
