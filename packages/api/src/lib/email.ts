import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Helper function to delay execution
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send an email with automatic retry on rate limit errors
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments,
  maxRetries = 3,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  maxRetries?: number;
}) {
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Use the basic email sending approach without React components
      const emailData: {
        from: string;
        to: string[];
        subject: string;
        html?: string;
        text?: string;
      } = {
        from: process.env.RESEND_FROM_EMAIL || "nPanel <noreply@npanel.com>",
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

      // Type the payload explicitly for HTML/text emails (not React Email)
      const emailPayload = {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        ...(emailData.html && { html: emailData.html }),
        ...(emailData.text && { text: emailData.text }),
        ...(attachments && attachments.length > 0 && {
          attachments: attachments.map(att => ({
            filename: att.filename,
            content: typeof att.content === 'string' 
              ? Buffer.from(att.content, 'base64')
              : att.content,
            ...(att.contentType && { contentType: att.contentType }),
          })),
        }),
      } as Parameters<typeof resend.emails.send>[0];

      const { data, error } = await resend.emails.send(emailPayload);

      if (error) {
        // Check if it's a rate limit error
        const isRateLimitError = 
          (error as { statusCode?: number }).statusCode === 429 ||
          (error as { name?: string }).name === "rate_limit_exceeded";

        if (isRateLimitError && attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const backoffDelay = Math.pow(2, attempt) * 1000;
          console.log(`Rate limit hit, retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await delay(backoffDelay);
          continue;
        }

        console.error("Error sending email:", error);
        throw new Error(`Failed to send email: ${(error as { message?: string }).message || "Unknown error"}`);
      }

      console.log("Email sent successfully:", data);
      return data;
    } catch (error) {
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
export async function sendEmailBatch(
  emails: Array<{
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }>,
  delayBetweenEmails = 600 // 600ms = 1.67 emails/second (safely under 2/second limit)
): Promise<Array<{ success: boolean; email: string; error?: string }>> {
  const results: Array<{ success: boolean; email: string; error?: string }> = [];

  for (const email of emails) {
    try {
      await sendEmail(email);
      results.push({ success: true, email: email.to });
      
      // Add delay before next email (except for the last one)
      if (email !== emails[emails.length - 1]) {
        await delay(delayBetweenEmails);
      }
    } catch (error) {
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
