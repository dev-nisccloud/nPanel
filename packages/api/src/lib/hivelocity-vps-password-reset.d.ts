/**
 * Hivelocity VPS root password reset helpers.
 *
 * Official flow (developers.hivelocity.net):
 * - POST /vps/{deviceId}/reset-password — emails a token to the account email; no token in documented response.
 * - PUT  /vps/{deviceId}/reset-password — body { token }; VPS must be powered off.
 * - New password appears on the device in my.hivelocity ~5–10 min; GET /device/{deviceId}/initial-creds may return it.
 */
export declare function extractVpsResetTokenFromResponse(raw: unknown): string | null;
export type VpsPasswordResetRequestResult = {
    tokenDispatched: true;
    /** Only if Hivelocity includes it in the response body (not in published OpenAPI). */
    token: string | null;
};
export declare function normalizeVpsPasswordResetRequestResult(raw: unknown): VpsPasswordResetRequestResult;
