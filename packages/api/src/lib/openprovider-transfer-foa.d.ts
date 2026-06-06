import { type OpenProviderCallbackResult } from "./openprovider-callback-response";
/** Relay approve/decline to OpenProvider's ICANN FOA transfer confirmation callback. */
export declare function submitTransferFoaConfirmation(params: {
    domainId: string;
    authCode: string;
    approve: "yes" | "no";
}): Promise<OpenProviderCallbackResult>;
