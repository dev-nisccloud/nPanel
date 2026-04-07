import { Resend } from "resend";
/**
 * Helper function to delay execution
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Get or create Resend client instance (lazy initialization)
 * This prevents initialization during build time when env vars may not be available
 */
let resendClient = null;
function getResendClient() {
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
 * Send an email with automatic retry on rate limit errors
 */
export async function sendEmail({ to, subject, html, text, attachments, cc, bcc, maxRetries = 3, }) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Use the basic email sending approach without React components
            const emailData = {
                from: process.env.RESEND_FROM_EMAIL || "npanel <noreply@npanel.com>",
                to: [to],
                subject,
            };
            // Only add html or text if they exist
            if (html) {
                emailData.html = html;
            }
            if (text) {
                emailData.text = text;
            }
            if (cc?.length)
                emailData.cc = cc;
            if (bcc?.length)
                emailData.bcc = bcc;
            // Get Resend client (lazy initialization)
            const resend = getResendClient();
            // Ensure at least html or text is provided
            if (!emailData.html && !emailData.text) {
                throw new Error("Either html or text must be provided");
            }
            // Resend API requires attachment content as base64 string (Buffer is not serialized correctly in JSON)
            const normalizedAttachments = attachments && attachments.length > 0
                ? attachments.map((att) => ({
                    filename: att.filename,
                    content: typeof att.content === "string" ? att.content : att.content.toString("base64"),
                    ...(att.contentType && { contentType: att.contentType }),
                }))
                : undefined;
            // Build payload so attachments are always included when present (Resend expects content as base64 string)
            const emailPayload = {
                from: emailData.from,
                to: emailData.to,
                subject: emailData.subject,
                ...(emailData.html && { html: emailData.html }),
                ...(emailData.text && { text: emailData.text }),
                ...(cc && cc.length > 0 && { cc }),
                ...(bcc && bcc.length > 0 && { bcc }),
                ...(normalizedAttachments && normalizedAttachments.length > 0 && { attachments: normalizedAttachments }),
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Resend SDK has overloads that conflict with our payload shape
            const { data, error } = await resend.emails.send(emailPayload);
            if (error) {
                // Check if it's a rate limit error
                const isRateLimitError = error.statusCode === 429 ||
                    error.name === "rate_limit_exceeded";
                if (isRateLimitError && attempt < maxRetries - 1) {
                    // Exponential backoff: 1s, 2s, 4s
                    const backoffDelay = Math.pow(2, attempt) * 1000;
                    console.log(`Rate limit hit, retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
                    await delay(backoffDelay);
                    continue;
                }
                console.error("Error sending email:", error);
                throw new Error(`Failed to send email: ${error.message || "Unknown error"}`);
            }
            console.log("Email sent successfully:", data);
            return data;
        }
        catch (error) {
            lastError = error;
            // If it's not a rate limit error or we're out of retries, throw
            if (attempt === maxRetries - 1) {
                console.error("Email service error after all retries:", error);
                throw error;
            }
            // Wait before retrying
            const backoffDelay = Math.pow(2, attempt) * 1000;
            console.log(`Error sending email, retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
            await delay(backoffDelay);
        }
    }
    throw lastError;
}
/**
 * Send multiple emails with rate limiting (sequential with delay)
 * Respects rate limits by sending emails one at a time with delays
 */
export async function sendEmailBatch(emails, delayBetweenEmails = 600 // 600ms = 1.67 emails/second (safely under 2/second limit)
) {
    const results = [];
    for (const email of emails) {
        try {
            await sendEmail(email);
            results.push({ success: true, email: email.to });
            // Add delay before next email (except for the last one)
            if (email !== emails[emails.length - 1]) {
                await delay(delayBetweenEmails);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error(`Failed to send email to ${email.to}:`, errorMessage);
            results.push({
                success: false,
                email: email.to,
                error: errorMessage
            });
            // Still add delay even on failure to respect rate limits
            if (email !== emails[emails.length - 1]) {
                await delay(delayBetweenEmails);
            }
        }
    }
    return results;
}
