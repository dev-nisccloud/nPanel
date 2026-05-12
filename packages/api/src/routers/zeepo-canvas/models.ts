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
  capabilities?: {
    images?: boolean;
    audio?: boolean;
    video?: boolean;
    thinking?: boolean;
    audio_generation?: boolean;
  };
};

// Static model registry. In the future, this could be fetched dynamically from Replicate or a database.
export const MODELS: ZeepoModel[] = [
  // --- Cutting Edge Text Models ---
  {
    id: "google/gemini-3.1-pro",
    label: "Gemini 3.1 Pro",
    uiname: "Google / Gemini 3.1 Pro",
    provider: "Google",
    description: "Multimodal powerhouse supporting text, image, and video inputs with deep reasoning.",
    category: "text",
    default: true,
    capabilities: { images: true, video: true, thinking: true },
  },
  {
    id: "anthropic/claude-opus-4.6",
    label: "Claude 4.6 Opus",
    uiname: "Anthropic / Claude 4.6 Opus",
    provider: "Anthropic",
    description: "Most advanced model for complex reasoning and high-fidelity vision tasks.",
    category: "text",
    capabilities: { images: true },
  },
  {
    id: "openai/gpt-5.2",
    label: "GPT-5.2",
    uiname: "OpenAI / GPT-5.2",
    provider: "OpenAI",
    description: "State-of-the-art multimodal reasoning with advanced mathematical capabilities.",
    category: "text",
    capabilities: { images: true },
  },
  {
    id: "deepseek-ai/deepseek-v3",
    label: "DeepSeek V3",
    uiname: "DeepSeek / DeepSeek V3",
    provider: "DeepSeek",
    description: "Highly efficient and capable open-weights LLM.",
    category: "text",
  },
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    uiname: "Google / Gemini 2.5 Flash",
    provider: "Google",
    description: "Ultra-fast multimodal model for quick responses and vision tasks.",
    category: "text",
    capabilities: { images: true },
  },
  {
    id: "openai/gpt-4o",
    label: "GPT-4o",
    uiname: "OpenAI / GPT-4o",
    provider: "OpenAI",
    description: "Omni model with native multimodal capabilities.",
    category: "text",
    capabilities: { images: true },
  },
  {
    id: "openai/gpt-5",
    label: "GPT-5",
    uiname: "OpenAI / GPT-5",
    provider: "OpenAI",
    description: "Next-generation AGI-leaning model for complex tasks.",
    category: "text",
    capabilities: { images: true },
  },
  {
    id: "openai/gpt-5-nano",
    label: "GPT-5 Nano",
    uiname: "OpenAI / GPT-5 Nano",
    provider: "OpenAI",
    description: "Lightweight version of GPT-5 for fast and efficient reasoning.",
    category: "text",
    capabilities: { images: true },
  },
  {
    id: "google/gemini-3-pro",
    label: "Gemini 3 Pro",
    uiname: "Google / Gemini 3 Pro",
    provider: "Google",
    description: "Comprehensive multimodal model supporting text, audio, image, and video.",
    category: "text",
    capabilities: { images: true, video: true, audio: true, thinking: true },
  },
  {
    id: "anthropic/claude-4.5-haiku",
    label: "Claude 4.5 Haiku",
    uiname: "Anthropic / Claude 4.5 Haiku",
    provider: "Anthropic",
    description: "Fastest Claude model with vision support.",
    category: "text",
    capabilities: { images: true },
  },
  {
    id: "anthropic/claude-4.5-sonnet",
    label: "Claude 4.5 Sonnet",
    uiname: "Anthropic / Claude 4.5 Sonnet",
    provider: "Anthropic",
    description: "Perfect balance of speed and intelligence.",
    category: "text",
  },
  {
    id: "anthropic/claude-3.7-sonnet",
    label: "Claude 3.7 Sonnet",
    uiname: "Anthropic / Claude 3.7 Sonnet",
    provider: "Anthropic",
    description: "Highly capable model with extended thinking capabilities.",
    category: "text",
    capabilities: { thinking: true },
  },

  // --- Cutting Edge Image Models ---
  {
    id: "openai/gpt-image-2",
    label: "GPT-Image 2",
    uiname: "OpenAI / GPT-Image 2",
    provider: "OpenAI",
    description: "Next-gen image generation with deep prompt understanding and reference support.",
    category: "image",
    default: true,
    capabilities: { images: true },
  },
  {
    id: "google/imagen-4-ultra",
    label: "Imagen 4 Ultra",
    uiname: "Google / Imagen 4 Ultra",
    provider: "Google",
    description: "Highest fidelity image generation with cinematic photorealism.",
    category: "image",
  },
  {
    id: "bytedance/seedream-4.5",
    label: "SeeDream 4.5",
    uiname: "ByteDance / SeeDream 4.5",
    provider: "ByteDance",
    description: "Creative image generation with advanced composition and reference support.",
    category: "image",
    capabilities: { images: true },
  },
  {
    id: "black-forest-labs/flux-2-pro",
    label: "Flux 2 Pro",
    uiname: "Black Forest / Flux 2 Pro",
    provider: "Black Forest Labs",
    description: "Professional grade image generation with extreme detail and accuracy.",
    category: "image",
    capabilities: { images: true },
  },
  {
    id: "black-forest-labs/flux-2-max",
    label: "Flux 2 Max",
    uiname: "Black Forest / Flux 2 Max",
    provider: "Black Forest Labs",
    description: "Maximum resolution and quality for large-scale creative work.",
    category: "image",
    capabilities: { images: true },
  },
  {
    id: "google/nano-banana-2",
    label: "Nano Banana 2",
    uiname: "Google / Nano Banana 2",
    provider: "Google",
    description: "Fast and creative model for 3D miniatures and stylized dioramas.",
    category: "image",
    capabilities: { images: true },
  },
  {
    id: "google/nano-banana-pro",
    label: "Nano Banana Pro",
    uiname: "Google / Nano Banana Pro",
    provider: "Google",
    description: "Professional grade fast generation with high fidelity.",
    category: "image",
    capabilities: { images: true },
  },
  {
    id: "xai/grok-imagine-image",
    label: "Grok Imagine",
    uiname: "xAI / Grok Imagine",
    provider: "xAI",
    description: "Advanced cinematic image generation with natural lighting.",
    category: "image",
  },
  {
    id: "openai/gpt-image-1.5",
    label: "GPT-Image 1.5",
    uiname: "OpenAI / GPT-Image 1.5",
    provider: "OpenAI",
    description: "Reliable and fast image generation for snapshots and scenes.",
    category: "image",
  },
  {
    id: "google/imagen-4-fast",
    label: "Imagen 4 Fast",
    uiname: "Google / Imagen 4 Fast",
    provider: "Google",
    description: "Optimized for speed without compromising cinematic quality.",
    category: "image",
  },
  {
    id: "prunaai/hidream-l1-fast",
    label: "HiDream L1 Fast",
    uiname: "Pruna AI / HiDream L1",
    provider: "Pruna AI",
    description: "Ultra-fast generation optimized for speed and juice.",
    category: "image",
  },
  {
    id: "prunaai/z-image-turbo",
    label: "Z-Image Turbo",
    uiname: "Pruna AI / Z-Image Turbo",
    provider: "Pruna AI",
    description: "Real-time image generation with film grain aesthetic.",
    category: "image",
  },
  {
    id: "google/nano-banana",
    label: "Nano Banana",
    uiname: "Google / Nano Banana",
    provider: "Google",
    description: "The original fast creative model with reference support.",
    category: "image",
    capabilities: { images: true },
  },

  // --- Cutting Edge Video Models ---
  {
    id: "prunaai/p-video",
    label: "P-Video",
    uiname: "Pruna AI / P-Video",
    provider: "Pruna AI",
    description: "Ultra-fast video generation with native audio support.",
    category: "video",
    default: true,
    capabilities: { images: true, audio_generation: true },
  },
  {
    id: "bytedance/seedance-2.0",
    label: "SeeDance 2.0",
    uiname: "ByteDance / SeeDance 2.0",
    provider: "ByteDance",
    description: "Creative video generation with complex motion and audio.",
    category: "video",
    capabilities: { images: true, audio_generation: true },
  },
  {
    id: "google/veo-3.1-fast",
    label: "Veo 3.1 Fast",
    uiname: "Google / Veo 3.1 Fast",
    provider: "Google",
    description: "Fast cinematic video generation with vision support and audio.",
    category: "video",
    capabilities: { images: true, audio_generation: true },
  },
  {
    id: "google/veo-3.1",
    label: "Veo 3.1",
    uiname: "Google / Veo 3.1",
    provider: "Google",
    description: "State-of-the-art multimodal video generation with high-fidelity audio.",
    category: "video",
    capabilities: { images: true, audio_generation: true },
  },
  {
    id: "xai/grok-imagine-video",
    label: "Grok Imagine Video",
    uiname: "xAI / Grok Imagine Video",
    provider: "xAI",
    description: "Advanced cinematic video generation with natural motion.",
    category: "video",
  },
  {
    id: "runwayml/gen-4.5",
    label: "Gen-4.5",
    uiname: "Runway / Gen-4.5",
    provider: "Runway",
    description: "Professional grade video generation with advanced world modeling.",
    category: "video",
  },
  {
    id: "wan-video/wan-2.2-i2v-fast",
    label: "Wan 2.2 i2v Fast",
    uiname: "Wan / Wan 2.2 Fast",
    provider: "Wan Video",
    description: "Efficient image-to-video generation with realistic motion.",
    category: "video",
    capabilities: { images: true },
  },
  {
    id: "google/veo-3",
    label: "Veo 3",
    uiname: "Google / Veo 3",
    provider: "Google",
    description: "High-quality video generation with integrated audio.",
    category: "video",
    capabilities: { audio_generation: true },
  },
  {
    id: "google/veo-3-fast",
    label: "Veo 3 Fast",
    uiname: "Google / Veo 3-Fast",
    provider: "Google",
    description: "Fast version of Veo 3 optimized for quick turnaround.",
    category: "video",
    capabilities: { images: true, audio_generation: true },
  },
  {
    id: "google/veo-2",
    label: "Veo 2",
    uiname: "Google / Veo 2",
    provider: "Google",
    description: "Reliable and fast video generation model.",
    category: "video",
  },
  {
    id: "bytedance/seedance-1-lite",
    label: "SeeDance 1 Lite",
    uiname: "ByteDance / SeeDance 1 Lite",
    provider: "ByteDance",
    description: "Lightweight video generation for quick previews.",
    category: "video",
  },
  {
    id: "bytedance/seedance-1-pro",
    label: "SeeDance 1 Pro",
    uiname: "ByteDance / SeeDance 1 Pro",
    provider: "ByteDance",
    description: "Professional grade video generation from ByteDance.",
    category: "video",
  },
  {
    id: "kwaivgi/kling-v2.1",
    label: "Kling V2.1",
    uiname: "Kuaishou / Kling V2.1",
    provider: "Kuaishou",
    description: "Advanced video generation with strong image reference support.",
    category: "video",
    capabilities: { images: true },
  },
  {
    id: "kwaivgi/kling-v2.6",
    label: "Kling V2.6",
    uiname: "Kuaishou / Kling V2.6",
    provider: "Kuaishou",
    description: "High-fidelity video with native audio generation.",
    category: "video",
    capabilities: { audio_generation: true },
  },
  {
    id: "kwaivgi/kling-v2.5-turbo-pro",
    label: "Kling V2.5 Turbo Pro",
    uiname: "Kuaishou / Kling V2.5 Turbo",
    provider: "Kuaishou",
    description: "Fast and powerful video generation for professional use.",
    category: "video",
  },
  {
    id: "kwaivgi/kling-v3-omni-video",
    label: "Kling V3 Omni",
    uiname: "Kuaishou / Kling V3 Omni",
    provider: "Kuaishou",
    description: "The ultimate multimodal video model with omni-directional reasoning and audio.",
    category: "video",
    capabilities: { audio_generation: true },
  },
  {
    id: "kwaivgi/kling-v3-video",
    label: "Kling V3",
    uiname: "Kuaishou / Kling V3",
    provider: "Kuaishou",
    description: "State-of-the-art video generation with high-quality audio.",
    category: "video",
    capabilities: { audio_generation: true },
  },

  // --- Audio Models ---
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

  // --- Transcription (Text from Audio) ---
  {
    id: "vaibhavs10/incredibly-fast-whisper",
    label: "Incredibly Fast Whisper",
    uiname: "OpenAI / Whisper",
    provider: "OpenAI",
    description: "Ultra-fast audio transcription.",
    category: "text",
    capabilities: { audio: true },
  },

  // --- Utilities ---
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
