export declare class CircuitOpenError extends Error {
    readonly circuitName: string;
    constructor(circuitName: string);
}
/** In-process circuit breaker for external HTTP/XML services (Plesk, etc.). */
export declare function withCircuitBreaker<T>(name: string, fn: () => Promise<T>): Promise<T>;
