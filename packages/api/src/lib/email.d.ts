/**
 * Send a transactional email via AWS SES.
 * Retries on transient (non-permanent) failures with exponential back-off.
 */
export declare function sendEmail({ to, subject, html, text, cc, bcc, maxRetries, }: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    /** Note: attachments are not supported with SES raw email in this helper. */
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
    cc?: string[];
    bcc?: string[];
    maxRetries?: number;
}): Promise<{
    id: string | undefined;
}>;
/**
 * Send HTML email with a single PDF attachment via AWS SES raw MIME.
 */
export declare function sendEmailWithPdf({ to, subject, html, attachmentFilename, attachment, cc, bcc, maxRetries, }: {
    to: string;
    subject: string;
    html: string;
    attachmentFilename: string;
    attachment: Buffer;
    cc?: string[];
    bcc?: string[];
    maxRetries?: number;
}): Promise<{
    id: string | undefined;
}>;
/**
 * Send multiple emails sequentially (rate-limiting friendly).
 * Never throws - returns per-email success/failure so callers can handle individually.
 */
export declare function sendEmailBatch(emails: Array<{
    to: string;
    subject: string;
    html?: string;
    text?: string;
    cc?: string[];
}>, delayBetweenEmails?: number): Promise<Array<{
    success: boolean;
    email: string;
    error?: string;
}>>;
