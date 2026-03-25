import { router } from "../../trpc";
import { aiHistoryRouter } from "./history";
import { aiChatRouter } from "./chat";

export const aiRouter = router({
    history: aiHistoryRouter,
    chat: aiChatRouter,
});
