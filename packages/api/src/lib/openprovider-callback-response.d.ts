export type OpenProviderCallbackStatus = "Ok" | "Rejected" | "Error";
export type OpenProviderCallbackResult = {
    status: OpenProviderCallbackStatus;
    message: string;
};
/** Parse OpenProvider misc.php callback body, e.g. `status=Ok; message= ...` */
export declare function parseOpenProviderCallbackResponse(raw: string, fallbackMessage: string): OpenProviderCallbackResult;
