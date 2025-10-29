import db from "@nPanel/db";

// Helper to convert event data to Prisma JSON format  
function toEventDataJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

export interface BounceEventData {
  bounceType: string;
  bounceSubType: string;
  bouncedRecipients: Array<{
    emailAddress: string;
    action: string;
    status: string;
    diagnosticCode: string;
  }>;
  timestamp: string;
  feedbackId: string;
  reportingMTA: string;
}

export interface ComplaintEventData {
  complainedRecipients: Array<{
    emailAddress: string;
  }>;
  timestamp: string;
  feedbackId: string;
  userAgent: string;
  complaintFeedbackType: string;
  arrivalDate: string;
}

export interface DeliveryEventData {
  timestamp: string;
  processingTimeMillis: number;
  recipients: string[];
  smtpResponse: string;
  reportingMTA: string;
}

export interface OpenEventData {
  ipAddress: string;
  timestamp: string;
  userAgent: string;
}

export interface ClickEventData {
  ipAddress: string;
  timestamp: string;
  userAgent: string;
  link: string;
}

/**
 * Process bounce event
 */
export async function processBounceEvent(
  campaignId: string,
  contactId: string,
  messageId: string,
  bounceData: BounceEventData
): Promise<void> {
  try {
    // Create email log entry
    await db.emailLog.create({
      data: {
        id: crypto.randomUUID(),
        campaignId,
        audienceContactId: contactId,
        messageId,
        eventType: "BOUNCE",
        timestamp: new Date(bounceData.timestamp),
        bounceType: bounceData.bounceType,
        bounceSubType: bounceData.bounceSubType,
        eventData: toEventDataJson(bounceData),
        createdAt: new Date(),
      },
    });

    // Update contact status if hard bounce
    if (bounceData.bounceType === "Permanent") {
      await db.audienceContact.update({
        where: { id: contactId },
        data: {
          status: "BOUNCED",
        },
      });

      console.log(`Contact ${contactId} marked as bounced due to permanent bounce`);
    }

    console.log(`Processed bounce event for campaign ${campaignId}, contact ${contactId}`);
  } catch (error) {
    console.error("Error processing bounce event:", error);
    throw error;
  }
}

/**
 * Process complaint event
 */
export async function processComplaintEvent(
  campaignId: string,
  contactId: string,
  messageId: string,
  complaintData: ComplaintEventData
): Promise<void> {
  try {
    // Create email log entry
    await db.emailLog.create({
      data: {
        id: crypto.randomUUID(),
        campaignId,
        audienceContactId: contactId,
        messageId,
        eventType: "COMPLAINT",
        timestamp: new Date(complaintData.timestamp),
        complaintFeedbackType: complaintData.complaintFeedbackType,
        eventData: toEventDataJson(complaintData),
        createdAt: new Date(),
      },
    });

    // Update contact status
    await db.audienceContact.update({
      where: { id: contactId },
      data: {
        status: "COMPLAINED",
      },
    });

    console.log(`Contact ${contactId} marked as complained`);
    console.log(`Processed complaint event for campaign ${campaignId}, contact ${contactId}`);
  } catch (error) {
    console.error("Error processing complaint event:", error);
    throw error;
  }
}

/**
 * Process delivery event
 */
export async function processDeliveryEvent(
  campaignId: string,
  contactId: string,
  messageId: string,
  deliveryData: DeliveryEventData
): Promise<void> {
  try {
    // Create email log entry
    await db.emailLog.create({
      data: {
        id: crypto.randomUUID(),
        campaignId,
        audienceContactId: contactId,
        messageId,
        eventType: "DELIVERY",
        timestamp: new Date(deliveryData.timestamp),
        eventData: toEventDataJson(deliveryData),
        createdAt: new Date(),
      },
    });

    console.log(`Processed delivery event for campaign ${campaignId}, contact ${contactId}`);
  } catch (error) {
    console.error("Error processing delivery event:", error);
    throw error;
  }
}

/**
 * Process open event
 */
export async function processOpenEvent(
  campaignId: string,
  contactId: string,
  messageId: string,
  openData: OpenEventData
): Promise<void> {
  try {
    // Create email log entry
    await db.emailLog.create({
      data: {
        id: crypto.randomUUID(),
        campaignId,
        audienceContactId: contactId,
        messageId,
        eventType: "OPEN",
        timestamp: new Date(openData.timestamp),
        ipAddress: openData.ipAddress,
        userAgent: openData.userAgent,
        eventData: toEventDataJson(openData),
        createdAt: new Date(),
      },
    });

    console.log(`Processed open event for campaign ${campaignId}, contact ${contactId}`);
  } catch (error) {
    console.error("Error processing open event:", error);
    throw error;
  }
}

/**
 * Process click event
 */
export async function processClickEvent(
  campaignId: string,
  contactId: string,
  messageId: string,
  clickData: ClickEventData
): Promise<void> {
  try {
    // Create email log entry
    await db.emailLog.create({
      data: {
        id: crypto.randomUUID(),
        campaignId,
        audienceContactId: contactId,
        messageId,
        eventType: "CLICK",
        timestamp: new Date(clickData.timestamp),
        ipAddress: clickData.ipAddress,
        userAgent: clickData.userAgent,
        linkUrl: clickData.link,
        eventData: toEventDataJson(clickData),
        createdAt: new Date(),
      },
    });

    console.log(`Processed click event for campaign ${campaignId}, contact ${contactId}, link: ${clickData.link}`);
  } catch (error) {
    console.error("Error processing click event:", error);
    throw error;
  }
}

/**
 * Process reject event
 */
export async function processRejectEvent(
  campaignId: string,
  contactId: string,
  messageId: string,
  rejectData: { reason: string }
): Promise<void> {
  try {
    // Create email log entry
    await db.emailLog.create({
      data: {
        id: crypto.randomUUID(),
        campaignId,
        audienceContactId: contactId,
        messageId,
        eventType: "REJECT",
        timestamp: new Date(),
        eventData: rejectData,
        createdAt: new Date(),
      },
    });

    console.log(`Processed reject event for campaign ${campaignId}, contact ${contactId}, reason: ${rejectData.reason}`);
  } catch (error) {
    console.error("Error processing reject event:", error);
    throw error;
  }
}

/**
 * Process rendering failure event
 */
export async function processRenderingFailureEvent(
  campaignId: string,
  contactId: string,
  messageId: string,
  failureData: { errorMessage: string; errorCode: string }
): Promise<void> {
  try {
    // Create email log entry
    await db.emailLog.create({
      data: {
        id: crypto.randomUUID(),
        campaignId,
        audienceContactId: contactId,
        messageId,
        eventType: "RENDERING_FAILURE",
        timestamp: new Date(),
        eventData: failureData,
        createdAt: new Date(),
      },
    });

    console.log(`Processed rendering failure event for campaign ${campaignId}, contact ${contactId}, error: ${failureData.errorMessage}`);
  } catch (error) {
    console.error("Error processing rendering failure event:", error);
    throw error;
  }
}
