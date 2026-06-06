import { router } from "../../trpc";
import { zeepoAgentSessionsRouter } from "./sessions";
import { zeepoAgentChatRouter } from "./chat";
import { zeepoAgentGenerateRouter } from "./generate";
import { zeepoAgentSkillsRouter } from "./skills";
import { zeepoAgentImageEditsRouter } from "./image-edits";
import { zeepoAgentBillingRouter } from "./billing";
export const zeepoAgentRouter = router({
    sessions: zeepoAgentSessionsRouter,
    chat: zeepoAgentChatRouter,
    generate: zeepoAgentGenerateRouter,
    skills: zeepoAgentSkillsRouter,
    imageEdits: zeepoAgentImageEditsRouter,
    billing: zeepoAgentBillingRouter,
});
