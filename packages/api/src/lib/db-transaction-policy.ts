/**
 * DB transaction guidelines for connection-pool health.
 *
 * - Keep transactions short: only DB reads/writes inside `db.transaction`.
 * - Call external APIs (Plesk, Hivelocity, SES, KENIC, etc.) outside transactions
 *   so pool connections are not held during network I/O.
 * - Prefer `Promise.all` for independent reads before opening a transaction.
 *
 * orders.ts already provisions to Plesk before the order insert transaction.
 * Follow that pattern for new provisioning / billing flows.
 */
export type DbTransactionCallback<T> = (tx: unknown) => Promise<T>;
