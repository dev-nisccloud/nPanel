import { and, asc, db, desc, eq, inArray, isNotNull, isNull, lte, ne, or, sql } from "@npanel/db";
import {
	AGENCY_CRON_JOB_KEYS,
	agencyCronJobRun,
	agencyCronJobRunItem,
} from "@npanel/db/schema/agency-cron-jobs";
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
	buildRenewalInvoicePdf,
	ensureSubscriptionRenewalInvoice,
	serializeRenewalInvoiceResult,
	type RenewalInvoiceEnsureResult,
} from "./subscription-renewal-invoice";

/** Subscriptions with expiry (or next renewal) on/before this many days from now are reminded. */
export const RENEWAL_REMINDER_WINDOW_DAYS = 7;

/** Skip re-sending if a cron/manual reminder was sent within this window. */
export const RENEWAL_REMINDER_DEDUPE_HOURS = 23;

/** Treat RUNNING runs with no heartbeat older than this as stale. */
export const RENEWAL_REMINDER_STALE_MS = 15 * 60 * 1000;

const ELIGIBLE_STATUSES = ["ACTIVE", "PENDING", "EXPIRED", "SUSPENDED"] as const;

const BATCH_DEFAULT = 25;

export const SUBSCRIPTION_RENEWAL_REMINDERS_JOB_KEY =
	AGENCY_CRON_JOB_KEYS.SUBSCRIPTION_RENEWAL_REMINDERS;

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

type DueSubscriptionRow = Awaited<ReturnType<typeof fetchDueSubscriptions>>[number];

type ItemEmailSnapshot = {
	to: string;
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

function wasRemindedRecently(metadata: SubMetadata, now: Date): boolean {
	const raw = metadata.lastRenewalReminderAt;
	if (!raw || typeof raw !== "string") return false;
	const at = new Date(raw);
	if (Number.isNaN(at.getTime())) return false;
	const ageMs = now.getTime() - at.getTime();
	return ageMs >= 0 && ageMs < RENEWAL_REMINDER_DEDUPE_HOURS * 60 * 60 * 1000;
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
 * Scan client subscriptions that are expired or due within {@link RENEWAL_REMINDER_WINDOW_DAYS}
 * and send renewal reminder emails to team billing addresses.
 * Persists run + per-subscription item logs.
 */
export async function processSubscriptionRenewalReminders(
	opts: SubscriptionRenewalRemindersPayload = {},
): Promise<SubscriptionRenewalRemindersResult> {
	const offset = Math.max(0, opts.offset ?? 0);
	const limit = Math.min(200, Math.max(1, opts.limit ?? BATCH_DEFAULT));
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

	let rows: Awaited<ReturnType<typeof fetchDueSubscriptions>>;
	try {
		rows = await fetchDueSubscriptions(dueDateExpr, windowEnd, limit, offset);
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
		const due = row.expiryDate ?? row.nextRenewalDate;
		const lastReminderAt =
			typeof metadata.lastRenewalReminderAt === "string"
				? metadata.lastRenewalReminderAt
				: undefined;
		const context = itemContext(row, due, now, lastReminderAt);
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
			expiryDate: due ?? null,
		};

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

		if (!row.billingEmail?.trim()) {
			const skipReason = "no_billing_email";
			const detail =
				"Skipped: team billing email is missing. No reminder was sent.";
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

		if (wasRemindedRecently(metadata, now)) {
			const skipReason = "recently_reminded";
			const hoursAgo = hoursSince(lastReminderAt, now);
			const detail = `Skipped: already reminded at ${lastReminderAt ?? "unknown"}${
				hoursAgo != null ? ` (${hoursAgo.toFixed(1)}h ago)` : ""
			}. Dedupe window is ${RENEWAL_REMINDER_DEDUPE_HOURS} hours.`;
			batch.skipped += 1;
			itemRows.push({
				...baseItem,
				outcome: "skipped",
				skipReason,
				emailTo: row.billingEmail.trim(),
				metadata: {
					detail,
					skipReason,
					lastRenewalReminderAt: lastReminderAt ?? null,
					hoursSinceLastReminder: hoursAgo,
					dedupeHours: RENEWAL_REMINDER_DEDUPE_HOURS,
					context,
					invoice: invoiceLog,
				},
			});
			continue;
		}

		if (!due) {
			const skipReason = "no_due_date";
			const detail =
				"Skipped: subscription has neither expiryDate nor nextRenewalDate.";
			batch.skipped += 1;
			itemRows.push({
				...baseItem,
				outcome: "skipped",
				skipReason,
				emailTo: row.billingEmail.trim(),
				metadata: {
					detail,
					skipReason,
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
			const emailTo = row.billingEmail.trim();
			emailSnapshot = { to: emailTo, subject, html };

			let sent: {
				id?: string;
				fromEmail?: string;
				fromName?: string;
				replyTo?: string | null;
			};
			let invoiceAttached = false;
			let pdfFilename: string | null = null;

			if (invoiceResult.ok) {
				const pdf = await buildRenewalInvoicePdf(invoiceResult.invoiceId);
				pdfFilename = pdf.filename;
				emailSnapshot.invoiceId = invoiceResult.invoiceId;
				emailSnapshot.invoiceNumber = invoiceResult.invoiceNumber;
				emailSnapshot.attachmentFilename = pdf.filename;
				sent = await sendEmailWithPdf({
					to: emailTo,
					subject,
					html,
					attachmentFilename: pdf.filename,
					attachment: pdf.buffer,
				});
				invoiceAttached = true;
			} else {
				sent = await sendEmail({
					to: emailTo,
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
					description: `Sent renewal reminder email to ${emailTo} (cron)`,
					metadata: {
						to: emailTo,
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
				emailTo,
				subject,
				metadata: {
					sentAt,
					sesMessageId: sent.id ?? null,
					email: emailSnapshot,
					template,
					context,
					invoice: invoiceLog,
					invoiceAttached,
				},
			});
		} catch (err) {
			const error = err instanceof Error ? err.message : String(err);
			batch.failed += 1;
			batch.errors.push({ subscriptionId: row.id, error });
			itemRows.push({
				...baseItem,
				outcome: "failed",
				emailTo: row.billingEmail.trim(),
				subject: emailSnapshot?.subject ?? null,
				error,
				metadata: {
					detail: error,
					error: serializeUnknown(err),
					attemptedEmail: emailSnapshot,
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

async function fetchDueSubscriptions(
	dueDateExpr: ReturnType<typeof sql>,
	windowEnd: Date,
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
		.where(
			and(
				inArray(niscClientSubscription.status, [...ELIGIBLE_STATUSES]),
				or(
					isNull(niscClientSubscription.billingCycle),
					ne(niscClientSubscription.billingCycle, "ONE_TIME"),
				),
				or(
					isNotNull(niscClientSubscription.expiryDate),
					isNotNull(niscClientSubscription.nextRenewalDate),
				),
				lte(dueDateExpr, windowEnd),
			),
		)
		.orderBy(asc(dueDateExpr), asc(niscClientSubscription.id))
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
