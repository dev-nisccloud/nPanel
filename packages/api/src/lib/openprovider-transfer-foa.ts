import {
	parseOpenProviderCallbackResponse,
	type OpenProviderCallbackResult,
} from "./openprovider-callback-response";

const OPENPROVIDER_TRANSFER_FOA_CALLBACK_URL =
	"https://cp.openprovider.eu/misc.php/domain/transferCallback/";

/** Relay approve/decline to OpenProvider's ICANN FOA transfer confirmation callback. */
export async function submitTransferFoaConfirmation(params: {
	domainId: string;
	authCode: string;
	approve: "yes" | "no";
}): Promise<OpenProviderCallbackResult> {
	const url = new URL(OPENPROVIDER_TRANSFER_FOA_CALLBACK_URL);
	url.searchParams.set("domainId", params.domainId);
	url.searchParams.set("authCode", params.authCode);
	url.searchParams.set("approve", params.approve);

	const response = await fetch(url.toString(), {
		method: "GET",
		headers: { Accept: "text/plain" },
	});

	if (!response.ok) {
		throw new Error(
			`Transfer confirmation service unavailable (${response.status}). Please try again later.`,
		);
	}

	const body = await response.text();
	return parseOpenProviderCallbackResponse(
		body,
		"Unable to process transfer confirmation. Please try again or contact support.",
	);
}
