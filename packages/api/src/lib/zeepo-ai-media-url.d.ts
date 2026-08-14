/** data: URLs are allowed for in-browser masks (base64), not for remote SSRF. */
export declare function isZeepoAiDataImageUrl(url: string): boolean;
export declare function isAllowedZeepoAiMediaUrl(url: string): boolean;
export declare function assertAllowedZeepoAiMediaUrl(url: string, label?: string): void;
