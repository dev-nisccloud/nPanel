import { getIncomers, useReactFlow } from "@xyflow/react";
import {
  DownloadIcon,
  PlayIcon,
  RotateCcwIcon,
  SparklesIcon,
} from "lucide-react";
import {
  type ComponentProps,
  useCallback,
  useMemo,
} from "react";
import { toast } from "sonner";
import { NodeLayout } from "@/routes/_agency.zeepo-canvas/_components/nodes/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { useZeepoGeneration } from "@/routes/_agency.zeepo-canvas/_hooks/use-zeepo-generation";
import { download } from "@/routes/_agency.zeepo-canvas/_lib/download";
import { handleError } from "@/routes/_agency.zeepo-canvas/_lib/error/handle";
import { getImagesFromImageNodes } from "@/routes/_agency.zeepo-canvas/_lib/xyflow";
import { useGateway } from "@/routes/_agency.zeepo-canvas/_providers/models";
import { ModelSelector } from "../model-selector";
import type { BackgroundRemoverNodeProps } from ".";

type BackgroundRemoverTransformProps = BackgroundRemoverNodeProps & {
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
    return "lucataco/remove-bg"; // Fallback
  }

  return firstModel;
};

export const BackgroundRemoverTransform = ({
  data,
  id,
  type,
  title,
}: BackgroundRemoverTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const { backgroundRemoverModels } = useGateway();
  const modelId = data.model ?? getDefaultModel(backgroundRemoverModels);

  const { generate, isGenerating } = useZeepoGeneration({
    nodeId: id,
    category: "background-remover",
    onSuccess: (outputUrl) => {
      updateNodeData(id, {
        updatedAt: new Date().toISOString(),
        generated: {
          url: outputUrl,
          type: "image/png",
        },
      });
      toast.success("Background removed successfully");
    },
    onError: (error) => {
      handleError("Error removing background", error);
    }
  });

  const loading = isGenerating;

  const handleGenerate = useCallback(async () => {
    if (loading) {
      return;
    }

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    
    // Strictly only allow 'image' nodes as input as per user request
    const imageIncomers = incomers.filter(node => node.type === "image");
    const images = getImagesFromImageNodes(imageIncomers);

    if (images.length === 0) {
      toast.error("Background Remover requires a connection from an Image node");
      return;
    }

    const inputs: any = {
      image: images[0].url,
    };

    await generate(modelId, "Remove background", inputs);
  }, [
    loading,
    id,
    modelId,
    getEdges,
    getNodes,
    generate,
  ]);

  const toolbar = useMemo<ComponentProps<typeof NodeLayout>["toolbar"]>(() => {
    const items: ComponentProps<typeof NodeLayout>["toolbar"] = [
      {
        children: (
          <ModelSelector
            className="w-[200px] rounded-full"
            onChange={(value) => updateNodeData(id, { model: value })}
            options={backgroundRemoverModels}
            value={modelId}
          />
        ),
      },
    ];

    items.push(
      loading
        ? {
            tooltip: "Processing...",
            children: (
              <Button className="rounded-full" disabled size="icon">
                <Spinner className="text-primary-foreground" size={12} variant="bars" />
              </Button>
            ),
          }
        : {
            tooltip: data.generated?.url ? "Reprocess" : "Remove Background",
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

    return items;
  }, [
    modelId,
    backgroundRemoverModels,
    id,
    updateNodeData,
    loading,
    data.generated,
    handleGenerate,
  ]);

  return (
    <NodeLayout data={data} id={id} title={title} toolbar={toolbar} type={type}>
      <div className="relative overflow-hidden rounded-b-xl bg-secondary" style={{ aspectRatio: "1/1" }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center animate-pulse bg-muted/50">
            <Spinner className="text-muted-foreground" size={24} variant="bars" />
          </div>
        ) : null}
        
        {!(loading || data.generated?.url) && (
          <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="rounded-full bg-muted p-4">
              <SparklesIcon className="text-muted-foreground opacity-50" size={32} />
            </div>
            <p className="max-w-[200px] text-xs text-muted-foreground">
              Connect an <span className="font-bold">Image node</span> and press Play to remove its background
            </p>
          </div>
        )}
        
        {!loading && data.generated?.url && (
          <img
            alt="Background removed"
            className="size-full object-cover"
            src={data.generated.url}
          />
        )}
      </div>
    </NodeLayout>
  );
};
