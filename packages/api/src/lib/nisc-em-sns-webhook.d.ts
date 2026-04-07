/**
 * Persist SES events from an SNS `Notification` envelope into `nisc_em_email_event`,
 * and update `nisc_em_email` when `mail.messageId` matches a campaign email row.
 */
export declare function persistNiscEmEmailEventFromSnsNotification(rawSnsBody: string, snsEnvelope: Record<string, unknown>): Promise<void>;
