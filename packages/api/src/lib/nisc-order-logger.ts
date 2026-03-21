/**
 * Structured logging for NISC order processing (QStash worker).
 * - Console: prefixed with [NISC] for Vercel/hosting log aggregation.
 * - DB: when niscOrderId is in payload, writes to NiscOrderProcessingLog for debugging in the order view.
 */
import { db } from "@npanel/db";
import { niscOrderProcessingLog } from "@npanel/db/schema/nisc-orders";
import { randomUUID } from "node:crypto";

const PREFIX = "[NISC]";

export type NiscLogPayload = Record<string, unknown> & {
	niscOrderId?: string;
	orderItemId?: string;
};

/**
 * Log a processing step. Logs to console and, when niscOrderId is present, persists to DB.
 * DB write failures are caught so the main flow is never broken.
 */
export async function niscLog(step: string, payload: NiscLogPayload): Promise<void> {
	const line = `${PREFIX} ${step} ${JSON.stringify(payload)}`;
	// eslint-disable-next-line no-console -- intentional: worker logs for QStash/Vercel
	console.log(line);

	const niscOrderId =
		typeof payload.niscOrderId === "string" && payload.niscOrderId.length > 0
			? payload.niscOrderId
			: null;
	if (!niscOrderId) return;

	try {
		await db.insert(niscOrderProcessingLog).values({
			id: randomUUID(),
			niscOrderId,
			step,
			payload: payload as object,
		});
	} catch (err) {
		// Do not fail order processing if log write fails
		// eslint-disable-next-line no-console -- intentional
		console.error(`${PREFIX} Failed to write processing log:`, err);
	}
}
