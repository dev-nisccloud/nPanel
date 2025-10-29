import db from "@nPanel/db";
import { queueBulkEmailSend } from "../email-queue";

export interface CampaignSendJobPayload {
  campaignId: string;
}

/**
 * Process campaign send job
 * Fetches campaign and audience contacts, splits into batches, and queues bulk email jobs
 */
export async function processCampaignSendJob(payload: CampaignSendJobPayload): Promise<void> {
  const { campaignId } = payload;

  try {
    // Fetch campaign with related data
    const campaign = await db.emailCampaign.findUnique({
      where: { id: campaignId },
      include: {
        emailDomain: true,
        audience: {
          include: {
            contacts: {
              where: {
                status: "SUBSCRIBED",
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    if (!campaign.emailDomain.isVerified) {
      throw new Error(`Email domain ${campaign.emailDomain.domainName} is not verified`);
    }

    if (campaign.status !== "SENDING") {
      throw new Error(`Campaign ${campaignId} is not in SENDING status`);
    }

    const contacts = campaign.audience.contacts;
    
    if (contacts.length === 0) {
      // No contacts to send to, mark campaign as sent
      await db.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          totalRecipients: 0,
        },
      });
      return;
    }

    // Update total recipients
    await db.emailCampaign.update({
      where: { id: campaignId },
      data: {
        totalRecipients: contacts.length,
      },
    });

    // Split contacts into batches
    const batchSize = parseInt(process.env.EMAIL_BATCH_SIZE || "50");
    const batches: typeof contacts[] = [];
    
    for (let i = 0; i < contacts.length; i += batchSize) {
      batches.push(contacts.slice(i, i + batchSize));
    }

    // Queue bulk email jobs for each batch
    const batchPromises = batches.map(async (batch) => {
      const batchContacts = batch.map(contact => ({
        id: contact.id,
        email: contact.email,
        firstName: contact.firstName || undefined,
        lastName: contact.lastName || undefined,
        customFields: (contact.customFields as Record<string, unknown>) || undefined,
      }));

      return queueBulkEmailSend(campaignId, batchContacts);
    });

    await Promise.all(batchPromises);

    console.log(`Campaign ${campaignId} queued for sending to ${contacts.length} contacts in ${batches.length} batches`);

  } catch (error) {
    console.error(`Error processing campaign send job for ${campaignId}:`, error);
    
    // Update campaign status to failed
    await db.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: "FAILED",
      },
    });

    throw error;
  }
}
