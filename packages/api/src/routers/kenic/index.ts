import { router } from "../../trpc";
import { kenicGreetingRouter } from "./greeting";
import { kenicLoginRouter } from "./login";
import { kenicDomainCheckRouter } from "./domain-check";
import { kenicTldsRouter } from "./tlds";

/**
 * KENIC EPP integration (.ke and other KENIC TLDs).
 * Supported TLDs: .ke, .co.ke, .or.ke, .ne.ke, .me.ke, .mobi.ke, .info.ke, .sc.ke, .ac.ke (.go.ke excluded)
 */
export const kenicRouter = router({
	greeting: kenicGreetingRouter,
	login: kenicLoginRouter,
	domainCheck: kenicDomainCheckRouter,
	tlds: kenicTldsRouter,
});
