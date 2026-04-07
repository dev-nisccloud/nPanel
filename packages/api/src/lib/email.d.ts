/**
 * Send an email with automatic retry on rate limit errors
 */
export declare function sendEmail({ to, subject, html, text, attachments, cc, bcc, maxRetries, }: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
    cc?: string[];
    bcc?: string[];
    maxRetries?: number;
}): Promise<import("resend").CreateEmailResponseSuccess>;
/**
 * Send multiple emails with rate limiting (sequential with delay)
 * Respects rate limits by sending emails one at a time with delays
 */
export declare function sendEmailBatch(emails: Array<{
    to: string;
    subject: string;
    html?: string;
    text?: string;
}>, delayBetweenEmails?: number): Promise<Array<{
    success: boolean;
    email: string;
    error?: string;
}>>;
