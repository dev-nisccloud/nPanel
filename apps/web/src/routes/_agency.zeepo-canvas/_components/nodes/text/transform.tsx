import {
  ClockIcon,
  CopyIcon,
  PlayIcon,
  RotateCcwIcon,
} from "lucide-react";
import {
  type ChangeEventHandler,
  type ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { getIncomers, useReactFlow } from "@xyflow/react";
import { NodeLayout } from "@/routes/_agency.zeepo-canvas/_components/nodes/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { useZeepoGeneration } from "@/routes/_agency.zeepo-canvas/_hooks/use-zeepo-generation";
import { handleError } from "@/routes/_agency.zeepo-canvas/_lib/error/handle";
import {
  getAudioFromAudioNodes,
  getDescriptionsFromImageNodes,
  getImagesFromImageNodes,
  getTextFromTextNodes,
} from "@/routes/_agency.zeepo-canvas/_lib/xyflow";
import { useGateway } from "@/routes/_agency.zeepo-canvas/_providers/models";
import { ModelSelector } from "../model-selector";
import type { TextNodeProps } from ".";

type TextTransformProps = TextNodeProps & {
  title: string;
};

const getDefaultModel = (models: ReturnType<typeof useGateway>["models"]) => {
  const defaultModel = Object.entries(models).find(
    ([_, model]) => model.default
  );

  const firstModel = Object.keys(models)[0];

  if (!firstModel) {
    return "openai/o3-mini"; // fallback if everything is empty
  }

  return firstModel;
};

export const TextTransform = ({
  data,
  id,
  type,
  title,
}: TextTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const { models } = useGateway();
  const modelId = data.model ?? getDefaultModel(models);


  const { generate, isGenerating } = useZeepoGeneration({
    nodeId: id,
    category: "text",
    onSuccess: (outputText) => {
      const history = data.history ?? [];
      const newHistory = [
        ...history,
        { role: "assistant", text: outputText, timestamp: new Date().toISOString() },
      ];

      updateNodeData(id, {
        generated: {
          text: outputText,
        },
        history: newHistory,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Response received");
    },
    onError: (error) => {
      handleError("Error generating text", error);
    }
  });

  const loading = isGenerating;

  const handleGenerate = useCallback(async () => {
    if (loading) {
      return;
    }

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    
    // Check for Audio input (Transcription Mode)
    const audioNodes = getAudioFromAudioNodes(incomers);
    if (audioNodes.length > 0) {
      const inputs = {
        audio: audioNodes[0].url,
        task: "transcribe",
        language: "None",
        timestamp: "chunk",
        batch_size: 64,
        diarise_audio: false
      };
      
      toast.info("Transcribing audio...");
      await generate("vaibhavs10/incredibly-fast-whisper", "Transcribe audio", inputs);
      return;
    }

    // Standard Conversation Mode
    const textPrompts = getTextFromTextNodes(incomers);
    const images = getImagesFromImageNodes(incomers);
    const imageDescriptions = getDescriptionsFromImageNodes(incomers);

    if (!(textPrompts.length || data.instructions)) {
      toast.error("No prompts found");
      return;
    }

    const currentPrompt = data.instructions ?? "";
    const displayPrompt = currentPrompt || (textPrompts.length > 0 ? textPrompts[0] : "Generate response");

    const content: string[] = [];

    // System Instruction
    content.push("You are a helpful assistant on a creative canvas. Use the following context to answer the user's latest message. IMPORTANT: Do NOT repeat the 'CONVERSATION HISTORY' or 'CONTEXT' blocks in your response. Just provide your direct answer.");

    // Include context from incoming nodes
    if (textPrompts.length) {
      content.push("\n### CONTEXT FROM CONNECTED NODES ###");
      content.push(...textPrompts);
      content.push("### END CONTEXT ###");
    }

    if (imageDescriptions.length) {
      content.push("\n### IMAGE DESCRIPTIONS ###");
      content.push(...imageDescriptions);
      content.push("### END IMAGE DESCRIPTIONS ###");
    }

    // Include history
    const history = data.history ?? [];
    if (history.length > 0) {
      content.push("\n### CONVERSATION HISTORY ###");
      history.forEach((msg: any) => {
        content.push(`${msg.role === "user" ? "User" : "Assistant"}: ${msg.text}`);
      });
      content.push("### END HISTORY ###");
    }

    // Current prompt
    content.push("\n### LATEST USER MESSAGE ###");
    if (currentPrompt) {
      content.push(currentPrompt);
    } else {
      content.push("Please process the provided context and provide a relevant continuation or response.");
    }

    const inputs: any = {};
    if (images.length) {
      inputs.image = images[0].url;
    }

    // Update history with the user's message before sending
    const newHistory = [
      ...history,
      { role: "user", text: displayPrompt, timestamp: new Date().toISOString() },
    ];
    updateNodeData(id, { history: newHistory, instructions: "" });

    await generate(modelId, content.join("\n"), inputs);
  }, [
    data,
    getEdges,
    getNodes,
    id,
    modelId,
    type,
    generate,
    loading,
    updateNodeData
  ]);

  const handleInstructionsChange: ChangeEventHandler<HTMLTextAreaElement> = (
    event
  ) => updateNodeData(id, { instructions: event.target.value });

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }, []);

  const toolbar = useMemo(() => {
    const items: ComponentProps<typeof NodeLayout>["toolbar"] = [];

    items.push({
      children: (
        <ModelSelector
          className="w-[200px] rounded-full"
          key={id}
          onChange={(value) => updateNodeData(id, { model: value })}
          options={models}
          value={modelId}
        />
      ),
    });

    if (loading) {
      items.push({
        tooltip: "Generating...",
        children: (
          <Button className="rounded-full" disabled size="icon">
            <Spinner className="text-primary-foreground" size={12} variant="bars" />
          </Button>
        ),
      });
    } else if (data.generated?.text) {
      const text = data.generated?.text;

      items.push({
        tooltip: "Regenerate",
        children: (
          <Button className="rounded-full" onClick={handleGenerate} size="icon">
            <RotateCcwIcon size={12} />
          </Button>
        ),
      });
      items.push({
        tooltip: "Copy",
        children: (
          <Button
            className="rounded-full"
            disabled={!text}
            onClick={() => handleCopy(text ?? "")}
            size="icon"
            variant="ghost"
          >
            <CopyIcon size={12} />
          </Button>
        ),
      });
    } else {
      items.push({
        tooltip: "Generate",
        children: (
          <Button className="rounded-full" onClick={handleGenerate} size="icon">
            <PlayIcon size={12} />
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

    if (data.history?.length) {
      items.push({
        tooltip: "Clear Chat",
        children: (
          <Button
            className="rounded-full"
            onClick={() => updateNodeData(id, { history: [], generated: null })}
            size="icon"
            variant="ghost"
          >
            <RotateCcwIcon size={12} />
          </Button>
        ),
      });
    }

    return items;
  }, [
    handleCopy,
    models,
    loading,
    handleGenerate,
    data,
    id,
    updateNodeData
  ]);



  return (
    <NodeLayout data={data} id={id} title={title} toolbar={toolbar} type={type}>
      <div className="nowheel flex flex-1 flex-col gap-4 overflow-auto rounded-t-3xl bg-secondary p-4" style={{ maxHeight: "400px" }}>
        {data.history?.length ? (
          data.history.map((msg: any, i: number) => (
            <div
              key={i}
              className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"
                }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
                {msg.role === "user" ? "You" : "Assistant"}
              </span>
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-background text-foreground rounded-tl-none border"
                  }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        ) : (
          !loading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
              <div className="rounded-full bg-muted p-3">
                <PlayIcon className="text-muted-foreground" size={20} />
              </div>
              <p className="max-w-[150px] text-xs text-muted-foreground">
                Connect nodes or type a message below to start chatting
              </p>
            </div>
          )
        )}

        {loading && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
              Assistant is thinking...
            </span>
            <div className="max-w-[90%] rounded-2xl rounded-tl-none border bg-background px-4 py-3 shadow-sm">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-[180px]" />
                <Skeleton className="h-3 w-[120px]" />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col border-t bg-muted/30 p-3">
        <label className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Prompt / Instructions
        </label>
        <div className="relative flex items-end gap-2">
          <Textarea
            className="min-h-[80px] flex-1 shrink-0 resize-none rounded-md border bg-background! px-3 py-2 pr-12 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
            onChange={handleInstructionsChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Type a message or instruction..."
            value={data.instructions ?? ""}
          />
          <Button
            className="absolute bottom-2 right-2 size-8 rounded-md shrink-0"
            disabled={loading || !data.instructions?.trim() && !getIncomers({ id }, getNodes(), getEdges()).length}
            onClick={handleGenerate}
            size="icon"
          >
            {loading ? (
              <Spinner size={12} variant="bars" />
            ) : (
              <PlayIcon size={14} />
            )}
          </Button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground/60 text-right">
          Press <kbd className="font-sans">Ctrl+Enter</kbd> to send
        </p>
      </div>

    </NodeLayout>
  );
};
