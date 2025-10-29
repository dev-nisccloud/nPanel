import { SNS } from "aws-sdk";
import db from "@nPanel/db";
import { processQueueJob } from "../queue/queue-processor";

// Initialize SNS for signature verification
const sns = new SNS({
  region: process.env.AWS_SES_REGION || "us-east-1",
});

export interface SNSNotification {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Subject?: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  UnsubscribeURL: string;
}

export interface SESEventMessage {
  eventType: string;
  mail: {
    messageId: string;
    timestamp: string;
    source: string;
    sourceArn: string;
    sourceIp: string;
    callingIdentity: string;
    destination: string[];
    headersTruncated: boolean;
    headers: Array<{
      name: string;
      value: string;
    }>;
    commonHeaders: {
      from: string[];
      to: string[];
      messageId: string;
      subject: string;
      date: string;
    };
    tags: Record<string, string[]>;
  };
  bounce?: {
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
  };
  complaint?: {
    complainedRecipients: Array<{
      emailAddress: string;
    }>;
    timestamp: string;
    feedbackId: string;
    userAgent: string;
    complaintFeedbackType: string;
    arrivalDate: string;
  };
  delivery?: {
    timestamp: string;
    processingTimeMillis: number;
    recipients: string[];
    smtpResponse: string;
    reportingMTA: string;
  };
  open?: {
    ipAddress: string;
    timestamp: string;
    userAgent: string;
  };
  click?: {
    ipAddress: string;
    timestamp: string;
    userAgent: string;
    link: string;
  };
  reject?: {
    reason: string;
  };
  renderingFailure?: {
    errorMessage: string;
    errorCode: string;
  };
}

/**
 * Verify SNS message signature
 */
async function verifySNSSignature(message: SNSNotification): Promise<boolean> {
  try {
    // Create message string for verification
    const messageString = [
      `Message\n${message.Message}`,
      `MessageId\n${message.MessageId}`,
      `Subject\n${message.Subject || ""}`,
      `Timestamp\n${message.Timestamp}`,
      `TopicArn\n${message.TopicArn}`,
      `Type\n${message.Type}`,
    ].join("\n");

    // TODO: Implement proper SNS signature verification with AWS SDK v3
    // The verifySnsMessage method doesn't exist in SDK v3
    // For now, we'll skip signature verification (should implement manual verification)
    console.warn("SNS signature verification not implemented - accepting all messages");
    return true;
  } catch (error) {
    console.error("Error verifying SNS signature:", error);
    return false;
  }
}

/**
 * Process SNS webhook for SES events
 */
export async function processSNSWebhook(request: {
  headers: Record<string, string>;
  body: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const { headers, body } = request;

    // Parse SNS notification
    let snsNotification: SNSNotification;
    try {
      snsNotification = JSON.parse(body) as SNSNotification;
    } catch (error) {
      throw new Error("Invalid JSON in request body");
    }

    // Verify signature
    const isValidSignature = await verifySNSSignature(snsNotification);
    if (!isValidSignature) {
      throw new Error("Invalid SNS signature");
    }

    // Handle subscription confirmation
    if (snsNotification.Type === "SubscriptionConfirmation") {
      console.log("SNS subscription confirmation received");
      return {
        success: true,
        message: "Subscription confirmed",
      };
    }

    // Handle unsubscribe confirmation
    if (snsNotification.Type === "UnsubscribeConfirmation") {
      console.log("SNS unsubscribe confirmation received");
      return {
        success: true,
        message: "Unsubscribe confirmed",
      };
    }

    // Process notification message
    if (snsNotification.Type === "Notification") {
      let sesEvent: SESEventMessage;
      try {
        sesEvent = JSON.parse(snsNotification.Message) as SESEventMessage;
      } catch (error) {
        throw new Error("Invalid JSON in SNS message");
      }

      // Route to appropriate event handler
      const result = await processSESEvent(sesEvent);
      
      return {
        success: true,
        message: `Processed ${sesEvent.eventType} event`,
      };
    }

    throw new Error(`Unknown SNS message type: ${snsNotification.Type}`);

  } catch (error) {
    console.error("Error processing SNS webhook:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process SES event and route to appropriate handler
 */
async function processSESEvent(event: SESEventMessage): Promise<void> {
  const { eventType, mail } = event;

  // Extract campaign ID from tags
  const campaignId = mail.tags?.CampaignId?.[0];
  if (!campaignId) {
    console.warn("No campaign ID found in SES event tags");
    return;
  }

  // Extract recipient email
  const recipientEmail = mail.destination[0];
  if (!recipientEmail) {
    console.warn("No recipient email found in SES event");
    return;
  }

  // Find the audience contact
  const contact = await db.audienceContact.findFirst({
    where: {
      email: recipientEmail,
      audience: {
        campaigns: {
          some: {
            id: campaignId,
          },
        },
      },
    },
  });

  if (!contact) {
    console.warn(`Contact not found for email ${recipientEmail} in campaign ${campaignId}`);
    return;
  }

  // Route to appropriate event handler
  switch (eventType) {
    case "bounce":
      await processBounceEvent(event, campaignId, contact.id);
      break;
    
    case "complaint":
      await processComplaintEvent(event, campaignId, contact.id);
      break;
    
    case "delivery":
      await processDeliveryEvent(event, campaignId, contact.id);
      break;
    
    case "open":
      await processOpenEvent(event, campaignId, contact.id);
      break;
    
    case "click":
      await processClickEvent(event, campaignId, contact.id);
      break;
    
    case "reject":
      await processRejectEvent(event, campaignId, contact.id);
      break;
    
    case "renderingFailure":
      await processRenderingFailureEvent(event, campaignId, contact.id);
      break;
    
    default:
      console.warn(`Unknown SES event type: ${eventType}`);
  }
}

/**
 * Process bounce event
 */
async function processBounceEvent(
  event: SESEventMessage,
  campaignId: string,
  contactId: string
): Promise<void> {
  const bounce = event.bounce;
  if (!bounce) return;

  // Create email log entry
  await db.emailLog.create({
    data: {
      id: crypto.randomUUID(),
      campaignId,
      audienceContactId: contactId,
      messageId: event.mail.messageId,
      eventType: "BOUNCE",
      timestamp: new Date(bounce.timestamp),
      bounceType: bounce.bounceType,
      bounceSubType: bounce.bounceSubType,
      eventData: bounce,
      createdAt: new Date(),
    },
  });

  // Update contact status if hard bounce
  if (bounce.bounceType === "Permanent") {
    await db.audienceContact.update({
      where: { id: contactId },
      data: {
        status: "BOUNCED",
      },
    });
  }
}

/**
 * Process complaint event
 */
async function processComplaintEvent(
  event: SESEventMessage,
  campaignId: string,
  contactId: string
): Promise<void> {
  const complaint = event.complaint;
  if (!complaint) return;

  // Create email log entry
  await db.emailLog.create({
    data: {
      id: crypto.randomUUID(),
      campaignId,
      audienceContactId: contactId,
      messageId: event.mail.messageId,
      eventType: "COMPLAINT",
      timestamp: new Date(complaint.timestamp),
      complaintFeedbackType: complaint.complaintFeedbackType,
      eventData: complaint,
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
}

/**
 * Process delivery event
 */
async function processDeliveryEvent(
  event: SESEventMessage,
  campaignId: string,
  contactId: string
): Promise<void> {
  const delivery = event.delivery;
  if (!delivery) return;

  // Create email log entry
  await db.emailLog.create({
    data: {
      id: crypto.randomUUID(),
      campaignId,
      audienceContactId: contactId,
      messageId: event.mail.messageId,
      eventType: "DELIVERY",
      timestamp: new Date(delivery.timestamp),
      eventData: delivery,
      createdAt: new Date(),
    },
  });
}

/**
 * Process open event
 */
async function processOpenEvent(
  event: SESEventMessage,
  campaignId: string,
  contactId: string
): Promise<void> {
  const open = event.open;
  if (!open) return;

  // Create email log entry
  await db.emailLog.create({
    data: {
      id: crypto.randomUUID(),
      campaignId,
      audienceContactId: contactId,
      messageId: event.mail.messageId,
      eventType: "OPEN",
      timestamp: new Date(open.timestamp),
      ipAddress: open.ipAddress,
      userAgent: open.userAgent,
      eventData: open,
      createdAt: new Date(),
    },
  });
}

/**
 * Process click event
 */
async function processClickEvent(
  event: SESEventMessage,
  campaignId: string,
  contactId: string
): Promise<void> {
  const click = event.click;
  if (!click) return;

  // Create email log entry
  await db.emailLog.create({
    data: {
      id: crypto.randomUUID(),
      campaignId,
      audienceContactId: contactId,
      messageId: event.mail.messageId,
      eventType: "CLICK",
      timestamp: new Date(click.timestamp),
      ipAddress: click.ipAddress,
      userAgent: click.userAgent,
      linkUrl: click.link,
      eventData: click,
      createdAt: new Date(),
    },
  });
}

/**
 * Process reject event
 */
async function processRejectEvent(
  event: SESEventMessage,
  campaignId: string,
  contactId: string
): Promise<void> {
  const reject = event.reject;
  if (!reject) return;

  // Create email log entry
  await db.emailLog.create({
    data: {
      id: crypto.randomUUID(),
      campaignId,
      audienceContactId: contactId,
      messageId: event.mail.messageId,
      eventType: "REJECT",
      timestamp: new Date(event.mail.timestamp),
      eventData: reject,
      createdAt: new Date(),
    },
  });
}

/**
 * Process rendering failure event
 */
async function processRenderingFailureEvent(
  event: SESEventMessage,
  campaignId: string,
  contactId: string
): Promise<void> {
  const renderingFailure = event.renderingFailure;
  if (!renderingFailure) return;

  // Create email log entry
  await db.emailLog.create({
    data: {
      id: crypto.randomUUID(),
      campaignId,
      audienceContactId: contactId,
      messageId: event.mail.messageId,
      eventType: "RENDERING_FAILURE",
      timestamp: new Date(event.mail.timestamp),
      eventData: renderingFailure,
      createdAt: new Date(),
    },
  });
}
