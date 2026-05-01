import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { trpc } from "@/utils/trpc";
import { useReactFlow } from "@xyflow/react";
import { toast } from "sonner";

interface UseZeepoGenerationOptions {
  nodeId: string;
  category: "text" | "image" | "video" | "audio" | "background-remover";
  onSuccess: (outputUrlOrText: string) => void;
  onError: (error: string) => void;
}

export const useZeepoGeneration = ({ nodeId, category, onSuccess, onError }: UseZeepoGenerationOptions) => {
  const { canvasId } = useParams<{ canvasId: string }>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(null);

  const startMutation = trpc.zeepoCanvas.generate.start.useMutation();

  const { data: generationStatus, stop } = trpc.zeepoCanvas.generate.getGeneration.useQuery(
    { generationId: activeGenerationId! },
    {
      enabled: !!activeGenerationId && isGenerating,
      refetchInterval: (query) => {
        const status = query.state.data?.data?.status;
        if (status === "COMPLETED" || status === "FAILED") {
          return false;
        }
        return 2000;
      },
    }
  );

  useEffect(() => {
    if (isGenerating && generationStatus?.data) {
      const { status, outputs, errorMessage } = generationStatus.data;
      if (status === "COMPLETED") {
        setIsGenerating(false);
        setActiveGenerationId(null);
        // Extract the actual output. Replicate might return an array of URLs or a string.
        let parsedOutput = "";
        if (Array.isArray(outputs)) {
          parsedOutput = outputs.join("");
        } else if (typeof outputs === "string") {
          parsedOutput = outputs;
        } else if (typeof outputs === "object" && outputs !== null) {
          // If it's an object (like Whisper's {text: "..."}), extract the text field
          parsedOutput = (outputs as any).text || JSON.stringify(outputs);
        } else if (outputs) {
          parsedOutput = String(outputs);
        }
        onSuccess(parsedOutput);
      } else if (status === "FAILED") {
        setIsGenerating(false);
        setActiveGenerationId(null);
        onError(errorMessage || "Generation failed");
      }
    }
  }, [generationStatus?.data, isGenerating, onSuccess, onError]);

  const generate = async (modelId: string, prompt?: string, inputs?: any) => {
    if (!canvasId) {
      toast.error("Canvas ID is missing");
      return;
    }
    
    setIsGenerating(true);
    try {
      const res = await startMutation.mutateAsync({
        projectId: canvasId,
        nodeId,
        modelCategory: category,
        modelId,
        prompt,
        inputs,
      });
      setActiveGenerationId(res.generationId);
    } catch (e: any) {
      setIsGenerating(false);
      onError(e.message || "Failed to start generation");
    }
  };

  return { generate, isGenerating };
};
