import { and, asc, db, desc, eq, inArray, sql } from "@npanel/db";
import {
	AGENCY_CRON_JOB_KEYS,
	agencyCronJobActivity,
	agencyCronJobRun,
	agencyCronJobRunItem,
	agencyCronJobSetting,
} from "@npanel/db/schema/agency-cron-jobs";
import { user } from "@npanel/db/schema/auth";
import {
	niscClientSubscription,
	niscClientSubscriptionActivityLog,
	niscProduct,
	niscProductPlan,
} from "@npanel/db/schema/products";
import { teamBillingSettings } from "@npanel/db/schema/teams";
import { renderServiceRenewalReminderEmail } from "./email-templates";
import { sendEmail, sendEmailWithPdf } from "./email";
import {
	listTeamOwnerUsers,
	uniqueOwnerEmails,
} from "./nisc-order-invoice-billing";
import {
	buildRenewalInvoicePdf,
	ensureSubscriptionRenewalInvoice,
	serializeRenewalInvoiceResult,
	type RenewalInvoiceEnsureResult,
} from "./subscription-renewal-invoice";
import { isTerminalSubscriptionStatus } from "./nisc-subscription-renewal-apply";
import { computeSubscriptionExpiryFromBillingCycle } from "./nisc-subscription-dates";

/** Subscriptions with expiry (or next renewal) on/before this many days from now are reminded. */
export const RENEWAL_REMINDER_WINDOW_DAYS = 7;

/** After expiry, scheduled runs skip if a reminder was already sent within this window. */
export const RENEWAL_REMINDER_DEDUPE_HOURS = 23;

/** Treat RUNNING runs with no heartbeat older than this as stale. */
export const RENEWAL_REMINDER_STALE_MS = 15 * 60 * 1000;

const BATCH_DEFAULT = 25;

export const SUBSCRIPTION_RENEWAL_REMINDERS_JOB_KEY =
	AGENCY_CRON_JOB_KEYS.SUBSCRIPTION_RENEWAL_REMINDERS;

export const RENEWAL_REMINDER_CRON_DISABLED_MESSAGE = "Cron is off";

export type SubscriptionRenewalRemindersPayload = {
	offset?: number;
	limit?: number;
	/** Agency user who clicked "Run now"; cron omits this. */
	triggeredByUserId?: string | null;
	source?: "schedule" | "manual" | "continuation";
	/** Existing run id when continuing a batch or resuming after queue. */
	runId?: string;
};

export type SubscriptionRenewalRemindersResult = {
	runId: string;
	scanned: number;
	sent: number;
	skipped: number;
	failed: number;
	errors: { subscriptionId: string; error: string }[];
	hasMore: boolean;
	nextOffset: number;
	status: string;
};

type SubMetadata = {
	lastRenewalReminderAt?: string;
	[key: string]: unknown;
};

type ItemInsert = typeof agencyCronJobRunItem.$inferInsert;

type DueSubscriptionRow = Awaited<ReturnType<typeof fetchSubscriptionsForCron>>[number];

type ItemEmailSnapshot = {
	to: string;
	cc?: string[];
	subject: string;
	html: string;
	fromEmail?: string | null;
	fromName?: string | null;
	replyTo?: string | null;
	sesMessageId?: string | null;
	invoiceId?: string | null;
	invoiceNumber?: string | null;
	attachmentFilename?: string | null;
};

type ReminderRecipients = {
	to: string;
	cc: string[];
	source: "team_billing" | "team_owners";
};

async function resolveReminderRecipients(
	row: DueSubscriptionRow,
): Promise<ReminderRecipients | null> {
	const billingEmail = row.billingEmail?.trim() || "";
	if (billingEmail) {
		return { to: billingEmail, cc: [], source: "team_billing" };
	}
	if (!row.teamId) return null;
	const owners = await listTeamOwnerUsers(row.teamId);
	const emails = uniqueOwnerEmails(owners.map((o) => o.email));
	if (emails.length === 0) return null;
	return {
		to: emails[0]!,
		cc: emails.slice(1),
		source: "team_owners",
	};
}

/** JSON-safe dump of unknown values (AWS SES errors, skip context, etc.). */
function serializeUnknown(value: unknown, seen = new WeakSet<object>(), depth = 0): unknown {
	if (value == null || typeof value === "boolean" || typeof value === "number") {
		return value;
	}
	if (typeof value === "string") return value;
	if (typeof value === "bigint") return value.toString();
	if (typeof value === "symbol" || typeof value === "function") return String(value);
	if (value instanceof Date) return value.toISOString();
	if (typeof value !== "object") return String(value);
	if (seen.has(value)) return "[Circular]";
	if (depth > 6) return "[MaxDepth]";
	seen.add(value);

	if (value instanceof Error) {
		const extra: Record<string, unknown> = {
			name: value.name,
			message: value.message,
			stack: value.stack ?? null,
		};
		for (const key of Object.getOwnPropertyNames(value)) {
			if (key === "name" || key === "message" || key === "stack") continue;
			try {
				extra[key] = serializeUnknown(
					(value as unknown as Record<string, unknown>)[key],
					seen,
					depth + 1,
				);
			} catch {
				extra[key] = "[Unserializable]";
			}
		}
		return extra;
	}

	if (Array.isArray(value)) {
		return value.map((entry) => serializeUnknown(entry, seen, depth + 1));
	}

	const out: Record<string, unknown> = {};
	for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
		out[key] = serializeUnknown(nested, seen, depth + 1);
	}
	return out;
}

function hoursSince(iso: string | undefined, now: Date): number | null {
	if (!iso) return null;
	const at = new Date(iso);
	if (Number.isNaN(at.getTime())) return null;
	return (now.getTime() - at.getTime()) / (60 * 60 * 1000);
}

function itemContext(
	row: DueSubscriptionRow,
	due: Date | null | undefined,
	now: Date,
	lastRenewalReminderAt: string | undefined,
	extra?: Record<string, unknown>,
): Record<string, unknown> {
	return {
		evaluatedAt: now.toISOString(),
		subscriptionId: row.id,
		teamId: row.teamId,
		status: row.status,
		billingEmail: row.billingEmail?.trim() || null,
		productId: row.productId,
		agreedPrice: row.agreedPrice,
		billingCycle: row.billingCycle,
		expiryDate: row.expiryDate ? new Date(row.expiryDate).toISOString() : null,
		nextRenewalDate: row.nextRenewalDate
			? new Date(row.nextRenewalDate).toISOString()
			: null,
		dueDate: due ? new Date(due).toISOString() : null,
		dueDateSource: row.expiryDate
			? "expiryDate"
			: row.nextRenewalDate
				? "nextRenewalDate"
				: null,
		lastRenewalReminderAt: lastRenewalReminderAt ?? null,
		dedupeHours: RENEWAL_REMINDER_DEDUPE_HOURS,
		reminderWindowDays: RENEWAL_REMINDER_WINDOW_DAYS,
		...extra,
	};
}

async function ensureInvoiceForDueRow(
	row: DueSubscriptionRow,
	due: Date | null | undefined,
	createdBy: string | null,
): Promise<RenewalInvoiceEnsureResult> {
	if (!due) {
		return {
			ok: false,
			skipped: true,
			reasonCode: "no_due_date",
			reasonMessage:
				"Invoice skipped: subscription has neither expiryDate nor nextRenewalDate.",
		};
	}
	return ensureSubscriptionRenewalInvoice({
		subscriptionId: row.id,
		teamId: row.teamId,
		userId: row.userId,
		createdBy,
		productId: row.productId,
		productName: row.productName ?? "Service",
		serviceType: row.serviceType,
		subscriptionName: row.name,
		primaryDomain: row.primaryDomain,
		agreedPrice: row.agreedPrice,
		agreedCurrency: row.agreedCurrency,
		billingCycle: row.billingCycle,
		periodStart: due,
	});
}

function startOfUtcDay(d: Date): Date {
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDays(d: Date, days: number): Date {
	const next = new Date(d);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

function parseMetadata(raw: unknown): SubMetadata {
	if (raw && typeof raw === "object" && !Array.isArray(raw)) {
		return raw as SubMetadata;
	}
	return {};
}

function hasNoInvoiceFlag(metadata: SubMetadata): boolean {
	return metadata.noInvoice === true;
}

function isOneTimeBillingCycle(cycle: string | null | undefined): boolean {
	return (cycle ?? "").trim().toUpperCase() === "ONE_TIME";
}

function sameInstant(a: Date | null | undefined, b: Date | null | undefined): boolean {
	if (!a && !b) return true;
	if (!a || !b) return false;
	return a.getTime() === b.getTime();
}

function reconcileSubscriptionPeriodDates(input: {
	expiryDate: Date | null;
	nextRenewalDate: Date | null;
	subscriptionDate: Date | null;
	billingCycle: string | null;
}): {
	expiryDate: Date | null;
	nextRenewalDate: Date | null;
	reasons: string[];
} {
	let expiry = input.expiryDate ? new Date(input.expiryDate) : null;
	let next = input.nextRenewalDate ? new Date(input.nextRenewalDate) : null;
	const reasons: string[] = [];

	if (!expiry && !next && input.subscriptionDate) {
		const computed = computeSubscriptionExpiryFromBillingCycle(
			new Date(input.subscriptionDate),
			input.billingCycle,
		);
		if (computed) {
			expiry = computed;
			next = computed;
			reasons.push("backfilled_from_billing_cycle");
		}
	}

	if (expiry && !next) {
		next = expiry;
		reasons.push("next_renewal_mirrored_expiry");
	} else if (!expiry && next) {
		expiry = next;
		reasons.push("expiry_mirrored_next_renewal");
	} else if (expiry && next && expiry.getTime() !== next.getTime()) {
		next = expiry;
		reasons.push("next_renewal_aligned_to_expiry");
	}

	return { expiryDate: expiry, nextRenewalDate: next, reasons };
}

async function writeSubscriptionActivity(opts: {
	subscriptionId: string;
	userId: string | null;
	action: string;
	description: string;
	metadata: Record<string, unknown>;
}) {
	if (!opts.userId) return;
	await db.insert(niscClientSubscriptionActivityLog).values({
		id: crypto.randomUUID(),
		subscriptionId: opts.subscriptionId,
		userId: opts.userId,
		action: opts.action,
		description: opts.description,
		metadata: opts.metadata,
		ipAddress: null,
		userAgent: null,
	});
}

function parseReminderAt(iso: string | undefined): Date | null {
	if (!iso) return null;
	const at = new Date(iso);
	return Number.isNaN(at.getTime()) ? null : at;
}

function wasRemindedRecently(metadata: SubMetadata, now: Date): boolean {
	const at = parseReminderAt(
		typeof metadata.lastRenewalReminderAt === "string"
			? metadata.lastRenewalReminderAt
			: undefined,
	);
	if (!at) return false;
	const ageMs = now.getTime() - at.getTime();
	return ageMs >= 0 && ageMs < RENEWAL_REMINDER_DEDUPE_HOURS * 60 * 60 * 1000;
}

/** Scheduled cadence only. Manual runs never use this. */
function scheduledReminderSkip(
	due: Date,
	lastReminderAt: string | undefined,
	now: Date,
): { skipReason: string; detail: string } | null {
	const today = startOfUtcDay(now).getTime();
	const expiryDay = startOfUtcDay(due).getTime();
	const lastAt = parseReminderAt(lastReminderAt);

	if (expiryDay > today) {
		const windowStart = addUtcDays(
			startOfUtcDay(due),
			-RENEWAL_REMINDER_WINDOW_DAYS,
		).getTime();
		if (lastAt && lastAt.getTime() >= windowStart) {
			return {
				skipReason: "wait_until_expiry",
				detail: `Already reminded at ${lastAt.toISOString()}; next scheduled send is expiry day.`,
			};
		}
		return null;
	}

	if (expiryDay === today) {
		if (lastAt && lastAt.getTime() >= today) {
			return {
				skipReason: "recently_reminded",
				detail: `Already reminded on expiry day at ${lastAt.toISOString()}.`,
			};
		}
		return null;
	}

	if (lastAt && wasRemindedRecently({ lastRenewalReminderAt: lastReminderAt }, now)) {
		return {
			skipReason: "recently_reminded",
			detail: `Already reminded at ${lastAt.toISOString()}.`,
		};
	}
	return null;
}

function buildSummary(counts: {
	scanned: number;
	sent: number;
	skipped: number;
	failed: number;
}): string {
	return `Scanned ${counts.scanned}: sent ${counts.sent}, skipped ${counts.skipped}, failed ${counts.failed}`;
}

export async function findActiveRenewalReminderRun(): Promise<{
	id: string;
	status: string;
	heartbeatAt: Date | null;
	startedAt: Date | null;
	isStale: boolean;
} | null> {
	const row = await db.query.agencyCronJobRun.findFirst({
		where: and(
			eq(agencyCronJobRun.jobKey, SUBSCRIPTION_RENEWAL_REMINDERS_JOB_KEY),
			inArray(agencyCronJobRun.status, ["queued", "running"]),
		),
		orderBy: [desc(agencyCronJobRun.createdAt)],
		columns: {
			id: true,
			status: true,
			heartbeatAt: true,
			startedAt: true,
		},
	});
	if (!row) return null;
	const beat = row.heartbeatAt ?? row.startedAt;
	const isStale =
		!beat || Date.now() - beat.getTime() > RENEWAL_REMINDER_STALE_MS;
	return { ...row, isStale };
}

/**
 * Create a new run row (queued). Used before enqueueing to QStash.
 */
export async function createRenewalReminderRun(opts: {
	source: "schedule" | "manual";
	triggeredByUserId?: string | null;
	qstashMessageId?: string | null;
}): Promise<string> {
	const id = crypto.randomUUID();
	const now = new Date();
	await db.insert(agencyCronJobRun).values({
		id,
		jobKey: SUBSCRIPTION_RENEWAL_REMINDERS_JOB_KEY,
		source: opts.source,
		status: "queued",
		triggeredByUserId: opts.triggeredByUserId ?? null,
		qstashMessageId: opts.qstashMessageId ?? null,
		heartbeatAt: now,
		metadata: { createdSource: opts.source },
	});
	return id;
}

export async function isRenewalReminderCronEnabled(): Promise<boolean> {
	const row = await db.query.agencyCronJobSetting.findFirst({
		where: eq(agencyCronJobSetting.jobKey, SUBSCRIPTION_RENEWAL_REMINDERS_JOB_KEY),
		columns: { enabled: true },
	});
	return row?.enabled ?? true;
}

export async function getRenewalReminderCronSetting(): Promise<{
	enabled: boolean;
	updatedAt: Date | null;
	updatedByUserId: string | null;
}> {
	const row = await db.query.agencyCronJobSetting.findFirst({
		where: eq(agencyCronJobSetting.jobKey, SUBSCRIPTION_RENEWAL_REMINDERS_JOB_KEY),
		columns: {
			enabled: true,
			updatedAt: true,
			updatedByUserId: true,
		},
	});
	return {
		enabled: row?.enabled ?? true,
		updatedAt: row?.updatedAt ?? null,
		updatedByUserId: row?.updatedByUserId ?? null,
	};
}

export async function setRenewalReminderCronEnabled(
	enabled: boolean,
	userId: string,
): Promise<{ enabled: boolean; changed: boolean }> {
	const current = await getRenewalReminderCronSetting();
	if (current.enabled === enabled && current.updatedAt) {
		return { enabled: current.enabled, changed: false };
	}
	const now = new Date();
	await db
		.insert(agencyCronJobSetting)
		.values({
			jobKey: SUBSCRIPTION_RENEWAL_REMINDERS_JOB_KEY,
			enabled,
			updatedByUserId: userId,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: agencyCronJobSetting.jobKey,
			set: {
				enabled,
				updatedByUserId: userId,
				updatedAt: now,
			},
		});
	await db.insert(agencyCronJobActivity).values({
		id: crypto.randomUUID(),
		jobKey: SUBSCRIPTION_RENEWAL_REMINDERS_JOB_KEY,
		action: enabled ? "enabled" : "disabled",
		userId,
		createdAt: now,
		metadata: { previousEnabled: current.enabled },
	});
	return { enabled, changed: true };
}

export async function listRenewalReminderCronActivity(limit = 40) {
	return db
		.select({
			id: agencyCronJobActivity.id,
			action: agencyCronJobActivity.action,
			createdAt: agencyCronJobActivity.createdAt,
			userId: agencyCronJobActivity.userId,
			userName: user.name,
			userEmail: user.email,
		})
		.from(agencyCronJobActivity)
		.leftJoin(user, eq(user.id, agencyCronJobActivity.userId))
		.where(eq(agencyCronJobActivity.jobKey, SUBSCRIPTION_RENEWAL_REMINDERS_JOB_KEY))
		.orderBy(desc(agencyCronJobActivity.createdAt))
		.limit(Math.min(100, Math.max(1, limit)));
}

async function markRunFailed(runId: string, error: string) {
	const now = new Date();
	await db
		.update(agencyCronJobRun)
		.set({
			status: "failed",
			lastError: error,
			finishedAt: now,
			heartbeatAt: now,
			summary: error,
		})
		.where(eq(agencyCronJobRun.id, runId));
}

/**
 * Scan every client subscription: sync dates (expiry is canonical; next renewal mirrors it;
 * missing dates are backfilled from subscription date + billing cycle), set ACTIVE/EXPIRED
 * from those dates, and send renewal reminder emails for rows expired or due within
 * {@link RENEWAL_REMINDER_WINDOW_DAYS}. Persists run + per-subscription item logs.
 */
export async function processSubscriptionRenewalReminders(
	opts: SubscriptionRenewalRemindersPayload = {},
): Promise<SubscriptionRenewalRemindersResult> {
	const offset = Math.max(0, opts.offset ?? 0);
	const limit = Math.min(200, Math.max(1, opts.limit ?? BATCH_DEFAULT));
	if (!(await isRenewalReminderCronEnabled())) {
		if (opts.runId) {
			await markRunFailed(opts.runId, RENEWAL_REMINDER_CRON_DISABLED_MESSAGE);
			return {
				runId: opts.runId,
				scanned: 0,
				sent: 0,
				skipped: 0,
				failed: 0,
				errors: [],
				hasMore: false,
				nextOffset: offset,
				status: "failed",
			};
		}
		return {
			runId: "",
			scanned: 0,
			sent: 0,
			skipped: 0,
			failed: 0,
			errors: [],
			hasMore: false,
			nextOffset: offset,
			status: "disabled",
		};
	}
	const now = new Date();
	const logicalSource =
		opts.source === "continuation"
			? undefined
			: opts.source === "manual"
				? "manual"
				: "schedule";

	let runId = opts.runId;
	if (!runId) {
		runId = await createRenewalReminderRun({
			source: logicalSource ?? "schedule",
			triggeredByUserId: opts.triggeredByUserId,
		});
	}

	const existing = await db.query.agencyCronJobRun.findFirst({
		where: eq(agencyCronJobRun.id, runId),
		columns: {
			id: true,
			source: true,
			scanned: true,
			sent: true,
			skipped: true,
			failed: true,
			batchCount: true,
			startedAt: true,
		},
	});

	if (!existing) {
		throw new Error(`Renewal reminder run not found: ${runId}`);
	}

	await db
		.update(agencyCronJobRun)
		.set({
			status: "running",
			startedAt: existing.startedAt ?? now,
			heartbeatAt: now,
			currentOffset: offset,
		})
		.where(eq(agencyCronJobRun.id, runId));

	const windowEnd = addUtcDays(startOfUtcDay(now), RENEWAL_REMINDER_WINDOW_DAYS + 1);
	const dueDateExpr = sql`coalesce(${niscClientSubscription.expiryDate}, ${niscClientSubscription.nextRenewalDate})`;

	let rows: Awaited<ReturnType<typeof fetchSubscriptionsForCron>>;
	try {
		rows = await fetchSubscriptionsForCron(dueDateExpr, limit, offset);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		await markRunFailed(runId, message);
		throw err;
	}

	const batch: SubscriptionRenewalRemindersResult = {
		runId,
		scanned: rows.length,
		sent: 0,
		skipped: 0,
		failed: 0,
		errors: [],
		hasMore: rows.length === limit,
		nextOffset: offset + rows.length,
		status: "running",
	};

	const itemRows: ItemInsert[] = [];

	for (const row of rows) {
		const metadata = parseMetadata(row.metadata);
		const productName = row.productName ?? "Service";
		const planName = row.planName ?? null;
		const serviceNameLabel = planName ? `${productName} - ${planName}` : productName;
		const subscriptionName = row.name ?? null;
		const lastReminderAt =
			typeof metadata.lastRenewalReminderAt === "string"
				? metadata.lastRenewalReminderAt
				: undefined;
		const actorId =
			opts.triggeredByUserId ??
			row.recordedBy ??
			row.subscribedBy ??
			row.userId ??
			null;

		const baseItem = {
			id: crypto.randomUUID(),
			runId,
			subscriptionId: row.id,
			subscriptionName,
			productName: serviceNameLabel,
			expiryDate: row.expiryDate ?? row.nextRenewalDate ?? null,
		};

		if (isOneTimeBillingCycle(row.billingCycle)) {
			const skipReason = "one_time";
			const detail = "Skipped: one-time subscription is not renewed by cron.";
			batch.skipped += 1;
			itemRows.push({
				...baseItem,
				outcome: "skipped",
				skipReason,
				metadata: {
					detail,
					skipReason,
					context: itemContext(row, null, now, lastReminderAt),
				},
			});
			continue;
		}

		if (hasNoInvoiceFlag(metadata)) {
			const skipReason = "no_invoice";
			const detail =
				"Skipped: subscription is marked noInvoice (complimentary / signup grant). Dates and status were left unchanged.";
			batch.skipped += 1;
			itemRows.push({
				...baseItem,
				outcome: "skipped",
				skipReason,
				metadata: {
					detail,
					skipReason,
					context: itemContext(
						row,
						row.expiryDate ?? row.nextRenewalDate,
						now,
						lastReminderAt,
					),
				},
			});
			continue;
		}

		const previousStatus = row.status;
		const reconciled = reconcileSubscriptionPeriodDates({
			expiryDate: row.expiryDate,
			nextRenewalDate: row.nextRenewalDate,
			subscriptionDate: row.subscriptionDate,
			billingCycle: row.billingCycle,
		});
		const datesChanged =
			!sameInstant(row.expiryDate, reconciled.expiryDate) ||
			!sameInstant(row.nextRenewalDate, reconciled.nextRenewalDate);

		if (datesChanged) {
			await db
				.update(niscClientSubscription)
				.set({
					expiryDate: reconciled.expiryDate,
					nextRenewalDate: reconciled.nextRenewalDate,
					updatedAt: now,
				})
				.where(eq(niscClientSubscription.id, row.id));
			row.expiryDate = reconciled.expiryDate;
			row.nextRenewalDate = reconciled.nextRenewalDate;
			await writeSubscriptionActivity({
				subscriptionId: row.id,
				userId: actorId,
				action: "UPDATE",
				description: "Synced subscription dates from expiry / billing cycle (cron)",
				metadata: {
					reasons: reconciled.reasons,
					expiryDate: reconciled.expiryDate?.toISOString() ?? null,
					nextRenewalDate: reconciled.nextRenewalDate?.toISOString() ?? null,
				},
			});
		}

		const due = row.expiryDate ?? row.nextRenewalDate;
		baseItem.expiryDate = due ?? null;
		const context = itemContext(row, due, now, lastReminderAt, {
			dateReasons: reconciled.reasons,
			datesChanged,
			previousStatus,
		});

		const canMutateStatus =
			!isTerminalSubscriptionStatus(row.status) &&
			(row.status ?? "").toUpperCase() !== "PENDING";

		if (canMutateStatus && due) {
			const pastDue = due.getTime() < startOfUtcDay(now).getTime();
			if (pastDue && row.status !== "EXPIRED") {
				await db
					.update(niscClientSubscription)
					.set({ status: "EXPIRED", updatedAt: now })
					.where(eq(niscClientSubscription.id, row.id));
				row.status = "EXPIRED";
				context.status = "EXPIRED";
				await writeSubscriptionActivity({
					subscriptionId: row.id,
					userId: actorId,
					action: "EXPIRE",
					description: "Marked expired because the due date has passed (cron)",
					metadata: {
						dueDate: due.toISOString(),
						previousStatus,
					},
				});
			} else if (!pastDue && row.status === "EXPIRED") {
				await db
					.update(niscClientSubscription)
					.set({ status: "ACTIVE", updatedAt: now })
					.where(eq(niscClientSubscription.id, row.id));
				row.status = "ACTIVE";
				context.status = "ACTIVE";
				await writeSubscriptionActivity({
					subscriptionId: row.id,
					userId: actorId,
					action: "UPDATE",
					description: "Marked active because the due date is still in the future (cron)",
					metadata: {
						dueDate: due.toISOString(),
						previousStatus,
					},
				});
			}
		}

		if (isTerminalSubscriptionStatus(row.status)) {
			const skipReason = "terminal_status";
			const detail = `Skipped: subscription status is ${row.status}. Dates stay the source of truth; cancelled/upgraded/downgraded subscriptions are not invoiced.`;
			batch.skipped += 1;
			itemRows.push({
				...baseItem,
				outcome: "skipped",
				skipReason,
				metadata: {
					detail,
					skipReason,
					context: { ...context, status: row.status },
				},
			});
			continue;
		}

		if ((row.status ?? "").toUpperCase() === "PENDING") {
			const skipReason = "pending_status";
			const detail =
				"Skipped: pending subscriptions are not invoiced until they become active.";
			batch.skipped += 1;
			itemRows.push({
				...baseItem,
				outcome: "skipped",
				skipReason,
				metadata: {
					detail,
					skipReason,
					context,
				},
			});
			continue;
		}

		if (!due) {
			const skipReason = "no_due_date";
			const detail =
				"Skipped: subscription has neither expiryDate nor nextRenewalDate, and dates could not be derived from billing cycle.";
			batch.skipped += 1;
			itemRows.push({
				...baseItem,
				outcome: "skipped",
				skipReason,
				metadata: {
					detail,
					skipReason,
					context,
				},
			});
			continue;
		}

		if (due.getTime() > windowEnd.getTime()) {
			const skipReason = "not_due";
			const detail = `Skipped: due date is after the ${RENEWAL_REMINDER_WINDOW_DAYS}-day reminder window. Dates and status were still synced.`;
			batch.skipped += 1;
			itemRows.push({
				...baseItem,
				outcome: "skipped",
				skipReason,
				metadata: {
					detail,
					skipReason,
					context,
					windowEnd: windowEnd.toISOString(),
				},
			});
			continue;
		}

		let invoiceResult: RenewalInvoiceEnsureResult;
		try {
			invoiceResult = await ensureInvoiceForDueRow(row, due, actorId);
		} catch (err) {
			invoiceResult = {
				ok: false,
				skipped: true,
				reasonCode: "invoice_creation_failed",
				reasonMessage: err instanceof Error ? err.message : String(err),
			};
			console.error(
				`[subscription-renewal-reminders] invoice failed for ${row.id}:`,
				err,
			);
		}
		const invoiceLog = serializeRenewalInvoiceResult(invoiceResult);
		const recipients = await resolveReminderRecipients(row);
		const emailToDisplay = recipients
			? [recipients.to, ...recipients.cc].join(", ")
			: null;
		const isManualRun =
			opts.source === "manual" || existing.source === "manual";
		const invoiceCreatedThisRun = invoiceResult.ok && invoiceResult.created;

		if (!recipients) {
			const skipReason = "no_billing_email";
			const detail =
				"Skipped: no team billing email, and no team owners (or team creator) with an email address.";
			batch.skipped += 1;
			itemRows.push({
				...baseItem,
				outcome: "skipped",
				skipReason,
				metadata: {
					detail,
					skipReason,
					context,
					invoice: invoiceLog,
				},
			});
			continue;
		}

		// Manual Run now always sends. Scheduled: one email in the 7 days before
		// expiry, then again on expiry day. Never skip after minting a new invoice.
		const scheduledSkip =
			!isManualRun && !invoiceCreatedThisRun
				? scheduledReminderSkip(due, lastReminderAt, now)
				: null;
		if (scheduledSkip) {
			batch.skipped += 1;
			itemRows.push({
				...baseItem,
				outcome: "skipped",
				skipReason: scheduledSkip.skipReason,
				emailTo: emailToDisplay,
				metadata: {
					detail: scheduledSkip.detail,
					skipReason: scheduledSkip.skipReason,
					lastRenewalReminderAt: lastReminderAt ?? null,
					hoursSinceLastReminder: hoursSince(lastReminderAt, now),
					recipientSource: recipients.source,
					context,
					invoice: invoiceLog,
				},
			});
			continue;
		}

		let emailSnapshot: ItemEmailSnapshot | null = null;

		try {
			const isDomain = productName.toLowerCase().includes("domain");
			const gracePeriodText = isDomain
				? "For domain services, suspension is immediate after expiry."
				: "Your service will be suspended 7 days after the expiry date if not renewed.";
			const subscriptionDateStr = row.subscriptionDate
				? new Date(row.subscriptionDate).toLocaleDateString()
				: " ";
			const expiryDateStr = new Date(due).toLocaleDateString();
			const template = {
				serviceName: serviceNameLabel,
				subscriptionName: subscriptionName ?? null,
				subscriptionDate: subscriptionDateStr,
				expiryDate: expiryDateStr,
				gracePeriodText,
			};

			const html = await renderServiceRenewalReminderEmail({
				serviceName: serviceNameLabel,
				subscriptionName: subscriptionName ?? undefined,
				subscriptionDate: subscriptionDateStr,
				expiryDate: expiryDateStr,
				gracePeriodText,
			});

			const subject = `Renewal reminder: ${subscriptionName ?? serviceNameLabel}`;
			const emailTo = recipients.to;
			const emailCc = recipients.cc;
			emailSnapshot = {
				to: emailTo,
				cc: emailCc.length > 0 ? emailCc : undefined,
				subject,
				html,
			};

			let sent: {
				id?: string;
				fromEmail?: string;
				fromName?: string;
				replyTo?: string | null;
			};
			let invoiceAttached = false;
			let pdfFilename: string | null = null;
			const ccArg = emailCc.length > 0 ? emailCc : undefined;

			if (invoiceResult.ok) {
				const pdf = await buildRenewalInvoicePdf(invoiceResult.invoiceId);
				pdfFilename = pdf.filename;
				emailSnapshot.invoiceId = invoiceResult.invoiceId;
				emailSnapshot.invoiceNumber = invoiceResult.invoiceNumber;
				emailSnapshot.attachmentFilename = pdf.filename;
				sent = await sendEmailWithPdf({
					to: emailTo,
					cc: ccArg,
					subject,
					html,
					attachmentFilename: pdf.filename,
					attachment: pdf.buffer,
				});
				invoiceAttached = true;
			} else {
				sent = await sendEmail({
					to: emailTo,
					cc: ccArg,
					subject,
					html,
				});
			}

			emailSnapshot = {
				...emailSnapshot,
				fromEmail: sent.fromEmail,
				fromName: sent.fromName,
				replyTo: sent.replyTo,
				sesMessageId: sent.id ?? null,
			};

			const sentAt = now.toISOString();
			const nextMetadata: SubMetadata = {
				...metadata,
				lastRenewalReminderAt: sentAt,
			};

			await db
				.update(niscClientSubscription)
				.set({
					metadata: nextMetadata,
					updatedAt: new Date(),
				})
				.where(eq(niscClientSubscription.id, row.id));

			if (actorId) {
				await db.insert(niscClientSubscriptionActivityLog).values({
					id: crypto.randomUUID(),
					subscriptionId: row.id,
					userId: actorId,
					action: "SEND_RENEWAL_REMINDER",
					description: `Sent renewal reminder email to ${emailToDisplay} (cron)`,
					metadata: {
						to: emailTo,
						cc: emailCc,
						recipientSource: recipients.source,
						subject,
						serviceName: serviceNameLabel,
						subscriptionName: subscriptionName ?? null,
						subscriptionDate: subscriptionDateStr,
						expiryDate: expiryDateStr,
						gracePeriodText,
						sentAt,
						source: opts.source ?? existing.source,
						automated: true,
						runId,
						sesMessageId: sent.id ?? null,
						invoiceId: invoiceResult.ok ? invoiceResult.invoiceId : null,
						invoiceNumber: invoiceResult.ok ? invoiceResult.invoiceNumber : null,
						invoiceAttached,
						attachmentFilename: pdfFilename,
					},
					ipAddress: null,
					userAgent: null,
				});
			}

			batch.sent += 1;
			itemRows.push({
				...baseItem,
				outcome: "sent",
				emailTo: emailToDisplay,
				subject,
				metadata: {
					sentAt,
					sesMessageId: sent.id ?? null,
					email: emailSnapshot,
					template,
					context,
					invoice: invoiceLog,
					invoiceAttached,
					recipientSource: recipients.source,
				},
			});
		} catch (err) {
			const error = err instanceof Error ? err.message : String(err);
			batch.failed += 1;
			batch.errors.push({ subscriptionId: row.id, error });
			itemRows.push({
				...baseItem,
				outcome: "failed",
				emailTo: emailToDisplay,
				subject: emailSnapshot?.subject ?? null,
				error,
				metadata: {
					detail: error,
					error: serializeUnknown(err),
					attemptedEmail: emailSnapshot,
					recipientSource: recipients.source,
					context,
					invoice: invoiceLog,
				},
			});
			console.error(
				`[subscription-renewal-reminders] failed for ${row.id}:`,
				err,
			);
		}
	}

	if (itemRows.length > 0) {
		await db.insert(agencyCronJobRunItem).values(itemRows);
	}

	const totals = {
		scanned: existing.scanned + batch.scanned,
		sent: existing.sent + batch.sent,
		skipped: existing.skipped + batch.skipped,
		failed: existing.failed + batch.failed,
	};
	const heartbeat = new Date();

	if (batch.hasMore) {
		await db
			.update(agencyCronJobRun)
			.set({
				status: "running",
				scanned: totals.scanned,
				sent: totals.sent,
				skipped: totals.skipped,
				failed: totals.failed,
				currentOffset: batch.nextOffset,
				batchCount: existing.batchCount + 1,
				heartbeatAt: heartbeat,
				summary: `${buildSummary(totals)} (continuing…)`,
			})
			.where(eq(agencyCronJobRun.id, runId));

		return { ...batch, status: "running" };
	}

	const finalStatus =
		totals.failed > 0 && totals.sent === 0 && totals.skipped === 0
			? "failed"
			: totals.failed > 0
				? "partial"
				: "completed";

	await db
		.update(agencyCronJobRun)
		.set({
			status: finalStatus,
			scanned: totals.scanned,
			sent: totals.sent,
			skipped: totals.skipped,
			failed: totals.failed,
			currentOffset: batch.nextOffset,
			batchCount: existing.batchCount + 1,
			heartbeatAt: heartbeat,
			finishedAt: heartbeat,
			summary: buildSummary(totals),
			lastError:
				batch.errors.length > 0
					? batch.errors.map((e) => `${e.subscriptionId}: ${e.error}`).join("; ").slice(0, 2000)
					: null,
		})
		.where(eq(agencyCronJobRun.id, runId));

	return { ...batch, status: finalStatus };
}

async function fetchSubscriptionsForCron(
	dueDateExpr: ReturnType<typeof sql>,
	limit: number,
	offset: number,
) {
	return db
		.select({
			id: niscClientSubscription.id,
			name: niscClientSubscription.name,
			status: niscClientSubscription.status,
			teamId: niscClientSubscription.teamId,
			userId: niscClientSubscription.userId,
			recordedBy: niscClientSubscription.recordedBy,
			subscribedBy: niscClientSubscription.subscribedBy,
			subscriptionDate: niscClientSubscription.subscriptionDate,
			expiryDate: niscClientSubscription.expiryDate,
			nextRenewalDate: niscClientSubscription.nextRenewalDate,
			billingCycle: niscClientSubscription.billingCycle,
			agreedPrice: niscClientSubscription.agreedPrice,
			agreedCurrency: niscClientSubscription.agreedCurrency,
			productId: niscClientSubscription.productId,
			primaryDomain: niscClientSubscription.primaryDomain,
			metadata: niscClientSubscription.metadata,
			productName: niscProduct.name,
			serviceType: niscProduct.serviceType,
			planName: niscProductPlan.name,
			billingEmail: teamBillingSettings.billingEmail,
		})
		.from(niscClientSubscription)
		.innerJoin(niscProduct, eq(niscProduct.id, niscClientSubscription.productId))
		.leftJoin(
			niscProductPlan,
			eq(niscProductPlan.id, niscClientSubscription.productPlanId),
		)
		.leftJoin(
			teamBillingSettings,
			eq(teamBillingSettings.teamId, niscClientSubscription.teamId),
		)
		.orderBy(sql`${dueDateExpr} ASC NULLS LAST`, asc(niscClientSubscription.id))
		.limit(limit)
		.offset(offset);
}

export async function markRenewalReminderContinuationFailed(
	runId: string,
	error: string,
) {
	await markRunFailed(runId, `Continuation enqueue failed: ${error}`);
}

export async function attachQstashMessageId(runId: string, messageId: string) {
	await db
		.update(agencyCronJobRun)
		.set({ qstashMessageId: messageId, heartbeatAt: new Date() })
		.where(eq(agencyCronJobRun.id, runId));
}
