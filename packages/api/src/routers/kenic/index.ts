import { router } from "../../trpc";
import { kenicGreetingRouter } from "./greeting";
import { kenicLoginRouter } from "./login";
import { kenicDomainCheckRouter } from "./domain-check";
import { kenicTldsRouter } from "./tlds";
import { kenicContactCreateRouter } from "./contact-create";
import { kenicDomainCreateRouter } from "./domain-create";
import { kenicDomainTransferRouter } from "./domain-transfer";
import { kenicConfigStatusRouter } from "./config-status";
import { kenicDomainListRouter } from "./domain-list";
import { kenicBalanceRouter } from "./balance";

/**
 * KENIC EPP integration (.ke and other KENIC TLDs).
 * Supported TLDs: .ke, .co.ke, .or.ke, .ne.ke, .me.ke, .mobi.ke, .info.ke, .sc.ke, .ac.ke (.go.ke excluded)
 * Contact create → domain create → domain transfer (RFC 3733, 5731).
 */
export const kenicRouter = router({
	greeting: kenicGreetingRouter,
	login: kenicLoginRouter,
	domainCheck: kenicDomainCheckRouter,
	tlds: kenicTldsRouter,
	contactCreate: kenicContactCreateRouter,
	domainCreate: kenicDomainCreateRouter,
	domainTransfer: kenicDomainTransferRouter,
	configStatus: kenicConfigStatusRouter,
	/** Agency domains portfolio: list all .ke domains registered through this agency. */
	domainList: kenicDomainListRouter,
	/** Registrar account credit balance (CoCCA finance:info). */
	balance: kenicBalanceRouter,
});
