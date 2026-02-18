import { router } from "../../trpc";
import { kenicGreetingRouter } from "./greeting";

/**
 * KENIC EPP integration (e.g. .ke domains).
 * Start with greeting to discover server capabilities, then add login/domain routes.
 */
export const kenicRouter = router({
	greeting: kenicGreetingRouter,
});
