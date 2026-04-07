import { z } from "zod";
import { MpesaCallbackSchema, type ParsedCallbackMetadata } from "./types";
/**
 * Parse M-Pesa callback metadata
 * Extracts useful information from the callback payload
 */
export declare function parseCallbackMetadata(items: Array<{
    Name: string;
    Value: string | number;
}>): ParsedCallbackMetadata;
/**
 * Validate M-Pesa callback payload
 *
 * Security: Validates the structure of the callback to ensure it's from M-Pesa
 */
export declare function validateMpesaCallback(payload: unknown): z.infer<typeof MpesaCallbackSchema>;
/**
 * Check if callback indicates successful payment
 */
export declare function isPaymentSuccessful(callback: z.infer<typeof MpesaCallbackSchema>): boolean;
/**
 * Get payment status from callback
 */
export declare function getPaymentStatus(callback: z.infer<typeof MpesaCallbackSchema>): {
    success: boolean;
    resultCode: number;
    resultDesc: string;
    resultCodeInfo?: {
        description: string;
        explanation: string;
    };
    metadata?: ParsedCallbackMetadata;
};
