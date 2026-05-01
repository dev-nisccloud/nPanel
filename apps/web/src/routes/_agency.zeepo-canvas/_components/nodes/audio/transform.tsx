import { getIncomers, useReactFlow } from "@xyflow/react";
import {
  ClockIcon,
  DownloadIcon,
  PlayIcon,
  RotateCcwIcon,
} from "lucide-react";
import { type ChangeEventHandler, type ComponentProps } from "react";
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
import type { AudioNodeProps } from ".";

type AudioTransformProps = AudioNodeProps & {
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
    return "meta/musicgen-large";
  }

  return firstModel;
};

export const AudioTransform = ({
  data,
  id,
  type,
  title,
}: AudioTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const { audioModels } = useGateway();
  const modelId = data.model ?? getDefaultModel(audioModels);


  const { generate, isGenerating } = useZeepoGeneration({
    nodeId: id,
    category: "audio",
    onSuccess: (outputUrl) => {
      updateNodeData(id, {
        updatedAt: new Date().toISOString(),
        generated: {
          url: outputUrl,
          type: "audio/mpeg", 
        },
      });
      toast.success("Audio generated successfully");
    },
    onError: (error) => {
      handleError("Error generating audio", error);
    }
  });

  const loading = isGenerating;

  const handleGenerate = async () => {
    if (loading) {
      return;
    }

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    const textPrompts = getTextFromTextNodes(incomers);
    
    const instructions = data.instructions ?? "";
    const prompt = [instructions, ...textPrompts].join("\n");

    if (!prompt.trim()) {
      toast.error("No text provided for speech generation");
      return;
    }

    // Default inputs for minimax/speech-2.8-hd
    const inputs: any = {
      text: prompt,
      pitch: data.settings?.pitch ?? 0,
      speed: data.settings?.speed ?? 1,
      volume: data.settings?.volume ?? 1,
      bitrate: 128000,
      channel: "mono",
      emotion: data.settings?.emotion ?? "auto",
      voice_id: data.settings?.voice_id ?? "Wise_Woman",
      sample_rate: 32000,
      audio_format: "mp3",
      language_boost: "None",
      subtitle_enable: false,
      english_normalization: false
    };

    await generate(modelId, prompt, inputs);
  };

  const toolbar: ComponentProps<typeof NodeLayout>["toolbar"] = [
    {
      children: (
        <ModelSelector
          className="w-[200px] rounded-full"
          key={id}
          onChange={(value) => updateNodeData(id, { model: value })}
          options={audioModels}
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
          onClick={() => download(data.generated, id, "mp3")}
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

  const updateSettings = (key: string, value: any) => {
    updateNodeData(id, {
      settings: {
        ...(data.settings || {}),
        [key]: value,
      },
    });
  };

  return (
    <NodeLayout data={data} id={id} title={title} toolbar={toolbar} type={type}>
      {loading ? (
        <Skeleton className="flex w-full min-w-[300px] animate-pulse items-center justify-center p-4">
          <Spinner className="text-muted-foreground" size={16} variant="bars" />
        </Skeleton>
      ) : null}
      {!(loading || data.generated?.url) && (
        <div className="flex w-full min-w-[300px] items-center justify-center bg-secondary p-8">
          <p className="text-muted-foreground text-sm">
            Press <PlayIcon className="inline -translate-y-px" size={12} /> to
            generate audio
          </p>
        </div>
      )}
      {typeof data.generated?.url === "string" && !loading ? (
        <div className="p-4 bg-muted/20">
          <audio
            controls
            className="w-full"
            src={data.generated.url}
          />
        </div>
      ) : null}
      <div className="flex flex-col border-t bg-muted/30 p-3">
        <label className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Text to Speak
        </label>
        <Textarea
          className="min-h-[80px] shrink-0 resize-none rounded-md border bg-background! px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
          onChange={handleInstructionsChange}
          placeholder="Enter the text you want the AI to speak..."
          value={data.instructions ?? ""}
        />
        
        {modelId === "minimax/speech-2.8-hd" && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold uppercase text-muted-foreground/60">Voice</label>
              <select 
                className="rounded border bg-background px-2 py-1 text-[10px]"
                value={data.settings?.voice_id || "Wise_Woman"}
                onChange={(e) => updateSettings("voice_id", e.target.value)}
              >
                <option value="Wise_Woman">Wise Woman</option>
                <option value="Male_Adult">Male Adult</option>
                <option value="Female_Child">Female Child</option>
                <option value="Serious_Male">Serious Male</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold uppercase text-muted-foreground/60">Emotion</label>
              <select 
                className="rounded border bg-background px-2 py-1 text-[10px]"
                value={data.settings?.emotion || "auto"}
                onChange={(e) => updateSettings("emotion", e.target.value)}
              >
                <option value="auto">Auto</option>
                <option value="happy">Happy</option>
                <option value="sad">Sad</option>
                <option value="angry">Angry</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold uppercase text-muted-foreground/60">Speed ({data.settings?.speed || 1}x)</label>
              <input 
                type="range" min="0.5" max="2" step="0.1"
                className="w-full"
                value={data.settings?.speed || 1}
                onChange={(e) => updateSettings("speed", parseFloat(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold uppercase text-muted-foreground/60">Pitch ({data.settings?.pitch || 0})</label>
              <input 
                type="range" min="-12" max="12" step="1"
                className="w-full"
                value={data.settings?.pitch || 0}
                onChange={(e) => updateSettings("pitch", parseInt(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>
    </NodeLayout>
  );
};
