export type OpenProviderCallbackStatus = "Ok" | "Rejected" | "Error";

export type OpenProviderCallbackResult = {
	status: OpenProviderCallbackStatus;
	message: string;
};

/** Parse OpenProvider misc.php callback body, e.g. `status=Ok; message= ...` */
export function parseOpenProviderCallbackResponse(
	raw: string,
	fallbackMessage: string,
): OpenProviderCallbackResult {
	const pairs: Record<string, string> = {};

	for (const part of raw.split(";")) {
		const trimmed = part.trim();
		if (!trimmed) continue;

		const eqIndex = trimmed.indexOf("=");
		if (eqIndex === -1) continue;

		const key = trimmed.slice(0, eqIndex).trim();
		const value = trimmed.slice(eqIndex + 1).trim();
		pairs[key] = value;
	}

	const status = (pairs.status ?? "Error") as OpenProviderCallbackStatus;
	const message = pairs.message?.trim() || fallbackMessage;

	return { status, message };
}
