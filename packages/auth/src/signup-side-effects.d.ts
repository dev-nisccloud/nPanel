type SignupMethod = "email_password" | "google";
/** Shared DB side effects for new accounts (notification, activity log). MFA is opt-in from account settings. */
export declare function completeSignupSideEffects(params: {
    userId: string;
    sessionId: string | undefined;
    emailVerified: boolean;
    signupMethod: SignupMethod;
    headers: Headers | undefined;
}): Promise<void>;
/** Welcome email for Google sign-up (email/password uses sendVerificationEmail instead). */
export declare function sendGoogleSignupWelcomeEmail(params: {
    userId: string;
    email: string;
    name: string | null | undefined;
}): Promise<void>;
export declare function isGoogleOAuthCallbackPath(path: string): boolean;
/** Detect first-time Google registration in the OAuth callback after hook. */
export declare function isNewGoogleRegistration(returned: unknown, userCreatedAt: Date | undefined): boolean;
export {};
