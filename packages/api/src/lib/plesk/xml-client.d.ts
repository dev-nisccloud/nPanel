interface PleskXmlResult {
    xml: string | null;
    isAuthError: boolean;
    isHostUnreachable: boolean;
}
export declare function sendPleskXmlRequest(xmlPayload: string): Promise<PleskXmlResult>;
export {};
