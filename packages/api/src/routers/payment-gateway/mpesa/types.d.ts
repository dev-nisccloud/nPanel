import { z } from "zod";
/**
 * M-Pesa environment configuration
 */
export type MpesaEnvironment = "sandbox" | "live";
/**
 * M-Pesa API configuration
 */
export interface MpesaConfig {
    consumerKey: string;
    consumerSecret: string;
    shortcode: string;
    passkey: string;
    partyB: string;
    transactionType: "CustomerPayBillOnline" | "CustomerBuyGoodsOnline";
    accountReference?: string;
    environment: MpesaEnvironment;
    callbackUrl: string;
}
/**
 * STK Push request parameters
 */
export declare const StkPushRequestSchema: z.ZodObject<{
    phoneNumber: z.ZodString;
    amount: z.ZodNumber;
    accountReference: z.ZodString;
    transactionDesc: z.ZodOptional<z.ZodString>;
    callbackUrl: z.ZodOptional<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
    checkoutTotalIncVat: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type StkPushRequest = z.infer<typeof StkPushRequestSchema>;
/**
 * STK Push Query request parameters
 */
export declare const StkPushQueryRequestSchema: z.ZodObject<{
    checkoutRequestId: z.ZodString;
}, z.core.$strip>;
export type StkPushQueryRequest = z.infer<typeof StkPushQueryRequestSchema>;
/**
 * M-Pesa OAuth token response
 */
export interface MpesaTokenResponse {
    access_token: string;
    expires_in: string;
}
/**
 * M-Pesa STK Push response
 */
export interface MpesaStkPushResponse {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
}
/**
 * M-Pesa STK Push Query response
 */
export interface MpesaStkPushQueryResponse {
    ResponseCode: string;
    ResponseDescription: string;
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResultCode: string;
    ResultDesc: string;
}
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
export declare const MpesaCallbackSchema: z.ZodObject<{
    Body: z.ZodObject<{
        stkCallback: z.ZodObject<{
            MerchantRequestID: z.ZodString;
            CheckoutRequestID: z.ZodString;
            ResultCode: z.ZodPipe<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>, z.ZodTransform<number, string | number>>;
            ResultDesc: z.ZodString;
            CallbackMetadata: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                Item: z.ZodArray<z.ZodObject<{
                    Name: z.ZodString;
                    Value: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                }, z.core.$strip>>;
            }, z.core.$strip>>>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type MpesaCallback = z.infer<typeof MpesaCallbackSchema>;
/**
 * Parsed callback metadata
 */
export interface ParsedCallbackMetadata {
    amount?: number;
    mpesaReceiptNumber?: string;
    transactionDate?: string;
    phoneNumber?: string;
    balance?: number;
}
