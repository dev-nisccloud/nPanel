export declare function sanitizeHotlinkDomains(domains: string[]): string[];
export declare function sanitizeHotlinkExtensions(extensions: string[]): string[];
/** WP Toolkit expects fileExtensions as array of arrays in some responses */
export declare function toHotlinkPutBody(domains: string[], fileExtensions: string[]): {
    domains: string[];
    fileExtensions: string[][];
};
