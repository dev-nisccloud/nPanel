import { Resend } from "resend";
/**
 * Get or create Resend client instance (lazy initialization)
 * This prevents initialization during build time when env vars may not be available
 */
let resendClient = null;
export function getResendClient() {
    if (!resendClient) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error("RESEND_API_KEY environment variable is not set");
        }
        resendClient = new Resend(apiKey);
    }
    return resendClient;
}
/**
 * Resend API Error wrapper
 */
export class ResendApiError extends Error {
    statusCode;
    message;
    cause;
    constructor(statusCode, message, cause) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.cause = cause;
        this.name = "ResendApiError";
    }
}
/**
 * Handle Resend API errors consistently
 */
export function handleResendError(error) {
    if (error instanceof ResendApiError) {
        throw error;
    }
    const err = error;
    throw new ResendApiError(err.statusCode ?? 500, err.message ?? "Unknown Resend API error", error);
}
