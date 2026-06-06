import { parseOpenProviderCallbackResponse, } from "./openprovider-callback-response";
const OPENPROVIDER_EMAIL_VERIFICATION_CALLBACK_URL = "https://cp.openprovider.eu/misc.php/email/emailVerificationCallback/";
/** Parse OpenProvider callback body, e.g. `status=Ok; message= Email address has been verified.` */
export function parseOpenProviderVerificationResponse(raw) {
    return parseOpenProviderCallbackResponse(raw, "Unable to process verification. Please try again or contact support.");
}
/** Relay approve/reject to OpenProvider's ICANN contact verification callback. */
export async function submitContactEmailVerification(params) {
    const url = new URL(OPENPROVIDER_EMAIL_VERIFICATION_CALLBACK_URL);
    url.searchParams.set("email", params.email);
    url.searchParams.set("authCode", params.authCode);
    url.searchParams.set("approve", params.approve);
    const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "text/plain" },
    });
    if (!response.ok) {
        throw new Error(`Verification service unavailable (${response.status}). Please try again later.`);
    }
    const body = await response.text();
    return parseOpenProviderVerificationResponse(body);
}
