import { SES } from "@aws-sdk/client-ses";
import { randomUUID } from "node:crypto";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { niscEmCampaign, niscEmEmail } from "@npanel/db/schema";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

function optionalEnv(name: string): string | null {
  const v = process.env[name];
  const t = v?.trim();
  return t ? t : null;
}

function toRfc2047Utf8(value: string): string {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const buf = Buffer.from(value, "utf8");
  const b64 = buf.toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}

function stripHeaderUnsafe(value: string): string {
  // Prevent CRLF/header injection
  return value.replace(/[\r\n]+/g, " ").trim();
}

function parseDisplayEmail(value: string): { name: string | null; email: string } {
  const v = stripHeaderUnsafe(value);
  const m = v.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (m) {
    return { name: m[1]?.trim() || null, email: m[2]!.trim() };
  }
  return { name: null, email: v };
}

function buildFromHeader(params: { fromName: string | null; fromEmail: string }): string {
  const parsed = parseDisplayEmail(params.fromEmail);
  const name = stripHeaderUnsafe(params.fromName ?? parsed.name ?? "");
  const email = stripHeaderUnsafe(parsed.email);
  return name ? `${toRfc2047Utf8(name)} <${email}>` : email;
}

function getSesConfigurationSetName(): string | undefined {
  const a = process.env.AWS_SES_CONFIGURATION_SET?.trim();
  const b = process.env.SES_CONFIGURATION_SET?.trim();
  return a || b || undefined;
}

let sesClient: SES | null = null;
function getSesClient(): SES {
  if (sesClient) return sesClient;
  sesClient = new SES({
    apiVersion: "2010-12-01",
    region: requireEnv("AWS_SES_REGION"),
    credentials: {
      accessKeyId: requireEnv("AWS_SES_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("AWS_SES_SECRET_ACCESS_KEY"),
    },
  });
  return sesClient;
}

async function sendSesRawEmail(input: { raw: Buffer }) {
  const client = getSesClient();
  const configurationSetName = getSesConfigurationSetName();
  return client.sendRawEmail({
    RawMessage: { Data: input.raw },
    ...(configurationSetName ? { ConfigurationSetName: configurationSetName } : {}),
  });
}

function buildRawMimeEmail(params: {
  from: string;
  to: string;
  subject: string;
  replyTo?: string | null;
  text?: string | null;
  html?: string | null;
}): Buffer {
  const boundary = `npanel-${randomUUID()}`;
  const lines: string[] = [];
  lines.push(`From: ${params.from}`);
  lines.push(`To: ${params.to}`);
  lines.push(`Subject: ${toRfc2047Utf8(params.subject)}`);
  if (params.replyTo) lines.push(`Reply-To: ${params.replyTo}`);
  lines.push("MIME-Version: 1.0");
  lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  lines.push("");

  const text = params.text?.trim() ? params.text : null;
  const html = params.html?.trim() ? params.html : null;

  if (text) {
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: 7bit");
    lines.push("");
    lines.push(text);
    lines.push("");
  }

  if (html) {
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: 7bit");
    lines.push("");
    lines.push(html);
    lines.push("");
  }

  if (!text && !html) {
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: 7bit");
    lines.push("");
    lines.push("(empty email)");
    lines.push("");
  }

  lines.push(`--${boundary}--`);
  lines.push("");
  return Buffer.from(lines.join("\r\n"), "utf8");
}

async function getOrCreateTransactionalCampaign(params: {
  userId: string;
  teamId: string | null;
  fromEmail: string;
  fromName: string | null;
  replyTo: string | null;
}) {
  const name = "Transactional";
  const existing = await db.query.niscEmCampaign.findFirst({
    where: and(
      eq(niscEmCampaign.userId, params.userId),
      params.teamId ? eq(niscEmCampaign.teamId, params.teamId) : eq(niscEmCampaign.teamId, null),
      eq(niscEmCampaign.name, name),
    ),
    columns: { id: true },
  });
  if (existing?.id) return existing.id;

  const now = new Date();
  const id = randomUUID();
  await db.insert(niscEmCampaign).values({
    id,
    teamId: params.teamId,
    userId: params.userId,
    domainId: null,
    audienceId: null,
    name,
    subject: "(transactional)",
    fromEmail: params.fromEmail,
    fromName: params.fromName,
    replyTo: params.replyTo,
    htmlContent: null,
    textContent: null,
    status: "SENT",
    trackingEnabled: true,
    totalRecipients: 0,
    totalSent: 0,
    scheduledAt: null,
    sentAt: now,
    completedAt: now,
    createdAt: now,
    updatedAt: now,
  } as any);
  return id;
}

/** Fast path for auth emails (verify, reset, MFA). Skips campaign/email tracking DB. */
export async function sendAuthEmail(params: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string | null;
}) {
  const fromDomain = requireEnv("NISC_TX_EMAIL_DOMAIN");
  const fromAddress = optionalEnv("NISC_TX_FROM_EMAIL") ?? `noreply@${fromDomain}`;
  const fromName = optionalEnv("NISC_TX_FROM_NAME") ?? "Nisc Cloud®";
  const defaultReplyTo = optionalEnv("NISC_TX_REPLY_TO");
  const replyTo = params.replyTo ?? defaultReplyTo;

  if (!params.html?.trim() && !params.text?.trim()) {
    throw new Error("Either html or text must be provided.");
  }

  const fromHeader = buildFromHeader({ fromName, fromEmail: fromAddress });
  const raw = buildRawMimeEmail({
    from: fromHeader,
    to: params.to,
    subject: stripHeaderUnsafe(params.subject),
    replyTo: replyTo ? stripHeaderUnsafe(replyTo) : null,
    text: params.text ?? null,
    html: params.html ?? null,
  });

  const res = await sendSesRawEmail({ raw });
  return { sesMessageId: (res as { MessageId?: string }).MessageId ?? null };
}

export async function sendTransactionalEmail(params: {
  userId: string;
  teamId?: string | null;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string | null;
}) {
  const fromDomain = requireEnv("NISC_TX_EMAIL_DOMAIN");
  const fromAddress = optionalEnv("NISC_TX_FROM_EMAIL") ?? `noreply@${fromDomain}`;
  const fromName = optionalEnv("NISC_TX_FROM_NAME") ?? "Nisc Cloud®";
  const defaultReplyTo = optionalEnv("NISC_TX_REPLY_TO");
  const replyTo = params.replyTo ?? defaultReplyTo;

  if (!params.html?.trim() && !params.text?.trim()) {
    throw new Error("Either html or text must be provided.");
  }

  const campaignId = await getOrCreateTransactionalCampaign({
    userId: params.userId,
    teamId: params.teamId ?? null,
    fromEmail: fromAddress,
    fromName,
    replyTo,
  });

  const now = new Date();
  const emailId = randomUUID();

  await db.insert(niscEmEmail).values({
    id: emailId,
    campaignId,
    contactId: null,
    toEmail: params.to,
    fromEmail: fromAddress,
    subject: params.subject,
    sesMessageId: null,
    status: "SENDING",
    opens: 0,
    clicks: 0,
    sentAt: now,
    deliveredAt: null,
    openedAt: null,
    clickedAt: null,
    bouncedAt: null,
    bounceType: null,
    bounceSubType: null,
    complainedAt: null,
    complaintFeedbackType: null,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  } as any);

  try {
    const fromHeader = buildFromHeader({ fromName, fromEmail: fromAddress });
    const raw = buildRawMimeEmail({
      from: fromHeader,
      to: params.to,
      subject: stripHeaderUnsafe(params.subject),
      replyTo: replyTo ? stripHeaderUnsafe(replyTo) : null,
      text: params.text ?? null,
      html: params.html ?? null,
    });

    const res = await sendSesRawEmail({ raw });
    const sesMessageId = (res as any)?.MessageId ?? null;

    await db
      .update(niscEmEmail)
      .set({ sesMessageId, status: "SENT", updatedAt: new Date() })
      .where(eq(niscEmEmail.id, emailId));

    return { emailId, sesMessageId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send email";
    await db
      .update(niscEmEmail)
      .set({ status: "FAILED", errorMessage: msg, updatedAt: new Date() })
      .where(eq(niscEmEmail.id, emailId));
    throw err;
  }
}

