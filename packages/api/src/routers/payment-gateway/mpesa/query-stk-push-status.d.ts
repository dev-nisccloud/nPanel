export type StkPushQueryData = {
    responseCode: string;
    responseDescription: string;
    merchantRequestId: string;
    checkoutRequestId: string;
    resultCode: string;
    resultDesc?: string;
};
export type StkPushQueryResult = {
    success: true;
    data: StkPushQueryData;
};
/**
 * Daraja-first STK query scoped to a single user (storefront checkout).
 * Mirrors dashboard `paymentGateway.mpesa.queryStkPush` for instant UI feedback.
 */
export declare function queryStkPushForUser(checkoutRequestId: string, userId: string): Promise<StkPushQueryResult>;
