import {
  SendEmailCommand,
  SendTemplatedEmailCommand,
} from "@aws-sdk/client-ses";
import { sesClient } from "./client";

export interface SendEmailParams {
  from: string;
  replyTo?: string;
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  configurationSetName?: string;
  tags?: Array<{ Name: string; Value: string }>;
}

export interface BulkEmailParams {
  from: string;
  replyTo?: string;
  recipients: Array<{
    email: string;
    firstName?: string;
    lastName?: string;
    customFields?: Record<string, unknown>;
  }>;
  subject: string;
  htmlBody: string;
  textBody?: string;
  configurationSetName?: string;
  tags?: Array<{ Name: string; Value: string }>;
}

export interface SendEmailResult {
  messageId: string;
  success: boolean;
  error?: string;
}

/**
 * Send a single email via Amazon SES
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    const command = new SendEmailCommand({
      Source: params.from,
      ReplyToAddresses: params.replyTo ? [params.replyTo] : undefined,
      Destination: {
        ToAddresses: Array.isArray(params.to) ? params.to : [params.to],
      },
      Message: {
        Subject: {
          Data: params.subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: params.htmlBody,
            Charset: "UTF-8",
          },
          Text: params.textBody ? {
            Data: params.textBody,
            Charset: "UTF-8",
          } : undefined,
        },
      },
      ConfigurationSetName: params.configurationSetName,
      Tags: params.tags,
    });

    const response = await sesClient.send(command);
    
    return {
      messageId: response.MessageId || "",
      success: true,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      messageId: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send bulk emails via Amazon SES
 * Uses individual SendEmailCommand calls to respect rate limits
 */
export async function sendBulkEmail(params: BulkEmailParams): Promise<SendEmailResult[]> {
  const results: SendEmailResult[] = [];
  const batchSize = parseInt(process.env.EMAIL_BATCH_SIZE || "50");
  
  // Process recipients in batches to respect SES rate limits
  for (let i = 0; i < params.recipients.length; i += batchSize) {
    const batch = params.recipients.slice(i, i + batchSize);
    
    // Process batch concurrently (but respect maxSendRate)
    const batchPromises = batch.map(async (recipient) => {
      try {
        const command = new SendEmailCommand({
          Source: params.from,
          ReplyToAddresses: params.replyTo ? [params.replyTo] : undefined,
          Destination: {
            ToAddresses: [recipient.email],
          },
          Message: {
            Subject: {
              Data: params.subject,
              Charset: "UTF-8",
            },
            Body: {
              Html: {
                Data: params.htmlBody,
                Charset: "UTF-8",
              },
              Text: params.textBody ? {
                Data: params.textBody,
                Charset: "UTF-8",
              } : undefined,
            },
          },
          ConfigurationSetName: params.configurationSetName,
          Tags: [
            ...(params.tags || []),
            { Name: "RecipientEmail", Value: recipient.email },
            ...(recipient.firstName ? [{ Name: "RecipientFirstName", Value: recipient.firstName }] : []),
            ...(recipient.lastName ? [{ Name: "RecipientLastName", Value: recipient.lastName }] : []),
          ],
        });

        const response = await sesClient.send(command);
        
        return {
          messageId: response.MessageId || "",
          success: true,
        };
      } catch (error) {
        console.error(`Error sending email to ${recipient.email}:`, error);
        return {
          messageId: "",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add delay between batches to respect rate limits
    if (i + batchSize < params.recipients.length) {
      const delayMs = 1000 / parseInt(process.env.EMAIL_MAX_SEND_RATE || "14");
      await new Promise(resolve => setTimeout(resolve, delayMs * batchSize));
    }
  }

  return results;
}

/**
 * Send templated email (for future use with templates)
 */
export async function sendTemplatedEmail(
  templateName: string,
  templateData: Record<string, unknown>,
  params: {
    from: string;
    replyTo?: string;
    to: string | string[];
    configurationSetName?: string;
    tags?: Array<{ Name: string; Value: string }>;
  }
): Promise<SendEmailResult> {
  try {
    const command = new SendTemplatedEmailCommand({
      Source: params.from,
      ReplyToAddresses: params.replyTo ? [params.replyTo] : undefined,
      Destination: {
        ToAddresses: Array.isArray(params.to) ? params.to : [params.to],
      },
      Template: templateName,
      TemplateData: JSON.stringify(templateData),
      ConfigurationSetName: params.configurationSetName,
      Tags: params.tags,
    });

    const response = await sesClient.send(command);
    
    return {
      messageId: response.MessageId || "",
      success: true,
    };
  } catch (error) {
    console.error("Error sending templated email:", error);
    return {
      messageId: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate from address format (supports display name)
 */
export function isValidFromAddress(fromAddress: string): boolean {
  // Support formats like "Name <email@domain.com>" or "email@domain.com"
  const fromRegex = /^(?:[^<>]*<)?[^\s@]+@[^\s@]+\.[^\s@]+(?:>)?$/;
  return fromRegex.test(fromAddress);
}

/**
 * Extract email from from address (removes display name)
 */
export function extractEmailFromAddress(fromAddress: string): string {
  const match = fromAddress.match(/<([^>]+)>/);
  return match?.[1] ?? fromAddress;
}
