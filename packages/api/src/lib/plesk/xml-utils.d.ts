export declare function escapeXml(str: string): string;
export declare function asArray<T>(value: T | T[] | undefined | null): T[];
export declare function normalizePleskPacket(value: unknown): Record<string, unknown>;
export declare function pleskXmlScalar(value: unknown): string | undefined;
export declare function pleskXmlInt(value: unknown): number | undefined;
export declare function parsePleskXml(xml: string): Record<string, unknown>;
export declare function sendPleskXmlOrThrow(xmlRequest: string): Promise<{
    xml: string;
    parsed: Record<string, unknown>;
}>;
export declare function pleskOperationError(result: Record<string, unknown> | undefined, fallback: string): {
    error: string;
    code?: string;
} | null;
