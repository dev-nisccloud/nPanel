import * as crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { generateInvoicePdfBuffer } from "./generate-invoice-pdf";
import { getInvoiceDetailForPdf } from "./invoice-for-pdf";
import { ensureInvoiceKraSyncedForDelivery, } from "./invoice-kra-sync";
import { invoiceRequiresKraSyncBeforeEmail, isInvoiceKraSynced } from "./invoice-kra-status";
import { sanitizeInvoicePdfFilename } from "./invoice-pdf-data";
export async function prepareInvoiceEmailDelivery(dbClient, invoiceId) {
    let invoiceDetail = await getInvoiceDetailForPdf(dbClient, invoiceId);
    if (invoiceRequiresKraSyncBeforeEmail(invoiceDetail.kraStatus)) {
        const kraResult = await ensureInvoiceKraSyncedForDelivery(invoiceId);
        if (!kraResult.ok) {
            throw kraSyncPreconditionError(kraResult);
        }
        invoiceDetail = await getInvoiceDetailForPdf(dbClient, invoiceId);
    }
    const pdfBuffer = await generateInvoicePdfBuffer(invoiceDetail);
    const pdfFilename = sanitizeInvoicePdfFilename(invoiceDetail.invoiceNumber ?? "Invoice");
    return {
        invoiceDetail,
        pdfBuffer,
        pdfFilename,
        kraSynced: isInvoiceKraSynced(invoiceDetail.kraStatus),
    };
}
function kraSyncPreconditionError(result) {
    return new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Invoice must be synced to KRA eTIMS before email can be sent. ${result.reason}`,
        cause: { kraStatus: result.kraStatus, reason: result.reason },
    });
}
const stripHeaderUnsafe = (value) => value.replace(/[\r\n]+/g, " ").trim();
const toRfc2047Utf8 = (value) => {
    if (/^[\x00-\x7F]*$/.test(value))
        return value;
    const buf = Buffer.from(value, "utf8");
    return `=?UTF-8?B?${buf.toString("base64")}?=`;
};
const parseDisplayEmail = (value) => {
    const v = stripHeaderUnsafe(value);
    const m = v.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
    if (m)
        return { name: m[1]?.trim() || null, email: m[2].trim() };
    return { name: null, email: v };
};
const buildFromHeader = (fromName, fromEmail) => {
    const parsed = parseDisplayEmail(fromEmail);
    const name = stripHeaderUnsafe(fromName ?? parsed.name ?? "");
    const email = stripHeaderUnsafe(parsed.email);
    return name ? `${toRfc2047Utf8(name)} <${email}>` : email;
};
function buildRawMimeWithPdf(params) {
    const boundaryMixed = `npanel-mixed-${crypto.randomUUID()}`;
    const boundaryAlt = `npanel-alt-${crypto.randomUUID()}`;
    const lines = [];
    lines.push(`From: ${params.from}`);
    lines.push(`To: ${params.to}`);
    if (params.cc && params.cc.length > 0) {
        lines.push(`Cc: ${params.cc.join(", ")}`);
    }
    lines.push(`Subject: ${toRfc2047Utf8(params.subject)}`);
    if (params.replyTo)
        lines.push(`Reply-To: ${params.replyTo}`);
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
export async function sendInvoiceReminderEmail(params) {
    const { getSesClient, sendSesRawEmail } = await import("./ses-client");
    const fromDomainRaw = process.env.NISC_TX_EMAIL_DOMAIN?.trim();
    const fromDomain = fromDomainRaw && !fromDomainRaw.includes("@") ? fromDomainRaw : undefined;
    const fromEmail = (process.env.NISC_TX_FROM_EMAIL?.trim() ||
        (fromDomain ? `noreply@${fromDomain}` : "noreply@npanel.com"));
    const fromName = process.env.NISC_TX_FROM_NAME?.trim() || "Nisc Cloud®";
    const replyTo = process.env.NISC_TX_REPLY_TO?.trim() || undefined;
    const cc = params.cc?.filter(Boolean);
    const bcc = params.bcc?.filter(Boolean);
    const destinations = [params.to, ...(cc ?? []), ...(bcc ?? [])];
    const raw = buildRawMimeWithPdf({
        from: buildFromHeader(fromName, fromEmail),
        to: params.to,
        cc,
        subject: stripHeaderUnsafe(params.subject),
        replyTo: replyTo ? stripHeaderUnsafe(replyTo) : null,
        html: params.html,
        attachmentFilename: params.pdfFilename,
        attachment: params.pdfBuffer,
    });
    const ses = getSesClient();
    await sendSesRawEmail(ses, {
        RawMessage: { Data: raw },
        Destinations: destinations,
    });
}
