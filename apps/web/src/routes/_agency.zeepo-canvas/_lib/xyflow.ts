import type { Node } from "@xyflow/react";
import type { ImageNodeProps } from "@/routes/_agency.zeepo-canvas/_components/nodes/image";
import type { TextNodeProps } from "@/routes/_agency.zeepo-canvas/_components/nodes/text";

export const getTextFromTextNodes = (nodes: Node[]) => {
  const sourceTexts = nodes
    .filter((node) => node.type === "text")
    .map((node) => (node.data as TextNodeProps["data"]).text);

  const generatedTexts = nodes
    .filter((node) => node.type === "text" && node.data.generated)
    .map((node) => (node.data as TextNodeProps["data"]).generated?.text);

  return [...sourceTexts, ...generatedTexts].filter(Boolean) as string[];
};

export const getDescriptionsFromImageNodes = (nodes: Node[]) => {
  const descriptions = nodes
    .filter((node) => node.type === "image")
    .map((node) => (node.data as ImageNodeProps["data"]).description)
    .filter(Boolean) as string[];

  return descriptions;
};

export const getImagesFromImageNodes = (nodes: Node[]) => {
  const sourceImages = nodes
    .filter((node) => node.type === "image")
    .map((node) => (node.data as ImageNodeProps["data"]).content)
    .filter(Boolean) as { url: string; type: string }[];

  const generatedImages = nodes
    .filter((node) => node.type === "image")
    .map((node) => (node.data as ImageNodeProps["data"]).generated)
    .filter(Boolean) as { url: string; type: string }[];

  return [...sourceImages, ...generatedImages];
};

export const getAudioFromAudioNodes = (nodes: Node[]) => {
  const sourceAudio = nodes
    .filter((node) => node.type === "audio")
    .map((node) => (node.data as any).content)
    .filter(Boolean) as { url: string; type: string }[];

  const generatedAudio = nodes
    .filter((node) => node.type === "audio")
    .map((node) => (node.data as any).generated)
    .filter(Boolean) as { url: string; type: string }[];

  return [...sourceAudio, ...generatedAudio];
};

export const isValidSourceTarget = (source: Node, target: Node, models?: Record<string, any>) => {
  if (source.type === "video" || source.type === "drop") {
    return false;
  }

  // Capability checks for Text nodes
  if (target.type === "text" && models) {
    const targetModelId = target.data.model as string;
    const model = models[targetModelId];

    if (model) {
      // If source is image, check if model supports images
      if (source.type === "image" && !model.capabilities?.images) {
        return false;
      }
      // If source is audio, check if model supports audio
      if (source.type === "audio" && !model.capabilities?.audio) {
        return false;
      }
    }
  }

  return true;
};
