import { ZEEPO_AI_WELCOME_TOKEN_GRANT } from "./zeepo-ai-billing";
export type FreeTokenGrantResult = {
    granted: false;
    reason: "already_granted" | "no_qualifying_service" | "has_prior_usage" | "no_payg_plan" | "agency_skip";
} | {
    granted: true;
    tokensGranted: number;
    balanceAfter: number;
};
/** Active non–Zeepo-AI subscription = paid/held service with us. */
export declare function teamHasQualifyingService(teamId: string): Promise<boolean>;
/**
 * Attempt to grant welcome tokens. Safe for concurrent callers (FOR UPDATE + flag).
 */
export declare function tryGrantWelcomeTokens(params: {
    teamId: string;
    userId: string;
}): Promise<FreeTokenGrantResult>;
/** Read-only eligibility (does not grant). */
export declare function checkWelcomeTokenEligibility(teamId: string): Promise<{
    eligible: boolean;
    reason?: string;
    tokensIfGranted: number;
}>;
export { ZEEPO_AI_WELCOME_TOKEN_GRANT };
