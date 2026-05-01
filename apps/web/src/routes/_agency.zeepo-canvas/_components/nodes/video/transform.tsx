import { getIncomers, useReactFlow } from "@xyflow/react";
import {
  ClockIcon,
  DownloadIcon,
  PlayIcon,
  RotateCcwIcon,
} from "lucide-react";
import { type ChangeEventHandler, type ComponentProps, useState } from "react";
import { toast } from "sonner";
import { NodeLayout } from "@/routes/_agency.zeepo-canvas/_components/nodes/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useZeepoGeneration } from "@/routes/_agency.zeepo-canvas/_hooks/use-zeepo-generation";

import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { download } from "@/routes/_agency.zeepo-canvas/_lib/download";
import { handleError } from "@/routes/_agency.zeepo-canvas/_lib/error/handle";
import { getImagesFromImageNodes, getTextFromTextNodes } from "@/routes/_agency.zeepo-canvas/_lib/xyflow";
import { useGateway } from "@/routes/_agency.zeepo-canvas/_providers/models";
import { ModelSelector } from "../model-selector";
import type { VideoNodeProps } from ".";

type VideoTransformProps = VideoNodeProps & {
  title: string;
};

const getDefaultModel = (models: Record<string, { default?: boolean }>) => {
  const defaultModel = Object.entries(models).find(
    ([_, model]) => model.default
  );

  if (defaultModel) {
    return defaultModel[0];
  }

  const firstModel = Object.keys(models)[0];

  if (!firstModel) {
    throw new Error("No video models available");
  }

  return firstModel;
};

export const VideoTransform = ({
  data,
  id,
  type,
  title,
}: VideoTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const { videoModels } = useGateway();
  const modelId = data.model ?? getDefaultModel(videoModels);


  const { generate, isGenerating } = useZeepoGeneration({
    nodeId: id,
    category: "video",
    onSuccess: (outputUrl) => {
      updateNodeData(id, {
        updatedAt: new Date().toISOString(),
        generated: {
          url: outputUrl,
          type: "video/mp4", 
        },
      });
      toast.success("Video generated successfully");
    },
    onError: (error) => {
      handleError("Error generating video", error);
    }
  });

  const loading = isGenerating;

  const handleGenerate = async () => {
    if (loading) {
      return;
    }

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    const textPrompts = getTextFromTextNodes(incomers);
    const images = getImagesFromImageNodes(incomers);

    if (!(textPrompts.length || images.length)) {
      toast.error("No prompts found");
      return;
    }

    const inputs: any = {};
    if (images.length) {
      inputs.image = images[0].url; // Usually replicate expects 'image_url' or 'image'
    }

    await generate(modelId, [data.instructions ?? "", ...textPrompts].join("\n"), inputs);
  };

  const toolbar: ComponentProps<typeof NodeLayout>["toolbar"] = [
    {
      children: (
        <ModelSelector
          className="w-[200px] rounded-full"
          key={id}
          onChange={(value) => updateNodeData(id, { model: value })}
          options={videoModels}
          value={modelId}
        />
      ),
    },
    loading
      ? {
          tooltip: "Generating...",
          children: (
            <Button className="rounded-full" disabled size="icon">
              <Spinner className="text-primary-foreground" size={12} variant="bars" />
            </Button>
          ),
        }
      : {
          tooltip: data.generated?.url ? "Regenerate" : "Generate",
          children: (
            <Button
              className="rounded-full"
              disabled={loading}
              onClick={handleGenerate}
              size="icon"
            >
              {data.generated?.url ? (
                <RotateCcwIcon size={12} />
              ) : (
                <PlayIcon size={12} />
              )}
            </Button>
          ),
        },
  ];

  if (data.generated?.url) {
    toolbar.push({
      tooltip: "Download",
      children: (
        <Button
          className="rounded-full"
          onClick={() => download(data.generated, id, "mp4")}
          size="icon"
          variant="ghost"
        >
          <DownloadIcon size={12} />
        </Button>
      ),
    });
  }

  if (data.updatedAt) {
    toolbar.push({
      tooltip: `Last updated: ${new Intl.DateTimeFormat("en-US", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(data.updatedAt))}`,
      children: (
        <Button className="rounded-full" size="icon" variant="ghost">
          <ClockIcon size={12} />
        </Button>
      ),
    });
  }

  const handleInstructionsChange: ChangeEventHandler<HTMLTextAreaElement> = (
    event
  ) => updateNodeData(id, { instructions: event.target.value });

  return (
    <NodeLayout data={data} id={id} title={title} toolbar={toolbar} type={type}>
      {loading ? (
        <Skeleton className="flex aspect-video w-full animate-pulse items-center justify-center rounded-b-xl">
          <Spinner className="text-muted-foreground" size={16} variant="bars" />
        </Skeleton>
      ) : null}
      {!(loading || data.generated?.url) && (
        <div className="flex aspect-video w-full items-center justify-center rounded-b-xl bg-secondary">
          <p className="text-muted-foreground text-sm">
            Press <PlayIcon className="inline -translate-y-px" size={12} /> to
            generate video
          </p>
        </div>
      )}
      {typeof data.generated?.url === "string" && !loading ? (
        <video
          autoPlay
          className="w-full rounded-b-xl object-cover"
          height={data.height ?? 450}
          loop
          muted
          playsInline
          src={data.generated.url}
          width={data.width ?? 800}
        />
      ) : null}
      <div className="flex flex-col border-t bg-muted/30 p-3">
        <label className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Prompt / Instructions
        </label>
        <Textarea
          className="min-h-[80px] shrink-0 resize-none rounded-md border bg-background! px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
          onChange={handleInstructionsChange}
          placeholder="Describe the video you want to generate..."
          value={data.instructions ?? ""}
        />
      </div>
    </NodeLayout>
  );
};
