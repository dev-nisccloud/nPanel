/**
 * Assign Starter subscription + welcome tokens to the team the customer created at sign-up.
 * One grant per customer lifetime; no order or invoice.
 */
export declare function provisionZeepoCustomerSignupWelcome(params: {
    userId: string;
    /** The team created in this sign-up / create-team flow. */
    teamId: string;
    userRole: string | null | undefined;
}): Promise<{
    subscriptionId: string;
} | null>;
