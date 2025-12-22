import { router } from "../../trpc";
import { imageGenProjectsRouter } from "./projects";
import { imageGenTemplatesRouter } from "./templates";
import { imageGenAiRouter } from "./ai";
import { imageGenImagesRouter } from "./images";

export const imageGenStudioRouter = router({
  projects: imageGenProjectsRouter,
  templates: imageGenTemplatesRouter,
  ai: imageGenAiRouter,
  images: imageGenImagesRouter,
});








