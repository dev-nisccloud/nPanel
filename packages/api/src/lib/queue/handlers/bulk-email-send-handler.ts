import db from "@nPanel/db";
import { sendBulkEmail } from "../../aws-ses/send-email";

type EmailEventType = "SEND" | "DELIVERY" | "BOUNCE" | "COMPLAINT" | "OPEN" | "CLICK" | "REJECT" | "RENDERING_FAILURE";

export interface BulkEmailSendJobPayload {
  campaignId: string;
  contacts: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    customFields?: Record<string, unknown>;
  }>;
}

/**
 * Process bulk email send job
 * Sends emails to a batch of contacts and logs the results
 */
export async function processBulkEmailSendJob(payload: BulkEmailSendJobPayload): Promise<void> {
  const { campaignId, contacts } = payload;

  try {
    // Fetch campaign with email domain
    const campaign = await db.emailCampaign.findUnique({
      where: { id: campaignId },
      include: {
        emailDomain: true,
      },
    });

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    if (!campaign.emailDomain.isVerified) {
      throw new Error(`Email domain ${campaign.emailDomain.domainName} is not verified`);
    }

    // Prepare email parameters
    const emailParams = {
      from: campaign.fromAddress,
      replyTo: campaign.replyToAddress,
      recipients: contacts,
      subject: campaign.subject,
      htmlBody: campaign.htmlContent,
      textBody: campaign.textContent || undefined,
      configurationSetName: process.env.AWS_SES_CONFIGURATION_SET,
      tags: [
        { Name: "CampaignId", Value: campaignId },
        { Name: "CampaignName", Value: campaign.name },
      ],
    };

    // Send emails via SES
    const results = await sendBulkEmail(emailParams);

    // Log results to database
    const logPromises = results.map(async (result, index) => {
      const contact = contacts[index];
      if (!contact) return;
      
      return db.emailLog.create({
        data: {
          id: crypto.randomUUID(),
          campaignId,
          audienceContactId: contact.id,
          messageId: result.messageId,
          eventType: "SEND" as EmailEventType,
          timestamp: new Date(),
          eventData: JSON.stringify({
            success: result.success,
            error: result.error,
            fromAddress: campaign.fromAddress,
            replyToAddress: campaign.replyToAddress,
            subject: campaign.subject,
          }),
          createdAt: new Date(),
        },
      });
    });

    await Promise.all(logPromises);

    // Count successful sends
    const successfulSends = results.filter(r => r.success).length;
    const failedSends = results.filter(r => !r.success).length;

    console.log(`Bulk email job completed for campaign ${campaignId}: ${successfulSends} sent, ${failedSends} failed`);

    // If all emails failed, we might want to retry or mark campaign as failed
    if (failedSends === contacts.length) {
      console.error(`All emails failed for campaign ${campaignId}, consider marking as failed`);
    }

  } catch (error) {
    console.error(`Error processing bulk email send job for campaign ${campaignId}:`, error);
    
    // Log error for each contact
    const errorLogPromises = contacts.map(contact =>
      db.emailLog.create({
        data: {
          id: crypto.randomUUID(),
          campaignId,
          audienceContactId: contact.id,
          eventType: "REJECT" as EmailEventType,
          timestamp: new Date(),
          eventData: JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error",
            reason: "Bulk send job failed",
          }),
          createdAt: new Date(),
        },
      })
    );

    await Promise.all(errorLogPromises);
    throw error;
  }
}
