/**
 * Nisc Payment Gateway - tRPC Router (Agency Side)
 * 
 * SECURITY: Requires authentication (protectedProcedure)
 * ACCESS CONTROL: Team-based permissions (only team members can manage their merchants)
 * 
 * ENDPOINTS:
 * - Merchant Management (create, list, update, suspend)
 * - Credentials Management (add, update, verify)
 * - API Keys Management (create, list, revoke)
 * - Transaction Logs (list, details)
 * - Request Logs (list, filter)
 * - Access Logs (analytics, billing)
 */

import { router } from "../..";
import { merchantsRouter } from "./merchants";
import { credentialsRouter } from "./credentials";
import { apiKeysRouter as gatewayApiKeysRouter } from "./api-keys";
import { transactionsRouter } from "./transactions";
import { requestLogsRouter } from "./request-logs";
import { accessLogsRouter } from "./access-logs";

/**
 * Nisc Payment Gateway Router (Agency Side)
 * 
 * STRUCTURE:
 * - niscPaymentGateway.merchants.*
 * - niscPaymentGateway.credentials.*
 * - niscPaymentGateway.apiKeys.*
 * - niscPaymentGateway.transactions.*
 * - niscPaymentGateway.requestLogs.*
 * - niscPaymentGateway.accessLogs.*
 */
export const niscPaymentGatewayRouter = router({
  merchants: merchantsRouter,
  credentials: credentialsRouter,
  apiKeys: gatewayApiKeysRouter,
  transactions: transactionsRouter,
  requestLogs: requestLogsRouter,
  accessLogs: accessLogsRouter,
});
