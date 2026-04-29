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
