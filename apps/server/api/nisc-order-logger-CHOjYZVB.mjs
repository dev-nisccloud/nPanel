
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __path_dirname } from 'node:path';
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __path_dirname(__filename);

import { ft as niscOrderProcessingLog, t as db } from "./src-DdNUZRe_.mjs";
import { randomUUID } from "node:crypto";

//#region ../../packages/api/src/lib/nisc-order-logger.ts
/**
* Structured logging for NISC order processing (QStash worker).
* - Console: prefixed with [NISC] for Vercel/hosting log aggregation.
* - DB: when niscOrderId is in payload, writes to NiscOrderProcessingLog for debugging in the order view.
*/
const PREFIX = "[NISC]";
/**
* Log a processing step. Logs to console and, when niscOrderId is present, persists to DB.
* DB write failures are caught so the main flow is never broken.
*/
async function niscLog(step, payload) {
	const line = `${PREFIX} ${step} ${JSON.stringify(payload)}`;
	console.log(line);
	const niscOrderId = typeof payload.niscOrderId === "string" && payload.niscOrderId.length > 0 ? payload.niscOrderId : null;
	if (!niscOrderId) return;
	try {
		await db.insert(niscOrderProcessingLog).values({
			id: randomUUID(),
			niscOrderId,
			step,
			payload
		});
	} catch (err) {
		console.error(`${PREFIX} Failed to write processing log:`, err);
	}
}

//#endregion
export { niscLog as t };