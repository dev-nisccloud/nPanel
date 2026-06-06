import { asc, desc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { nebDesignVersion, nebGenerationJob, nebMessage, } from "@npanel/db/schema/nisc-email-builder";
/** Build a text block describing prior work for chat/revision agents. */
export async function buildNebSessionHistoryContext(params) {
    const [messages, versions, jobs] = await Promise.all([
        db.query.nebMessage.findMany({
            where: eq(nebMessage.sessionId, params.sessionId),
            orderBy: [asc(nebMessage.createdAt)],
            limit: 80,
        }),
        db.query.nebDesignVersion.findMany({
            where: eq(nebDesignVersion.designId, params.designId),
            orderBy: [desc(nebDesignVersion.versionNumber)],
            limit: 15,
        }),
        db.query.nebGenerationJob.findMany({
            where: eq(nebGenerationJob.designId, params.designId),
            orderBy: [desc(nebGenerationJob.createdAt)],
            limit: 20,
        }),
    ]);
    const lines = [];
    if (jobs.length > 0) {
        lines.push("━━━ GENERATION & EDIT HISTORY ━━━");
        for (const job of [...jobs].reverse()) {
            const summary = job.output &&
                typeof job.output === "object" &&
                "changeSummary" in job.output &&
                typeof job.output.changeSummary === "string"
                ? job.output.changeSummary
                : null;
            lines.push(`- ${job.type} (${job.status})${summary ? `: ${summary}` : ""}`);
        }
    }
    if (versions.length > 0) {
        lines.push("", "━━━ SAVED VERSIONS (newest first) ━━━");
        for (const v of versions) {
            lines.push(`- v${v.versionNumber} [${v.trigger}]: ${v.changeSummary ?? "-"}`);
        }
    }
    if (messages.length > 0) {
        lines.push("", "━━━ CHAT TRANSCRIPT ━━━");
        for (const m of messages) {
            const preview = m.content.length > 500 ? `${m.content.slice(0, 500)}…` : m.content;
            lines.push(`[${m.role}]: ${preview}`);
        }
    }
    return lines.join("\n");
}
