import { TRPCError } from "@trpc/server";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { niscEmCampaign, niscEmEmail, team, teamMember } from "@npanel/db/schema";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { getSesClient, sendSesRawEmail } from "../../lib/ses-client";
function isAgencySuperAdminRole(role) {
    return role === "AGENCY_SUPER_ADMIN";
}
function requireEnv(name) {
    const v = process.env[name];
    if (!v || !v.trim()) {
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Missing required environment variable: ${name}`,
        });
    }
    return v.trim();
}
function optionalEnv(name) {
    const v = process.env[name];
    const t = v?.trim();
    return t ? t : null;
}
function toRfc2047Utf8(value) {
    if (/^[\x00-\x7F]*$/.test(value))
        return value;
    const buf = Buffer.from(value, "utf8");
    const b64 = buf.toString("base64");
    return `=?UTF-8?B?${b64}?=`;
}
function stripHeaderUnsafe(value) {
    // Prevent CRLF/header injection
    return value.replace(/[\r\n]+/g, " ").trim();
}
function parseDisplayEmail(value) {
    const v = stripHeaderUnsafe(value);
    const m = v.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
    if (m) {
        return { name: m[1]?.trim() || null, email: m[2].trim() };
    }
    return { name: null, email: v };
}
function buildFromHeader(params) {
    const parsed = parseDisplayEmail(params.fromEmail);
    const name = stripHeaderUnsafe(params.fromName ?? parsed.name ?? "");
    const email = stripHeaderUnsafe(parsed.email);
    return name ? `${toRfc2047Utf8(name)} <${email}>` : email;
}
function buildRawMimeEmail(params) {
    const boundary = `npanel-${randomUUID()}`;
    const lines = [];
    lines.push(`From: ${params.from}`);
    lines.push(`To: ${params.to}`);
    lines.push(`Subject: ${toRfc2047Utf8(params.subject)}`);
    if (params.replyTo)
        lines.push(`Reply-To: ${params.replyTo}`);
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
async function getOrCreateTransactionalCampaign(params) {
    const keyName = "Transactional";
    const existing = await db.query.niscEmCampaign.findFirst({
        where: and(eq(niscEmCampaign.userId, params.userId), params.teamId ? eq(niscEmCampaign.teamId, params.teamId) : eq(niscEmCampaign.teamId, null), eq(niscEmCampaign.name, keyName)),
        columns: { id: true },
    });
    if (existing?.id)
        return existing.id;
    const now = new Date();
    const id = randomUUID();
    await db.insert(niscEmCampaign).values({
        id,
        teamId: params.teamId,
        userId: params.userId,
        domainId: null,
        audienceId: null,
        name: keyName,
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
    });
    return id;
}
export const niscEmailMarketingTransactionalRouter = router({
    send: protectedProcedure
        .input(z.object({
        to: z.string().email(),
        subject: z.string().min(1).max(998),
        html: z.string().optional(),
        text: z.string().optional(),
        replyTo: z.string().email().optional().nullable(),
        teamId: z.string().min(1).optional().nullable(),
    }))
        .output(z.object({
        emailId: z.string(),
        sesMessageId: z.string().nullable(),
        status: z.string(),
    }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        const userRole = ctx.session?.user?.role;
        const fromDomain = requireEnv("NISC_TX_EMAIL_DOMAIN");
        const fromAddress = optionalEnv("NISC_TX_FROM_EMAIL") ?? `noreply@${fromDomain}`;
        const fromName = optionalEnv("NISC_TX_FROM_NAME") ?? "nPanel";
        const defaultReplyTo = optionalEnv("NISC_TX_REPLY_TO");
        const replyTo = input.replyTo ?? defaultReplyTo;
        if (!input.html?.trim() && !input.text?.trim()) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Either html or text must be provided.",
            });
        }
        if (input.teamId) {
            const [teamRow] = await db
                .select({ id: team.id, createdById: team.createdById })
                .from(team)
                .where(eq(team.id, input.teamId))
                .limit(1);
            if (!teamRow) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Team not found" });
            }
            if (!isAgencySuperAdminRole(userRole) && teamRow.createdById !== userId) {
                const [membership] = await db
                    .select({ id: teamMember.id })
                    .from(teamMember)
                    .where(and(eq(teamMember.teamId, input.teamId), eq(teamMember.userId, userId)))
                    .limit(1);
                if (!membership) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have access to this team",
                    });
                }
            }
        }
        const campaignId = await getOrCreateTransactionalCampaign({
            userId,
            teamId: input.teamId ?? null,
            fromEmail: fromAddress,
            fromName,
            replyTo,
        });
        const now = new Date();
        const emailId = randomUUID();
        const normalizedHtml = input.html?.trim() ? input.html : null;
        const normalizedText = input.text?.trim() ? input.text : null;
        // Keep the transactional campaign in sync with the latest sent content.
        // Event detail preview reads from campaign content today.
        await db
            .update(niscEmCampaign)
            .set({
            subject: input.subject,
            fromEmail: fromAddress,
            fromName,
            replyTo: replyTo ?? null,
            htmlContent: normalizedHtml,
            textContent: normalizedText,
            updatedAt: now,
        })
            .where(eq(niscEmCampaign.id, campaignId));
        // Insert first so SNS webhook can link events even if they arrive fast.
        await db.insert(niscEmEmail).values({
            id: emailId,
            campaignId,
            contactId: null,
            toEmail: input.to,
            fromEmail: fromAddress,
            fromName: fromName ?? null,
            replyTo: replyTo ?? null,
            subject: input.subject,
            htmlContent: normalizedHtml,
            textContent: normalizedText,
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
        });
        try {
            const ses = getSesClient();
            const raw = buildRawMimeEmail({
                from: buildFromHeader({ fromName, fromEmail: fromAddress }),
                to: input.to,
                subject: stripHeaderUnsafe(input.subject),
                replyTo: replyTo ? stripHeaderUnsafe(replyTo) : null,
                text: normalizedText,
                html: normalizedHtml,
            });
            const res = await sendSesRawEmail(ses, {
                RawMessage: { Data: raw },
            });
            const messageId = res?.MessageId ?? null;
            await db
                .update(niscEmEmail)
                .set({
                sesMessageId: messageId,
                status: "SENT",
                updatedAt: new Date(),
            })
                .where(eq(niscEmEmail.id, emailId));
            return { emailId, sesMessageId: messageId, status: "SENT" };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to send email";
            await db
                .update(niscEmEmail)
                .set({
                status: "FAILED",
                errorMessage: msg,
                updatedAt: new Date(),
            })
                .where(eq(niscEmEmail.id, emailId));
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
        }
    }),
});
