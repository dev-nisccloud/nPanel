import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { nebDesign, nebDesignVersion } from "@npanel/db/schema/nisc-email-builder";
import { stripEditorArtifactsFromHtml } from "./html-sanitize-for-save";
import { processEmailHtml } from "./pipeline";

/** Apply HTML to the design and current version (used for undo/redo restore). */
export async function applyRevisionHtmlToDesign(params: {
	designId: string;
	html: string;
	changeSummary?: string;
}): Promise<{ html: string; text: string }> {
	const design = await db.query.nebDesign.findFirst({
		where: eq(nebDesign.id, params.designId),
	});
	if (!design) throw new Error("Design not found");

	const cleaned = stripEditorArtifactsFromHtml(params.html);
	const processed = processEmailHtml(cleaned);
	if (!processed.validation.ok) {
		throw new Error(processed.validation.errors.join("; "));
	}

	const now = new Date();
	if (design.currentVersionId) {
		await db
			.update(nebDesignVersion)
			.set({
				htmlContent: processed.html,
				textContent: processed.text,
				changeSummary: params.changeSummary ?? "Restored previous version",
			})
			.where(eq(nebDesignVersion.id, design.currentVersionId));
	}

	await db
		.update(nebDesign)
		.set({
			htmlContent: processed.html,
			textContent: processed.text,
			workflowPhase: "READY",
			aiStatus: "IDLE",
			updatedAt: now,
		})
		.where(eq(nebDesign.id, params.designId));

	return { html: processed.html, text: processed.text };
}
