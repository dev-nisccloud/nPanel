import { router } from "../../trpc";
import { imageGenProjectsRouter } from "./projects";
import { imageGenTemplatesRouter } from "./templates";
import { imageGenAiRouter } from "./ai";
import { imageGenImagesRouter } from "./images";
import { imageGenUploadsRouter } from "./uploads";
import { imageGenAiGenerationsRouter } from "./ai-generations";
export const imageGenStudioRouter = router({
    projects: imageGenProjectsRouter,
    templates: imageGenTemplatesRouter,
    ai: imageGenAiRouter,
    images: imageGenImagesRouter,
    uploads: imageGenUploadsRouter,
    aiGenerations: imageGenAiGenerationsRouter,
});
