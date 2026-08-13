import { router } from "../../trpc";
import { zeepoAiSessionsRouter } from "./sessions";
import { zeepoAiMessagesRouter, zeepoAiSkillsRouter } from "./messages";
import { zeepoAiBillingRouter } from "./billing";
import { zeepoAiImageEditsRouter } from "./image-edits";
import { zeepoAiCloudPlansRouter } from "./cloud-plans";

export const zeepoAiRouter = router({
	sessions: zeepoAiSessionsRouter,
	messages: zeepoAiMessagesRouter,
	skills: zeepoAiSkillsRouter,
	billing: zeepoAiBillingRouter,
	imageEdits: zeepoAiImageEditsRouter,
	cloudPlans: zeepoAiCloudPlansRouter,
});

export { streamZeepoAiTurn } from "./stream-turn";
export { streamTurnBodySchema } from "./schemas";
export type { ZeepoAiStreamEvent } from "./stream-turn";
