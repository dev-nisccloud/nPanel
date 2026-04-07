import { Resend } from "resend";
export declare function getResendClient(): Resend;
/**
 * Resend API Error wrapper
 */
export declare class ResendApiError extends Error {
    statusCode: number;
    message: string;
    cause?: unknown | undefined;
    constructor(statusCode: number, message: string, cause?: unknown | undefined);
}
/**
 * Handle Resend API errors consistently
 */
export declare function handleResendError(error: unknown): never;
