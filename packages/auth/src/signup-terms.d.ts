export { SIGNUP_TERMS_COOKIE } from "./signup-terms-constants";
export declare function parseSignupTermsCookie(cookieHeader: string | null | undefined): boolean;
export declare function signupRequestAcceptsTerms(body: unknown): boolean;
export declare function recordTermsAcceptance(userId: string): Promise<void>;
/** Revert a Google sign-up that proceeded without terms acceptance. */
export declare function rollbackSignupWithoutTerms(userId: string, sessionId?: string): Promise<void>;
