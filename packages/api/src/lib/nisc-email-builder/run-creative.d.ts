import { buildBrandContext } from "./prompts";
import type { NebBrief } from "./types";
export type RunCreativeDesignParams = {
    jobId: string;
    designId: string;
    brief: NebBrief;
    brandKit?: Parameters<typeof buildBrandContext>[1];
    userId: string;
    teamId?: string | null;
    userFeedback?: string;
    webContext?: string | null;
};
export type DesignVariation = {
    id: string;
    url: string;
    prompt: string;
    notes: string;
    createdAt: string;
};
export declare function runNebCreativeDesign(params: RunCreativeDesignParams): Promise<{
    assistantText: string;
    creativeDesignUrl: string;
}>;
export declare function runNebChatDuringApproval(params: {
    jobId: string;
    designId: string;
    brief: NebBrief;
    userMessage: string;
    recentTranscript: string;
    creativeDesignUrl?: string | null;
    designNotes?: string;
}): Promise<{
    assistantText: string;
    action: "none" | "regenerate_design" | "ready_to_build";
}>;
