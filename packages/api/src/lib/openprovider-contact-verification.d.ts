import { type OpenProviderCallbackResult, type OpenProviderCallbackStatus } from "./openprovider-callback-response";
export type ContactEmailVerificationStatus = OpenProviderCallbackStatus;
export type ContactEmailVerificationResult = OpenProviderCallbackResult;
/** Parse OpenProvider callback body, e.g. `status=Ok; message= Email address has been verified.` */
export declare function parseOpenProviderVerificationResponse(raw: string): ContactEmailVerificationResult;
/** Relay approve/reject to OpenProvider's ICANN contact verification callback. */
export declare function submitContactEmailVerification(params: {
    email: string;
    authCode: string;
    approve: "yes" | "no";
}): Promise<ContactEmailVerificationResult>;
