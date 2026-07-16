/**
 * WHOIS router  pure RDAP.
 *
 * All TLDs (including .ke via https://rdap.kenic.or.ke/) are handled by the
 * single RDAP client. The IANA bootstrap resolves the correct server per TLD.
 *
 * All procedures are public (no session required).
 */

import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { rdapLookup } from "../lib/whois/rdap-client";
import type { WhoisResult } from "../lib/whois/rdap-client";

/** Validate and normalise a domain name string. */
const domainSchema = z
	.string()
	.min(3, "Domain name too short")
	.max(253, "Domain name too long")
	.transform((d) => d.toLowerCase().trim())
	.refine(
		(d) => /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d),
		{ message: "Invalid domain name format" },
	);

export const whoisRouter = router({
	/**
	 * Single-domain WHOIS/RDAP lookup.
	 * Supports any TLD in the IANA bootstrap (593 registries as of 2026).
	 */
	lookup: publicProcedure
		.input(z.object({ domain: domainSchema }))
		.query(async ({ input }) => {
			return rdapLookup(input.domain);
		}),

	/**
	 * Bulk WHOIS lookup for up to 10 domains concurrently.
	 * Individual failures are surfaced in each result's error field  the
	 * request never fails as a whole due to a single domain failing.
	 */
	bulkLookup: publicProcedure
		.input(
			z.object({
				domains: z.array(domainSchema).min(1).max(10),
			}),
		)
		.query(async ({ input }) => {
			const settled = await Promise.allSettled(input.domains.map(rdapLookup));

			const results: WhoisResult[] = settled.map((outcome, i) => {
				if (outcome.status === "fulfilled") return outcome.value;
				return {
					domain: input.domains[i] ?? "",
					handle: null,
					unicodeName: null,
					source: "rdap" as const,
					registrationDate: null,
					expiryDate: null,
					updatedDate: null,
					transferDate: null,
					status: [],
					registrar: null,
					registrant: null,
					adminContact: null,
					techContact: null,
					nameservers: [],
					dnssec: null,
					dsData: [],
					rdapUrl: null,
					error: outcome.reason instanceof Error ? outcome.reason.message : "Lookup failed",
				};
			});

			return { results };
		}),
});
