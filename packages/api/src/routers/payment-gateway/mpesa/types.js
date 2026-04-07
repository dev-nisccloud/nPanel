import { z } from "zod";
/**
 * STK Push request parameters
 */
export const StkPushRequestSchema = z.object({
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    amount: z.number().positive("Amount must be positive").min(1, "Amount must be at least 1"),
    accountReference: z
        .string()
        .min(1, "Account reference is required")
        .max(12, "Account reference must be at most 12 characters")
        .regex(/^[a-zA-Z0-9]+$/, "Account reference must be alphanumeric only"), // Max 12 chars, alphanumeric
    transactionDesc: z
        .string()
        .max(13, "Transaction description must be at most 13 characters")
        .optional(), // Max 13 chars
    callbackUrl: z.string().url("Invalid callback URL").optional(),
    teamId: z.string().optional(), // Optional team ID for team payments
});
/**
 * STK Push Query request parameters
 */
export const StkPushQueryRequestSchema = z.object({
    checkoutRequestId: z.string().min(1, "Checkout Request ID is required"),
});
/**
 * M-Pesa callback payload (STK Push result)
 *
 * M-Pesa sends callbacks in this structure:
 * {
 *   Body: {
 *     stkCallback: {
 *       MerchantRequestID: string,
 *       CheckoutRequestID: string,
 *       ResultCode: number,
 *       ResultDesc: string,
 *       CallbackMetadata?: {
 *         Item: Array<{ Name: string, Value: string | number }>
 *       }
 *     }
 *   }
 * }
 */
export const MpesaCallbackSchema = z.object({
    Body: z.object({
        stkCallback: z.object({
            MerchantRequestID: z.string(),
            CheckoutRequestID: z.string(),
            ResultCode: z.union([z.number(), z.string()]).transform((val) => {
                // Handle both string and number ResultCode
                return typeof val === "string" ? parseInt(val, 10) : val;
            }),
            ResultDesc: z.string(),
            CallbackMetadata: z
                .object({
                Item: z.array(z.object({
                    Name: z.string(),
                    Value: z.union([z.string(), z.number()]).optional(), // Value is optional (e.g., Balance may not have value)
                })),
            })
                .optional()
                .nullable(),
        }),
    }),
});
