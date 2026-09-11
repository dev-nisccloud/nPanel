/**
 * Shared email helpers for the @npanel/api package.
 * Uses AWS SES (sendRawEmail) via the shared ses-client - the same transport
 * used by auth, teams invites, and agency invoicing flows.
 * Previously used Resend; replaced because nisccloud.com was not verified there.
 */
import * as crypto from "node:crypto";
import { getSesClient, getSesConfigurationSetName } from "./ses-client";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Internal helpers (mirrors transactional-email.ts in @npanel/auth)
// ---------------------------------------------------------------------------

function toRfc2047Utf8(value: string): string {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const buf = Buffer.from(value, "utf8");
  return `=?UTF-8?B?${buf.toString("base64")}?=`;
}

function stripHeaderUnsafe(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function parseDisplayEmail(value: string): { name: string | null; email: string } {
  const v = stripHeaderUnsafe(value);
  const m = v.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (m) return { name: m[1]?.trim() || null, email: m[2]!.trim() };
  return { name: null, email: v };
}

function buildFromHeader(fromEmail: string, fromName?: string | null): string {
  const parsed = parseDisplayEmail(fromEmail);
  const name = stripHeaderUnsafe(fromName ?? parsed.name ?? "");
  const email = stripHeaderUnsafe(parsed.email);
  return name ? `${toRfc2047Utf8(name)} <${email}>` : email;
}

function buildRawMimeEmail(params: {
  from: string;
  to: string;
  subject: string;
  replyTo?: string | null;
  cc?: string[];
  bcc?: string[];
  text?: string | null;
  html?: string | null;
}): Buffer {
  const boundary = `npanel-${crypto.randomUUID()}`;
  const lines: string[] = [];
  lines.push(`From: ${params.from}`);
  lines.push(`To: ${stripHeaderUnsafe(params.to)}`);
  lines.push(`Subject: ${toRfc2047Utf8(stripHeaderUnsafe(params.subject))}`);
  if (params.replyTo) lines.push(`Reply-To: ${stripHeaderUnsafe(params.replyTo)}`);
  if (params.cc?.length) lines.push(`Cc: ${params.cc.map(stripHeaderUnsafe).join(", ")}`);
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

function buildRawMimeWithPdf(params: {
  from: string;
  to: string;
  subject: string;
  replyTo?: string | null;
  cc?: string[];
  bcc?: string[];
  html: string;
  attachmentFilename: string;
  attachment: Buffer;
}): Buffer {
  const boundaryMixed = `npanel-mixed-${crypto.randomUUID()}`;
  const boundaryAlt = `npanel-alt-${crypto.randomUUID()}`;
  const lines: string[] = [];
  lines.push(`From: ${params.from}`);
  lines.push(`To: ${stripHeaderUnsafe(params.to)}`);
  if (params.cc?.length) lines.push(`Cc: ${params.cc.map(stripHeaderUnsafe).join(", ")}`);
  lines.push(`Subject: ${toRfc2047Utf8(stripHeaderUnsafe(params.subject))}`);
  if (params.replyTo) lines.push(`Reply-To: ${stripHeaderUnsafe(params.replyTo)}`);
  lines.push("MIME-Version: 1.0");
  lines.push(`Content-Type: multipart/mixed; boundary="${boundaryMixed}"`);
  lines.push("");

  lines.push(`--${boundaryMixed}`);
  lines.push(`Content-Type: multipart/alternative; boundary="${boundaryAlt}"`);
  lines.push("");
  lines.push(`--${boundaryAlt}`);
  lines.push('Content-Type: text/html; charset="UTF-8"');
  lines.push("Content-Transfer-Encoding: 7bit");
  lines.push("");
  lines.push(params.html);
  lines.push("");
  lines.push(`--${boundaryAlt}--`);
  lines.push("");

  lines.push(`--${boundaryMixed}`);
  lines.push(`Content-Type: application/pdf; name="${params.attachmentFilename}"`);
  lines.push("Content-Transfer-Encoding: base64");
  lines.push(`Content-Disposition: attachment; filename="${params.attachmentFilename}"`);
  lines.push("");
  lines.push(params.attachment.toString("base64"));
  lines.push("");
  lines.push(`--${boundaryMixed}--`);
  lines.push("");
  return Buffer.from(lines.join("\r\n"), "utf8");
}

function getSenderConfig() {
  const fromDomainRaw = process.env.NISC_TX_EMAIL_DOMAIN?.trim();
  const fromDomain =
    fromDomainRaw && !fromDomainRaw.includes("@") ? fromDomainRaw : undefined;
  const fromEmail =
    process.env.NISC_TX_FROM_EMAIL?.trim() ??
    (fromDomain ? `noreply@${fromDomain}` : "noreply@nisccloud.com");
  const fromName = process.env.NISC_TX_FROM_NAME?.trim() ?? "Nisc Cloud®";
  const replyTo = process.env.NISC_TX_REPLY_TO?.trim() ?? null;
  return { fromEmail, fromName, replyTo };
}

// ---------------------------------------------------------------------------
// Public API (same signature as before so all call-sites keep working)
// ---------------------------------------------------------------------------

/**
 * Send a transactional email via AWS SES.
 * Retries on transient (non-permanent) failures with exponential back-off.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  cc,
  bcc,
  maxRetries = 3,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  /** Note: attachments are not supported with SES raw email in this helper. */
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
  cc?: string[];
  bcc?: string[];
  maxRetries?: number;
}) {
  if (!html?.trim() && !text?.trim()) {
    throw new Error("Either html or text must be provided");
  }

  const { fromEmail, fromName, replyTo } = getSenderConfig();
  const configSet = getSesConfigurationSetName();

  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const raw = buildRawMimeEmail({
        from: buildFromHeader(fromEmail, fromName),
        to,
        subject,
        replyTo,
        cc,
        bcc,
        html: html ?? null,
        text: text ?? null,
      });

      const ses = getSesClient();
      const destinations = [to, ...(cc ?? []), ...(bcc ?? [])];

      const res = await ses.sendRawEmail({
        RawMessage: { Data: raw },
        Destinations: destinations,
        ...(configSet ? { ConfigurationSetName: configSet } : {}),
      });

      console.log("Email sent successfully via SES:", res.MessageId);
      return {
        id: res.MessageId,
        fromEmail,
        fromName,
        replyTo,
      };
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);

      // Permanent failures - don't retry
      const isPermanent =
        msg.includes("MessageRejected") ||
        msg.includes("InvalidParameterValue") ||
        msg.includes("InvalidParameterException");

      if (isPermanent || attempt === maxRetries - 1) {
        console.error("Email send failed (SES):", err);
        throw err;
      }

      const backoffDelay = Math.pow(2, attempt) * 1000;
      console.log(`Error sending email via SES, retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await delay(backoffDelay);
    }
  }

  throw lastError;
}

/**
 * Send HTML email with a single PDF attachment via AWS SES raw MIME.
 */
export async function sendEmailWithPdf({
  to,
  subject,
  html,
  attachmentFilename,
  attachment,
  cc,
  bcc,
  maxRetries = 3,
}: {
  to: string;
  subject: string;
  html: string;
  attachmentFilename: string;
  attachment: Buffer;
  cc?: string[];
  bcc?: string[];
  maxRetries?: number;
}) {
  if (!html.trim()) {
    throw new Error("html must be provided");
  }

  const { fromEmail, fromName, replyTo } = getSenderConfig();
  const configSet = getSesConfigurationSetName();

  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const raw = buildRawMimeWithPdf({
        from: buildFromHeader(fromEmail, fromName),
        to,
        subject,
        replyTo,
        cc,
        bcc,
        html,
        attachmentFilename,
        attachment,
      });

      const ses = getSesClient();
      const destinations = [to, ...(cc ?? []), ...(bcc ?? [])];

      const res = await ses.sendRawEmail({
        RawMessage: { Data: raw },
        Destinations: destinations,
        ...(configSet ? { ConfigurationSetName: configSet } : {}),
      });

      console.log("Email with PDF sent successfully via SES:", res.MessageId);
      return {
        id: res.MessageId,
        fromEmail,
        fromName,
        replyTo,
      };
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);

      const isPermanent =
        msg.includes("MessageRejected") ||
        msg.includes("InvalidParameterValue") ||
        msg.includes("InvalidParameterException");

      if (isPermanent || attempt === maxRetries - 1) {
        console.error("Email with PDF send failed (SES):", err);
        throw err;
      }

      const backoffDelay = Math.pow(2, attempt) * 1000;
      console.log(
        `Error sending email with PDF via SES, retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${maxRetries})`,
      );
      await delay(backoffDelay);
    }
  }

  throw lastError;
}

/**
 * Send multiple emails sequentially (rate-limiting friendly).
 * Never throws - returns per-email success/failure so callers can handle individually.
 */
export async function sendEmailBatch(
  emails: Array<{
    to: string;
    subject: string;
    html?: string;
    text?: string;
    cc?: string[];
  }>,
  delayBetweenEmails = 300,
): Promise<Array<{ success: boolean; email: string; error?: string }>> {
  const results: Array<{ success: boolean; email: string; error?: string }> = [];

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i]!;
    try {
      await sendEmail(email);
      results.push({ success: true, email: email.to });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`Failed to send email to ${email.to}:`, errorMessage);
      results.push({ success: false, email: email.to, error: errorMessage });
    }

    // Delay between sends (skip after last)
    if (i < emails.length - 1) {
      await delay(delayBetweenEmails);
    }
  }

  return results;
}
