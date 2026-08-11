/**
 * Uniquify duplicate nisc_order.payment_transaction_id values so the partial
 * unique index can apply — without deleting orders or nulling payment links.
 *
 * Strategy (live-safe):
 * - Keep the oldest order per payment_transaction_id linked to the original payment.
 * - For each newer duplicate: clone the payment_transaction with a new id, point
 *   the order at the clone, and record the original payment id in order metadata.
 *
 * Usage:
 *   bun run src/scripts/dedupe-nisc-order-payment-tx.ts
 *   DOTENV_PATH=../../apps/server/.env.production bun run src/scripts/dedupe-nisc-order-payment-tx.ts
 */
import dotenv from "dotenv";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

const envPath =
	process.env.DOTENV_PATH ??
	resolve(import.meta.dir, "../../../../apps/server/.env");

if (!process.env.DATABASE_URL) {
	dotenv.config({ path: envPath });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error("DATABASE_URL is not set.");
	process.exit(1);
}

try {
	const { hostname, port } = new URL(databaseUrl.replace(/^postgresql:/, "http:"));
	console.log(`Deduping against ${hostname}:${port || "5432"}`);
	console.log(`Env file: ${envPath}`);
} catch {
	console.log("Deduping (could not parse DATABASE_URL host)");
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });

type DupRow = {
	order_id: string;
	order_number: string;
	payment_transaction_id: string;
	rn: number;
};

try {
	const dupResult = await pool.query<DupRow>(`
		WITH ranked AS (
			SELECT
				id AS order_id,
				order_number,
				payment_transaction_id,
				ROW_NUMBER() OVER (
					PARTITION BY payment_transaction_id
					ORDER BY created_at ASC, id ASC
				) AS rn
			FROM nisc_order
			WHERE payment_transaction_id IS NOT NULL
		)
		SELECT order_id, order_number, payment_transaction_id, rn
		FROM ranked
		WHERE rn > 1
		ORDER BY payment_transaction_id, rn
	`);

	const dups = dupResult.rows;
	if (dups.length === 0) {
		console.log("No duplicate payment_transaction_id links found.");
		process.exit(0);
	}

	console.log(`Found ${dups.length} duplicate order link(s) to uniquify.`);

	for (const dup of dups) {
		const client = await pool.connect();
		try {
			await client.query("BEGIN");

			const payResult = await client.query(`SELECT * FROM payment_transaction WHERE _id = $1 LIMIT 1`, [
				dup.payment_transaction_id,
			]);
			const original = payResult.rows[0] as Record<string, unknown> | undefined;
			if (!original) {
				console.warn(
					`  ! ${dup.order_number}: original payment ${dup.payment_transaction_id} missing — skipping`,
				);
				await client.query("ROLLBACK");
				continue;
			}

			const newPaymentId = randomUUID();
			const now = new Date();
			const originalCheckout =
				typeof original.checkout_request_id === "string" ? original.checkout_request_id : null;
			const cloneCheckoutId = originalCheckout
				? `${originalCheckout}-dup-${dup.order_id.slice(0, 8)}`
				: `dup-${dup.order_id.slice(0, 8)}-${newPaymentId.slice(0, 8)}`;

			const originalMeta =
				original.metadata && typeof original.metadata === "object" && !Array.isArray(original.metadata)
					? (original.metadata as Record<string, unknown>)
					: {};

			await client.query(
				`INSERT INTO payment_transaction (
					_id, user_id, team_id, gateway, gateway_status, gateway_message,
					gateway_transaction_id, merchant_request_id, checkout_request_id,
					receipt_number, amount, paid_amount, currency, account_reference,
					transaction_desc, phone_number, status, raw_response, raw_error,
					initiated_at, processed_at, failed_at, refunded_at, notes, metadata,
					created_at, updated_at
				) VALUES (
					$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
					$20,$21,$22,$23,$24,$25,$26,$27
				)`,
				[
					newPaymentId,
					original.user_id,
					original.team_id,
					original.gateway,
					original.gateway_status,
					original.gateway_message,
					original.gateway_transaction_id,
					original.merchant_request_id,
					cloneCheckoutId,
					original.receipt_number,
					original.amount,
					original.paid_amount,
					original.currency,
					original.account_reference,
					original.transaction_desc,
					original.phone_number,
					original.status,
					original.raw_response,
					original.raw_error,
					original.initiated_at,
					original.processed_at,
					original.failed_at,
					original.refunded_at,
					original.notes,
					JSON.stringify({
						...originalMeta,
						clonedFromPaymentTransactionId: original._id,
						clonedForNiscOrderId: dup.order_id,
						clonedAt: now.toISOString(),
						reason: "uniquify_nisc_order_payment_transaction_id",
					}),
					original.created_at,
					now,
				],
			);

			await client.query(
				`UPDATE nisc_order
				 SET
					payment_transaction_id = $1,
					metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
					updated_at = $3
				 WHERE id = $4`,
				[
					newPaymentId,
					JSON.stringify({
						originalPaymentTransactionId: original._id,
						paymentTransactionIdUniquifiedAt: now.toISOString(),
						paymentTransactionIdUniquifyReason:
							"duplicate_payment_link_before_unique_index",
					}),
					now,
					dup.order_id,
				],
			);

			await client.query("COMMIT");
			console.log(
				`  ✓ ${dup.order_number}: payment ${String(original._id)} → clone ${newPaymentId}`,
			);
		} catch (err) {
			await client.query("ROLLBACK");
			throw err;
		} finally {
			client.release();
		}
	}

	console.log("Done uniquifying duplicate payment links.");
} catch (error) {
	console.error("Dedupe failed:");
	console.error(error);
	process.exit(1);
} finally {
	await pool.end();
}
