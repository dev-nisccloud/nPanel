import { getIncomers, useReactFlow } from "@xyflow/react";
import {
  ClockIcon,
  DownloadIcon,
  PlayIcon,
  RotateCcwIcon,
} from "lucide-react";

import {
  type ChangeEventHandler,
  type ComponentProps,
  useCallback,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { NodeLayout } from "@/routes/_agency.zeepo-canvas/_components/nodes/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { useZeepoGeneration } from "@/routes/_agency.zeepo-canvas/_hooks/use-zeepo-generation";

import { download } from "@/routes/_agency.zeepo-canvas/_lib/download";
import { handleError } from "@/routes/_agency.zeepo-canvas/_lib/error/handle";
import { getImagesFromImageNodes, getTextFromTextNodes } from "@/routes/_agency.zeepo-canvas/_lib/xyflow";
import { useGateway } from "@/routes/_agency.zeepo-canvas/_providers/models";
import { ModelSelector } from "../model-selector";
import type { ImageNodeProps } from ".";

type ImageTransformProps = ImageNodeProps & {
  title: string;
};

const getDefaultModel = (
  models: Record<string, { default?: boolean }>
): string => {
  const defaultModel = Object.entries(models).find(
    ([_, model]) => model.default
  );

  if (defaultModel) {
    return defaultModel[0];
  }

  const firstModel = Object.keys(models)[0];

  if (!firstModel) {
    throw new Error("No image models available");
  }

  return firstModel;
};

export const ImageTransform = ({
  data,
  id,
  type,
  title,
}: ImageTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const { imageModels } = useGateway();
  const modelId = data.model ?? getDefaultModel(imageModels);

  
  const { generate, isGenerating } = useZeepoGeneration({
    nodeId: id,
    category: "image",
    onSuccess: (outputUrl) => {
      updateNodeData(id, {
        updatedAt: new Date().toISOString(),
        generated: {
          url: outputUrl,
          type: "image/png", // We assume png for display, or try to infer from url
        },
        description: data.instructions || "Generated image",
      });
      toast.success("Image generated successfully");
    },
    onError: (error) => {
      handleError("Error generating image", error);
    }
  });

  const loading = isGenerating;

  const handleGenerate = useCallback(async () => {
    if (loading) {
      return;
    }

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    const textNodes = getTextFromTextNodes(incomers);
    const imageNodes = getImagesFromImageNodes(incomers);

    if (!(textNodes.length || imageNodes.length)) {
      toast.error("No input provided (text prompt or image required)");
      return;
    }

    const inputs: any = {
      instructions: data.instructions,
    };
    
    // If there's an image input (for image-to-image or editing)
    if (imageNodes.length) {
      inputs.image = imageNodes[0]; // Take the first image as base
    }

    await generate(modelId, [data.instructions ?? "", ...textNodes].join("\n"), inputs);
  }, [
    loading,
    id,

    type,
    data.instructions,
    getEdges,
    modelId,
    getNodes,
    generate,
  ]);

  const handleInstructionsChange: ChangeEventHandler<HTMLTextAreaElement> = (
    event
  ) => updateNodeData(id, { instructions: event.target.value });

  const toolbar = useMemo<ComponentProps<typeof NodeLayout>["toolbar"]>(() => {
    const availableModels = Object.fromEntries(
      Object.entries(imageModels).map(([key, model]) => [
        key,
        {
          ...model,
          disabled: model.disabled,
        },
      ])
    );

    const items: ComponentProps<typeof NodeLayout>["toolbar"] = [
      {
        children: (
          <ModelSelector
            className="w-[200px] rounded-full"
            id={id}
            onChange={(value) => updateNodeData(id, { model: value })}
            options={availableModels}
            value={modelId}
          />
        ),
      },
    ];

    items.push(
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
          }
    );

    if (data.generated) {
      items.push({
        tooltip: "Download",
        children: (
          <Button
            className="rounded-full"
            onClick={() => download(data.generated, id, "png")}
            size="icon"
            variant="ghost"
          >
            <DownloadIcon size={12} />
          </Button>
        ),
      });
    }

    if (data.updatedAt) {
      items.push({
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

    return items;
  }, [
    modelId,
    imageModels,
    id,
    updateNodeData,
    loading,
    data.generated,
    data.updatedAt,
    handleGenerate,
  ]);

  return (
    <NodeLayout data={data} id={id} title={title} toolbar={toolbar} type={type}>
      {loading ? (
        <Skeleton
          className="flex w-full animate-pulse items-center justify-center rounded-b-xl"
          style={{ aspectRatio: "1/1" }}
        >
          <Spinner className="text-muted-foreground" size={16} variant="bars" />
        </Skeleton>
      ) : null}
      {!(loading || data.generated?.url) && (
        <div
          className="flex w-full items-center justify-center rounded-b-xl bg-secondary p-4"
          style={{ aspectRatio: "1/1" }}
        >
          <p className="text-muted-foreground text-sm">
            Press <PlayIcon className="inline -translate-y-px" size={12} /> to
            create an image
          </p>
        </div>
      )}
      {!loading && data.generated?.url && (
        <img
          alt="Generated image"
          className="w-full rounded-b-xl object-cover"
          height={1000}
          src={data.generated.url}
          width={1000}
        />
      )}
      <div className="flex flex-col border-t bg-muted/30 p-3">
        <label className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Prompt / Instructions
        </label>
        <Textarea
          className="min-h-[80px] shrink-0 resize-none rounded-md border bg-background! px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
          onChange={handleInstructionsChange}
          placeholder="Describe the image you want to create..."
          value={data.instructions ?? ""}
        />
      </div>
    </NodeLayout>
  );
};
