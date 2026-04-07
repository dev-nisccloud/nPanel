import { randomUUID } from "node:crypto";
import { and, db, eq, isNull, sql } from "@npanel/db";
import { niscEmCampaign, niscEmEmail, niscEmEmailEvent, niscEmSuppression, } from "@npanel/db/schema";
function asRecord(v) {
    if (v !== null && typeof v === "object" && !Array.isArray(v))
        return v;
    return null;
}
function str(v) {
    return typeof v === "string" ? v : undefined;
}
function num(v) {
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
function parseIsoToDate(v) {
    const s = str(v);
    if (!s)
        return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}
function mailDestination(mail) {
    const d = mail?.destination;
    if (Array.isArray(d) && d.length > 0 && typeof d[0] === "string")
        return d[0];
    return undefined;
}
function normalizeLinkTags(v) {
    if (!v || typeof v !== "object" || Array.isArray(v))
        return undefined;
    const out = {};
    for (const [k, val] of Object.entries(v)) {
        if (Array.isArray(val)) {
            const strings = val.filter((x) => typeof x === "string");
            if (strings.length)
                out[k] = strings;
        }
        else if (typeof val === "string")
            out[k] = [val];
    }
    return Object.keys(out).length ? out : undefined;
}
function extractOccurredAt(ses, eventType, mail) {
    let d = null;
    switch (eventType) {
        case "Delivery":
            d = parseIsoToDate(asRecord(ses.delivery)?.timestamp);
            break;
        case "Open":
            d = parseIsoToDate(asRecord(ses.open)?.timestamp);
            break;
        case "Click":
            d = parseIsoToDate(asRecord(ses.click)?.timestamp);
            break;
        case "Bounce":
            d = parseIsoToDate(asRecord(ses.bounce)?.timestamp);
            break;
        case "Complaint":
            d = parseIsoToDate(asRecord(ses.complaint)?.timestamp);
            break;
        case "Send":
        case "Reject":
            d = parseIsoToDate(mail?.timestamp);
            break;
        default:
            d =
                parseIsoToDate(asRecord(ses.delivery)?.timestamp) ??
                    parseIsoToDate(asRecord(ses.deliveryDelay)?.timestamp) ??
                    parseIsoToDate(mail?.timestamp);
    }
    return d ?? new Date();
}
function extractRecipient(ses, eventType, mail) {
    const bounce = asRecord(ses.bounce);
    const complaint = asRecord(ses.complaint);
    const br = bounce?.bouncedRecipients;
    if (Array.isArray(br) && br.length) {
        const em = str(asRecord(br[0])?.emailAddress);
        if (em)
            return em;
    }
    const cr = complaint?.complainedRecipients;
    if (Array.isArray(cr) && cr.length) {
        const em = str(asRecord(cr[0])?.emailAddress);
        if (em)
            return em;
    }
    return mailDestination(mail);
}
function mapSesEventToInsert(params) {
    const { ses, rawSnsBody, emailId } = params;
    const mail = asRecord(ses.mail);
    const messageId = str(mail?.messageId) ?? `missing_message_id_${randomUUID()}`;
    const eventType = str(ses.eventType) ?? "Unknown";
    const occurredAt = extractOccurredAt(ses, eventType, mail);
    const recipientEmail = extractRecipient(ses, eventType, mail);
    const delivery = asRecord(ses.delivery);
    const open = asRecord(ses.open);
    const click = asRecord(ses.click);
    const bounce = asRecord(ses.bounce);
    const complaint = asRecord(ses.complaint);
    const delay = asRecord(ses.deliveryDelay);
    const br0 = Array.isArray(bounce?.bouncedRecipients) && bounce.bouncedRecipients.length > 0
        ? asRecord(bounce.bouncedRecipients[0])
        : null;
    const deliveryRecipients = Array.isArray(delivery?.recipients)
        ? delivery.recipients.filter((x) => typeof x === "string")
        : undefined;
    return {
        id: randomUUID(),
        emailId,
        sesMessageId: messageId,
        eventType,
        occurredAt,
        recipientEmail,
        ipAddress: str(open?.ipAddress) ?? str(click?.ipAddress),
        userAgent: str(open?.userAgent) ?? str(click?.userAgent),
        link: str(click?.link),
        linkTags: normalizeLinkTags(click?.linkTags),
        bounceType: str(bounce?.bounceType),
        bounceSubType: str(bounce?.bounceSubType),
        bounceSmtpResponse: str(br0?.diagnosticCode),
        bounceFeedbackId: str(bounce?.feedbackId),
        bounceRemoteMtaIp: str(bounce?.remoteMtaIp),
        bounceReportingMta: str(bounce?.reportingMTA),
        bounceAction: str(br0?.action),
        bounceRecipientStatus: str(br0?.status),
        complaintFeedbackType: str(complaint?.complaintFeedbackType),
        complainedRecipientEmail: (() => {
            const recipients = complaint?.complainedRecipients;
            if (Array.isArray(recipients) && recipients.length) {
                return str(asRecord(recipients[0])?.emailAddress);
            }
            return undefined;
        })(),
        deliveryProcessingMs: num(delivery?.processingTimeMillis),
        deliverySmtpResponse: str(delivery?.smtpResponse),
        deliveryRemoteMtaIp: str(delivery?.remoteMtaIp),
        deliveryReportingMta: str(delivery?.reportingMTA),
        deliveryRecipients,
        delayType: str(delay?.delayType),
        rawPayload: ses,
        rawSnsBody,
        createdAt: new Date(),
    };
}
async function resolveEmailIdBySesMessageId(sesMessageId) {
    const [row] = await db
        .select({ id: niscEmEmail.id })
        .from(niscEmEmail)
        .where(eq(niscEmEmail.sesMessageId, sesMessageId))
        .limit(1);
    return row?.id ?? null;
}
async function resolveSuppressionSourceFromEmailId(emailId) {
    if (!emailId) {
        return { teamId: null, sourceCampaignId: null, sourceEmailId: null };
    }
    const [row] = await db
        .select({
        id: niscEmEmail.id,
        campaignId: niscEmEmail.campaignId,
    })
        .from(niscEmEmail)
        .where(eq(niscEmEmail.id, emailId))
        .limit(1);
    if (!row) {
        return { teamId: null, sourceCampaignId: null, sourceEmailId: null };
    }
    const [camp] = await db
        .select({ teamId: niscEmCampaign.teamId })
        .from(niscEmCampaign)
        .where(eq(niscEmCampaign.id, row.campaignId))
        .limit(1);
    return {
        teamId: camp?.teamId ?? null,
        sourceCampaignId: row.campaignId,
        sourceEmailId: row.id,
    };
}
function bouncedRecipientEmails(bounce) {
    const br = bounce?.bouncedRecipients;
    if (!Array.isArray(br))
        return [];
    const out = [];
    for (const item of br) {
        const em = str(asRecord(item)?.emailAddress);
        if (em)
            out.push(em);
    }
    return out;
}
function complainedRecipientEmails(complaint) {
    const cr = complaint?.complainedRecipients;
    if (!Array.isArray(cr))
        return [];
    const out = [];
    for (const item of cr) {
        const em = str(asRecord(item)?.emailAddress);
        if (em)
            out.push(em);
    }
    return out;
}
/** Idempotent suppression row per (team_id|null, email, reason). */
async function ensureSuppressionRows(params) {
    const { recipients, reason, emailId } = params;
    if (!recipients.length)
        return;
    const ctx = await resolveSuppressionSourceFromEmailId(emailId);
    const now = new Date();
    for (const rawEmail of recipients) {
        const normalized = rawEmail.trim().toLowerCase();
        if (!normalized)
            continue;
        const [existing] = await db
            .select({ id: niscEmSuppression.id })
            .from(niscEmSuppression)
            .where(and(eq(niscEmSuppression.email, normalized), eq(niscEmSuppression.reason, reason), ctx.teamId === null
            ? isNull(niscEmSuppression.teamId)
            : eq(niscEmSuppression.teamId, ctx.teamId)))
            .limit(1);
        if (existing)
            continue;
        await db.insert(niscEmSuppression).values({
            id: randomUUID(),
            teamId: ctx.teamId,
            email: normalized,
            reason,
            sourceCampaignId: ctx.sourceCampaignId,
            sourceEmailId: ctx.sourceEmailId,
            createdAt: now,
        });
    }
}
/** Permanent (hard) bounces only. */
async function ensureHardBounceSuppressionsForSesEvent(ses, emailId) {
    const bounce = asRecord(ses.bounce);
    if (str(bounce?.bounceType) !== "Permanent")
        return;
    await ensureSuppressionRows({
        recipients: bouncedRecipientEmails(bounce),
        reason: "HARD_BOUNCE",
        emailId,
    });
}
/** Spam complaints — recipient opted out via ISP/report; distinct from HARD_BOUNCE in `reason`. */
async function ensureComplaintSuppressionsForSesEvent(ses, emailId) {
    const complaint = asRecord(ses.complaint);
    const mail = asRecord(ses.mail);
    let recipients = complainedRecipientEmails(complaint);
    if (!recipients.length) {
        const dest = mailDestination(mail);
        if (dest)
            recipients = [dest];
    }
    await ensureSuppressionRows({ recipients, reason: "COMPLAINT", emailId });
}
async function applyEventToEmailRow(emailId, eventType, occurredAt, ses) {
    const bounce = asRecord(ses.bounce);
    const complaint = asRecord(ses.complaint);
    const now = new Date();
    if (eventType === "Send") {
        await db
            .update(niscEmEmail)
            .set({ sentAt: occurredAt, status: "SENT", updatedAt: now })
            .where(eq(niscEmEmail.id, emailId));
        return;
    }
    if (eventType === "Delivery") {
        await db
            .update(niscEmEmail)
            .set({ deliveredAt: occurredAt, status: "DELIVERED", updatedAt: now })
            .where(eq(niscEmEmail.id, emailId));
        return;
    }
    if (eventType === "Open") {
        const [existing] = await db
            .select({ openedAt: niscEmEmail.openedAt, status: niscEmEmail.status })
            .from(niscEmEmail)
            .where(eq(niscEmEmail.id, emailId))
            .limit(1);
        const nextStatus = existing?.status === "CLICKED" ? "CLICKED" : "OPENED";
        await db
            .update(niscEmEmail)
            .set({
            opens: sql `${niscEmEmail.opens} + 1`,
            openedAt: existing?.openedAt ?? occurredAt,
            status: nextStatus,
            updatedAt: now,
        })
            .where(eq(niscEmEmail.id, emailId));
        return;
    }
    if (eventType === "Click") {
        const [existing] = await db
            .select({ clickedAt: niscEmEmail.clickedAt })
            .from(niscEmEmail)
            .where(eq(niscEmEmail.id, emailId))
            .limit(1);
        await db
            .update(niscEmEmail)
            .set({
            clicks: sql `${niscEmEmail.clicks} + 1`,
            clickedAt: existing?.clickedAt ?? occurredAt,
            status: "CLICKED",
            updatedAt: now,
        })
            .where(eq(niscEmEmail.id, emailId));
        return;
    }
    if (eventType === "Bounce") {
        await db
            .update(niscEmEmail)
            .set({
            bouncedAt: occurredAt,
            bounceType: str(bounce?.bounceType),
            bounceSubType: str(bounce?.bounceSubType),
            status: "BOUNCED",
            updatedAt: now,
        })
            .where(eq(niscEmEmail.id, emailId));
        return;
    }
    if (eventType === "Complaint") {
        await db
            .update(niscEmEmail)
            .set({
            complainedAt: occurredAt,
            complaintFeedbackType: str(complaint?.complaintFeedbackType),
            status: "COMPLAINED",
            updatedAt: now,
        })
            .where(eq(niscEmEmail.id, emailId));
    }
}
async function insertAndMaybeAggregate(ses, rawSnsBody) {
    const mail = asRecord(ses.mail);
    const mid = str(mail?.messageId);
    const emailId = mid ? await resolveEmailIdBySesMessageId(mid) : null;
    const row = mapSesEventToInsert({ ses, rawSnsBody, emailId });
    await db.insert(niscEmEmailEvent).values(row);
    const eventType = str(ses.eventType) ?? "Unknown";
    if (emailId) {
        const occurredAt = extractOccurredAt(ses, eventType, mail);
        await applyEventToEmailRow(emailId, eventType, occurredAt, ses);
    }
    if (eventType === "Bounce") {
        await ensureHardBounceSuppressionsForSesEvent(ses, emailId);
    }
    if (eventType === "Complaint") {
        await ensureComplaintSuppressionsForSesEvent(ses, emailId);
    }
}
/**
 * Persist SES events from an SNS `Notification` envelope into `nisc_em_email_event`,
 * and update `nisc_em_email` when `mail.messageId` matches a campaign email row.
 */
export async function persistNiscEmEmailEventFromSnsNotification(rawSnsBody, snsEnvelope) {
    const messageStr = snsEnvelope["Message"];
    if (typeof messageStr !== "string") {
        await db.insert(niscEmEmailEvent).values({
            id: randomUUID(),
            sesMessageId: `sns_missing_message_${randomUUID()}`,
            eventType: "SnsMissingMessage",
            occurredAt: new Date(),
            rawSnsBody,
            createdAt: new Date(),
        });
        return;
    }
    let inner;
    try {
        inner = JSON.parse(messageStr);
    }
    catch {
        await db.insert(niscEmEmailEvent).values({
            id: randomUUID(),
            sesMessageId: `invalid_ses_json_${randomUUID()}`,
            eventType: "InvalidSesMessageJson",
            occurredAt: new Date(),
            rawPayload: { messageSnippet: messageStr.slice(0, 8000) },
            rawSnsBody,
            createdAt: new Date(),
        });
        return;
    }
    const events = Array.isArray(inner) ? inner : [inner];
    for (const item of events) {
        const ses = asRecord(item);
        if (!ses)
            continue;
        await insertAndMaybeAggregate(ses, rawSnsBody);
    }
}
