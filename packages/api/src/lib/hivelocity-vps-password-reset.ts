/**
 * Hivelocity VPS root password reset helpers.
 *
 * Official flow (developers.hivelocity.net):
 * - POST /vps/{deviceId}/reset-password - emails a token to the account email; no token in documented response.
 * - PUT  /vps/{deviceId}/reset-password - body { token }; VPS must be powered off.
 * - New password appears on the device in my.hivelocity ~5–10 min; GET /device/{deviceId}/initial-creds may return it.
 */

export function extractVpsResetTokenFromResponse(raw: unknown): string | null {
	if (!raw || typeof raw !== "object") return null;
	const obj = raw as Record<string, unknown>;
	for (const key of ["token", "resetToken", "reset_token", "verificationToken", "code"]) {
		const value = obj[key];
		if (typeof value === "string" && value.trim()) return value.trim();
	}
	return null;
}

export type VpsPasswordResetRequestResult = {
	tokenDispatched: true;
	/** Only if Hivelocity includes it in the response body (not in published OpenAPI). */
	token: string | null;
};

export function normalizeVpsPasswordResetRequestResult(raw: unknown): VpsPasswordResetRequestResult {
	return {
		tokenDispatched: true,
		token: extractVpsResetTokenFromResponse(raw),
	};
}
