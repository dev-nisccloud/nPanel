/** Fast path for auth emails (verify, reset, MFA). Skips campaign/email tracking DB. */
export declare function sendAuthEmail(params: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    replyTo?: string | null;
}): Promise<{
    sesMessageId: string | null;
}>;
export declare function sendTransactionalEmail(params: {
    userId: string;
    teamId?: string | null;
    to: string;
    subject: string;
    html?: string;
    text?: string;
    replyTo?: string | null;
}): Promise<{
    emailId: `${string}-${string}-${string}-${string}-${string}`;
    sesMessageId: any;
}>;
