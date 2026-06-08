import { router } from "../../trpc";
import { zeepoCanvasProjectsRouter } from "./projects";
import { zeepoCanvasModelsRouter } from "./models";
import { zeepoCanvasGenerateRouter } from "./generate";
export const zeepoCanvasRouter = router({
    projects: zeepoCanvasProjectsRouter,
    models: zeepoCanvasModelsRouter,
    generate: zeepoCanvasGenerateRouter,
});
