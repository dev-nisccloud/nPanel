import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { and, asc, eq, inArray } from "@npanel/db";
import { db } from "@npanel/db";
import { invoice } from "@npanel/db/schema/invoicing";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { team } from "@npanel/db/schema/teams";
import { z } from "zod";

import { readCacheJson, writeCacheJson } from "./redis-cache";
import { getRedisClient } from "./redis";
import { ZEEPO_AI_AGENT_PLAN_IDS, ZEEPO_AI_AGENT_PRODUCT_ID } from "./zeepo-agent-billing";
import { ZEEPO_AI_PLAN_IDS, ZEEPO_AI_PRODUCT_ID } from "./zeepo-ai-billing";

const NAIROBI_TZ = "Africa/Nairobi";
const GENERATED_TTL_SEC = 60 * 60 * 26;
const FALLBACK_TTL_SEC = 60 * 10;
const LOCK_TTL_SEC = 45;
const CACHE_PREFIX = "zeepo-ai:home-suggestions:v3";

/** Token wallets. Never analysed or recommended on the home screen. */
const SKIPPED_ZEEPO_PRODUCT_IDS = new Set<string>([ZEEPO_AI_PRODUCT_ID, ZEEPO_AI_AGENT_PRODUCT_ID]);
const SKIPPED_ZEEPO_PLAN_IDS = new Set<string>([
	...Object.values(ZEEPO_AI_PLAN_IDS),
	...Object.values(ZEEPO_AI_AGENT_PLAN_IDS),
]);

const RELEVANT_STATUSES = ["ACTIVE", "PENDING", "SUSPENDED", "PROCESSING", "EXPIRED"] as const;
const OPEN_INVOICE_STATUSES = ["SENT", "PARTIALLY_PAID", "OVERDUE"] as const;

export const ZEEPO_HOME_SUGGESTION_ICON_IDS = [
	"globe",
	"server",
	"calendar",
	"image",
	"document",
	"search",
	"mail",
	"invoice",
	"support",
	"marketing",
] as const;

export const zeepoHomeSuggestionSchema = z.object({
	id: z.string().min(1).max(40),
	label: z.string().min(3).max(80),
	starter: z.string().min(8).max(320),
	icon: z.enum(ZEEPO_HOME_SUGGESTION_ICON_IDS),
	enableSearch: z.boolean(),
});

export type ZeepoHomeSuggestion = z.infer<typeof zeepoHomeSuggestionSchema>;

export const zeepoHomeSuggestionsResultSchema = z.object({
	source: z.enum(["cache", "generated", "fallback"]),
	suggestions: z.array(zeepoHomeSuggestionSchema).min(1).max(6),
});

export type ZeepoHomeSuggestionsResult = z.infer<typeof zeepoHomeSuggestionsResultSchema>;

const cachePayloadSchema = z.object({
	source: z.enum(["generated", "fallback"]),
	suggestions: z.array(zeepoHomeSuggestionSchema).min(4).max(6),
});

const modelPayloadSchema = z.object({
	suggestions: z.array(
		z.object({
			label: z.string(),
			starter: z.string(),
			icon: z.string(),
			enableSearch: z.boolean().optional(),
		}),
	),
});

/** Same starters as the static home shortcuts, used when generation is unavailable. */
const FALLBACK_SUGGESTIONS: ZeepoHomeSuggestion[] = [
	{
		id: "domain",
		label: "Is mybrand.co.ke available?",
		starter:
			"Check if mybrand.co.ke is available and suggest strong .ke and .com alternatives I can register with Nisc Cloud.",
		icon: "globe",
		enableSearch: false,
	},
	{
		id: "hosting",
		label: "Best hosting for WordPress?",
		starter:
			"Recommend a Nisc Cloud hosting or WordPress plan for a small business website that needs SSL, backups, and business email.",
		icon: "server",
		enableSearch: false,
	},
	{
		id: "renewals",
		label: "What expires in 30 days?",
		starter:
			"Review my domains and hosting and tell me what expires or needs attention in the next 30 days.",
		icon: "calendar",
		enableSearch: false,
	},
	{
		id: "image",
		label: "Create a product launch image",
		starter:
			"Create a clean, professional social image for a Kenyan brand launching a new product. Leave space for a short headline.",
		icon: "image",
		enableSearch: false,
	},
	{
		id: "document",
		label: "Draft a hosting proposal",
		starter:
			"Write a short proposal covering domain registration, hosting, and business email from Nisc Cloud.",
		icon: "document",
		enableSearch: false,
	},
	{
		id: "search",
		label: "Typical ad costs in Kenya?",
		starter:
			"Search the web for typical digital advertising and website costs for small businesses in Kenya this year.",
		icon: "search",
		enableSearch: true,
	},
];

function genericBusinessPattern(): RegExp {
	return /\b(?:my|our|your|the|a|an)\s+(?:small\s+|kenyan\s+)?(?:business|company|brand)\b|\bsmall businesses\b|\ba kenyan brand\b/gi;
}

function namedFallback(teamName: string | null | undefined): ZeepoHomeSuggestion[] {
	const name = teamName?.trim();
	if (!name) return FALLBACK_SUGGESTIONS;

	const clip = (value: string, max: number) =>
		value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;

	return FALLBACK_SUGGESTIONS.map((item) => {
		if (item.id === "hosting") {
			return {
				...item,
				label: clip(`Hosting for ${name}`, 80),
				starter: clip(
					`Recommend a Nisc Cloud hosting or WordPress plan for ${name} that needs SSL, backups, and business email.`,
					320,
				),
			};
		}
		if (item.id === "renewals") {
			return {
				...item,
				starter: clip(
					`Review domains and hosting for ${name} and tell me what expires or needs attention in the next 30 days.`,
					320,
				),
			};
		}
		if (item.id === "image") {
			return {
				...item,
				label: clip(`Launch image for ${name}`, 80),
				starter: clip(
					`Create a clean, professional social image for ${name} launching a new product. Leave space for a short headline.`,
					320,
				),
			};
		}
		if (item.id === "document") {
			return {
				...item,
				label: clip(`Hosting proposal for ${name}`, 80),
				starter: clip(
					`Write a short proposal for ${name} covering domain registration, hosting, and business email from Nisc Cloud.`,
					320,
				),
			};
		}
		if (item.id === "search") {
			return {
				...item,
				starter: clip(
					`Search the web for typical digital advertising and website costs that would apply to ${name} in Kenya this year.`,
					320,
				),
			};
		}
		return item;
	});
}

function withOrganizationName(suggestions: ZeepoHomeSuggestion[], teamName: string): ZeepoHomeSuggestion[] {
	const name = teamName.trim();
	if (!name) return suggestions;
	const swap = (text: string, max: number, min: number) => {
		const next = text.replace(genericBusinessPattern(), name).replace(/\s+/g, " ").trim().slice(0, max);
		return next.length >= min ? next : text;
	};
	return suggestions.map((item) => ({
		...item,
		label: swap(item.label, 80, 3),
		starter: swap(item.starter, 320, 8),
	}));
}

type Snapshot = {
	teamName: string;
	today: string;
	fingerprint: string;
	services: string[];
	invoices: string[];
};

function nairobiDay(date: Date): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: NAIROBI_TZ,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

function daysFromToday(day: string, today: string): number {
	const start = Date.parse(`${today}T00:00:00Z`);
	const end = Date.parse(`${day}T00:00:00Z`);
	return Math.round((end - start) / 86_400_000);
}

function describeDue(date: Date | null, today: string): string | null {
	if (!date) return null;
	const day = nairobiDay(date);
	const days = daysFromToday(day, today);
	if (days < 0) return `overdue by ${-days} day${days === -1 ? "" : "s"} (${day})`;
	if (days === 0) return `due today (${day})`;
	if (days <= 45) return `due in ${days} day${days === 1 ? "" : "s"} (${day})`;
	return `renews ${day}`;
}

function isSkippedZeepoSubscription(sub: {
	productId: string;
	productPlanId: string | null;
	name: string | null;
	productName: string | null;
	planName: string | null;
}): boolean {
	if (SKIPPED_ZEEPO_PRODUCT_IDS.has(sub.productId)) return true;
	if (sub.productPlanId && SKIPPED_ZEEPO_PLAN_IDS.has(sub.productPlanId)) return true;

	const label = [sub.productName, sub.planName, sub.name].filter(Boolean).join(" ").toLowerCase();
	if (!label.includes("zeepo")) return false;
	return label.includes("agent") || /pay[\s-]*as[\s-]*you[\s-]*go|\bpayg\b/.test(label);
}

function uniqueParts(parts: Array<string | null | undefined>): string {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const part of parts) {
		const value = part?.trim();
		if (!value) continue;
		const key = value.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(value);
	}
	return out.join(" · ");
}

function fingerprintOf(lines: string[]): string {
	return createHash("sha256").update(lines.join("\n")).digest("hex").slice(0, 20);
}

function suggestionModelId(): string {
	return (
		process.env.ZEEPO_AI_TITLE_MODEL_ID?.trim() ||
		process.env.ZEEPO_AI_CHAT_MODEL_ID?.trim() ||
		"claude-haiku-4-5"
	);
}

function cleanText(value: string, max: number): string {
	return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function parseModelSuggestions(raw: string): ZeepoHomeSuggestion[] | null {
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	if (start < 0 || end <= start) return null;

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw.slice(start, end + 1));
	} catch {
		return null;
	}

	const payload = modelPayloadSchema.safeParse(parsed);
	if (!payload.success) return null;

	const suggestions: ZeepoHomeSuggestion[] = [];
	const seen = new Set<string>();
	for (const row of payload.data.suggestions) {
		const label = cleanText(row.label, 80);
		const starter = cleanText(row.starter, 320);
		if (label.length < 3 || starter.length < 8) continue;
		const key = label.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		const icon = (ZEEPO_HOME_SUGGESTION_ICON_IDS as readonly string[]).includes(row.icon)
			? (row.icon as ZeepoHomeSuggestion["icon"])
			: "globe";
		const candidate = zeepoHomeSuggestionSchema.safeParse({
			id: `s${suggestions.length + 1}`,
			label,
			starter,
			icon,
			enableSearch: icon === "search" || row.enableSearch === true,
		});
		if (!candidate.success) continue;
		suggestions.push(candidate.data);
		if (suggestions.length === 6) break;
	}

	return suggestions.length >= 4 ? suggestions : null;
}

async function loadSnapshot(teamId: string): Promise<Snapshot | null> {
	const teamRow = await db.query.team.findFirst({
		where: eq(team.id, teamId),
		columns: { name: true },
	});
	if (!teamRow) return null;

	const today = nairobiDay(new Date());
	const [subs, invoices] = await Promise.all([
		db.query.niscClientSubscription.findMany({
			where: and(
				eq(niscClientSubscription.teamId, teamId),
				inArray(niscClientSubscription.status, [...RELEVANT_STATUSES]),
			),
			columns: {
				id: true,
				productId: true,
				productPlanId: true,
				status: true,
				name: true,
				primaryDomain: true,
				billingCycle: true,
				nextRenewalDate: true,
				expiryDate: true,
				progressPercent: true,
				progressStatus: true,
			},
			with: {
				product: { columns: { name: true } },
				productPlan: { columns: { name: true } },
			},
			limit: 100,
		}),
		db.query.invoice.findMany({
			where: and(eq(invoice.teamId, teamId), inArray(invoice.status, [...OPEN_INVOICE_STATUSES])),
			columns: {
				id: true,
				invoiceNumber: true,
				status: true,
				currency: true,
				amountRemaining: true,
				dueDate: true,
			},
			orderBy: [asc(invoice.dueDate)],
			limit: 8,
		}),
	]);

	const services = subs
		.filter(
			(sub) =>
				!isSkippedZeepoSubscription({
					productId: sub.productId,
					productPlanId: sub.productPlanId,
					name: sub.name,
					productName: sub.product?.name ?? null,
					planName: sub.productPlan?.name ?? null,
				}),
		)
		.map((sub) => {
			const due = describeDue(sub.nextRenewalDate ?? sub.expiryDate, today);
			const progress =
				sub.progressStatus && sub.progressStatus !== "NOT_STARTED"
					? `delivery ${sub.progressStatus}${typeof sub.progressPercent === "number" ? ` ${sub.progressPercent}%` : ""}`
					: null;
			const title = uniqueParts([
				sub.product?.name,
				sub.productPlan?.name,
				sub.name,
				sub.primaryDomain,
			]);
			return {
				sort: dueSortKey(sub.nextRenewalDate ?? sub.expiryDate, today, sub.status),
				line: [title || "Service", sub.status, due, sub.billingCycle, progress]
					.filter(Boolean)
					.join(" · "),
				fp: [
					sub.id,
					sub.status,
					sub.nextRenewalDate ? nairobiDay(sub.nextRenewalDate) : "",
					sub.expiryDate ? nairobiDay(sub.expiryDate) : "",
					title,
				].join("|"),
			};
		})
		.sort((a, b) => a.sort - b.sort);

	const invoiceLines = invoices.map((row) => {
		const due = describeDue(row.dueDate, today);
		const amount = row.amountRemaining?.trim();
		const money = amount ? `${row.currency} ${amount} remaining` : null;
		const label = row.invoiceNumber?.trim() || "Open invoice";
		return {
			line: [label, row.status, due, money].filter(Boolean).join(" · "),
			fp: [row.id, row.status, row.dueDate ? nairobiDay(row.dueDate) : "", amount ?? ""].join("|"),
		};
	});

	const fingerprint = fingerprintOf([
		today,
		teamRow.name,
		...services.map((row) => row.fp),
		...invoiceLines.map((row) => row.fp),
	]);

	return {
		teamName: teamRow.name,
		today,
		fingerprint,
		services: services.slice(0, 18).map((row) => row.line),
		invoices: invoiceLines.map((row) => row.line),
	};
}

function dueSortKey(date: Date | null, today: string, status: string): number {
	if (status === "EXPIRED") return -10_000;
	if (!date) return 10_000;
	const days = daysFromToday(nairobiDay(date), today);
	if (days <= 45) return days;
	return 1_000 + days;
}

function cacheKey(teamId: string, fingerprint: string): string {
	return `${CACHE_PREFIX}:${teamId}:${fingerprint}`;
}

function lockKey(teamId: string, fingerprint: string): string {
	return `${CACHE_PREFIX}:lock:${teamId}:${fingerprint}`;
}

async function readCached(key: string): Promise<ZeepoHomeSuggestionsResult | null> {
	const raw = await readCacheJson<unknown>(key);
	let value = raw;
	if (typeof raw === "string") {
		try {
			value = JSON.parse(raw) as unknown;
		} catch {
			return null;
		}
	}
	const parsed = cachePayloadSchema.safeParse(value);
	if (!parsed.success) return null;
	return {
		source: parsed.data.source === "generated" ? "cache" : "fallback",
		suggestions: parsed.data.suggestions,
	};
}

async function acquireLock(key: string): Promise<"acquired" | "busy" | "unavailable"> {
	const redis = getRedisClient();
	if (!redis) return "unavailable";
	try {
		const result = await redis.set(key, "1", { nx: true, ex: LOCK_TTL_SEC });
		return result === "OK" ? "acquired" : "busy";
	} catch (error) {
		console.error("[zeepo-ai-suggestions] lock failed", error);
		return "unavailable";
	}
}

async function releaseLock(key: string): Promise<void> {
	const redis = getRedisClient();
	if (!redis) return;
	try {
		await redis.del(key);
	} catch (error) {
		console.error("[zeepo-ai-suggestions] unlock failed", error);
	}
}

async function waitForCache(key: string): Promise<ZeepoHomeSuggestionsResult | null> {
	for (let attempt = 0; attempt < 18; attempt += 1) {
		await new Promise((resolve) => setTimeout(resolve, 700));
		const cached = await readCached(key);
		if (cached) return cached;
	}
	return null;
}

async function generateSuggestions(snapshot: Snapshot): Promise<ZeepoHomeSuggestion[] | null> {
	const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
	if (!apiKey) return null;

	const serviceBlock = snapshot.services.length
		? snapshot.services.map((line) => `- ${line}`).join("\n")
		: "- None";
	const invoiceBlock = snapshot.invoices.length
		? snapshot.invoices.map((line) => `- ${line}`).join("\n")
		: "- None";

	const client = new Anthropic({ apiKey });
	const response = await client.messages.create({
		model: suggestionModelId(),
		max_tokens: 800,
		system: `You write the six starter prompts shown under the Zeepo composer on a customer's home screen.
Zeepo is Nisc Cloud's assistant. Nisc Cloud sells domains, web hosting, WordPress hosting, business email, VPS, VDS, dedicated servers, and can draft documents, create images, search the web, and open a support ticket.
Reply with JSON only: {"suggestions":[{"label":"","starter":"","icon":"","enableSearch":false}]}
Rules:
- Exactly 6 suggestions.
- label is the button text: 4 to 9 words, specific, no trailing punctuation.
- starter is one sentence the customer would send. First person. Use real domains, product names, and dates from the list. Never invent a domain, invoice, price, or service.
- The organization name is exact. Whenever a suggestion refers to the business, company, or brand, use that name. Do not write "my business", "our company", "a small business", or "a Kenyan brand".
- Prioritise services or invoices that are due, overdue, or expiring within 45 days, then a useful next step on something they already have, then a Nisc Cloud capability they are not using (domain search, hosting, an image, a short document) only when it fits.
- If they have no services and no open invoices, suggest practical starters a new customer could send. Do not pretend they already own a service.
- Never mention Zeepo AI Agent, Zeepo AI pay as you go, token balances, or token top-ups. Those wallets are not services to review or renew.
- icon must be one of: globe, server, calendar, image, document, search, mail, invoice, support, marketing.
- enableSearch is true only when the starter needs current public web information.
- Do not mention models, tools, or internal systems.`,
		messages: [
			{
				role: "user",
				content: `Organization name (use this exact name when referring to the business): ${snapshot.teamName}
Today (Africa/Nairobi): ${snapshot.today}

Services:
${serviceBlock}

Open invoices:
${invoiceBlock}`,
			},
		],
	});

	const block = response.content.find((item) => item.type === "text");
	if (!block || block.type !== "text") return null;
	const parsed = parseModelSuggestions(block.text);
	return parsed ? withOrganizationName(parsed, snapshot.teamName) : null;
}

function fallbackResult(teamName?: string | null): ZeepoHomeSuggestionsResult {
	return { source: "fallback", suggestions: namedFallback(teamName) };
}

/**
 * Home suggestions for one team. The cache key includes that team, its name,
 * services, open invoices, and the Nairobi day, so another team gets its own set.
 */
export async function getZeepoAiHomeSuggestions(teamId: string): Promise<ZeepoHomeSuggestionsResult> {
	const snapshot = await loadSnapshot(teamId);
	if (!snapshot) return fallbackResult();

	const key = cacheKey(teamId, snapshot.fingerprint);
	const cached = await readCached(key);
	if (cached) return cached;

	if (!getRedisClient()) return fallbackResult(snapshot.teamName);

	const lock = lockKey(teamId, snapshot.fingerprint);
	const gate = await acquireLock(lock);
	if (gate === "busy") {
		return (await waitForCache(key)) ?? fallbackResult(snapshot.teamName);
	}
	if (gate === "unavailable") return fallbackResult(snapshot.teamName);

	try {
		const again = await readCached(key);
		if (again) return again;

		const generated = await generateSuggestions(snapshot);
		if (!generated) {
			const suggestions = namedFallback(snapshot.teamName);
			await writeCacheJson(key, { source: "fallback", suggestions }, FALLBACK_TTL_SEC);
			return { source: "fallback", suggestions };
		}

		await writeCacheJson(
			key,
			{ source: "generated", suggestions: generated },
			GENERATED_TTL_SEC,
		);
		return { source: "generated", suggestions: generated };
	} catch (error) {
		console.error("[zeepo-ai-suggestions] generate failed", teamId, error);
		const suggestions = namedFallback(snapshot.teamName);
		await writeCacheJson(key, { source: "fallback", suggestions }, FALLBACK_TTL_SEC);
		return { source: "fallback", suggestions };
	} finally {
		await releaseLock(lock);
	}
}
