import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";

export type ZeepoModel = {
  id: string;
  label: string;
  uiname: string;
  provider: string;
  description: string;
  category: "text" | "image" | "video" | "audio" | "background-remover";
  default?: boolean;
};

// Static model registry. In the future, this could be fetched dynamically from Replicate or a database.
const MODELS: ZeepoModel[] = [
  // Text Models
  {
    id: "meta/meta-llama-3-8b-instruct",
    label: "Llama 3 8B Instruct",
    uiname: "Meta / Llama 3 8B",
    provider: "Meta",
    description: "Fast and capable LLM for text generation.",
    category: "text",
    default: true,
  },
  {
    id: "meta/meta-llama-3-70b-instruct",
    label: "Llama 3 70B Instruct",
    uiname: "Meta / Llama 3 70B",
    provider: "Meta",
    description: "Highly capable LLM for complex tasks.",
    category: "text",
  },
  {
    id: "mistralai/mistral-7b-instruct-v0.2",
    label: "Mistral 7B",
    uiname: "Mistral / Mistral 7B",
    provider: "Mistral",
    description: "High performance open model.",
    category: "text",
  },

  // Image Models
  {
    id: "black-forest-labs/flux-schnell",
    label: "Flux Schnell",
    uiname: "Black Forest / Flux Schnell",
    provider: "Black Forest Labs",
    description: "Extremely fast high-quality image generation.",
    category: "image",
    default: true,
  },
  {
    id: "stability-ai/sdxl",
    label: "SDXL",
    uiname: "Stability AI / SDXL",
    provider: "Stability AI",
    description: "Standard high-resolution image generation.",
    category: "image",
  },
  {
    id: "stability-ai/sdxl-inpainting",
    label: "SDXL Inpainting",
    uiname: "Stability AI / SDXL Inpaint",
    provider: "Stability AI",
    description: "Edit existing images via masking.",
    category: "image",
  },

  // Video Models
  {
    id: "minimax/video-01",
    label: "Minimax Video",
    uiname: "Minimax / Video-01",
    provider: "Minimax",
    description: "State of the art text-to-video generation.",
    category: "video",
    default: true,
  },
  {
    id: "luma/dream-machine",
    label: "Luma Dream Machine",
    uiname: "Luma AI / Dream Machine",
    provider: "Luma AI",
    description: "High quality realistic video generation.",
    category: "video",
  },

  // Audio Models
  {
    id: "minimax/speech-2.8-hd",
    label: "MiniMax Speech 2.8 HD",
    uiname: "MiniMax / Speech 2.8 HD",
    provider: "MiniMax",
    description: "High-quality text-to-speech generation.",
    category: "audio",
    default: true,
  },
  {
    id: "suno-ai/bark",
    label: "Bark (TTS)",
    uiname: "Suno AI / Bark",
    provider: "Suno AI",
    description: "Text-to-audio generation with realistic voices.",
    category: "audio",
  },
  {
    id: "meta/musicgen",
    label: "MusicGen",
    uiname: "Meta / MusicGen",
    provider: "Meta",
    description: "Text-to-music generation.",
    category: "audio",
  },

  // Transcription (Text from Audio)
  {
    id: "vaibhavs10/incredibly-fast-whisper",
    label: "Incredibly Fast Whisper",
    uiname: "OpenAI / Whisper",
    provider: "OpenAI",
    description: "Ultra-fast audio transcription.",
    category: "text",
  },

  // Utilities
  {
    id: "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
    label: "Background Remover",
    uiname: "851 Labs / BG Remover",
    provider: "851 Labs",
    description: "Removes the background from an image.",
    category: "background-remover",
    default: true,
  },
];

export const zeepoCanvasModelsRouter = router({
  getModels: protectedProcedure
    .query(() => {
      // Group by category
      const grouped = MODELS.reduce((acc, model) => {
        if (!acc[model.category]) {
          acc[model.category] = [];
        }
        acc[model.category].push(model);
        return acc;
      }, {} as Record<string, ZeepoModel[]>);

      return { data: grouped };
    }),
});
