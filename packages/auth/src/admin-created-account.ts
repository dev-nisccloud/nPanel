/**
 * Accounts created by Nisc HQ staff get one "set your password" email instead of the
 * sign-up verification email. Opening that link proves inbox access, so the reset marks
 * the email as verified (see onPasswordReset).
 */
const SUPPRESS_WINDOW_MS = 2 * 60 * 1000;
const suppressedSignupVerification = new Map<string, number>();

export function suppressSignupVerificationEmail(email: string): void {
  suppressedSignupVerification.set(email.trim().toLowerCase(), Date.now() + SUPPRESS_WINDOW_MS);
}

export function consumeSignupVerificationSuppression(email: string): boolean {
  const key = email.trim().toLowerCase();
  const until = suppressedSignupVerification.get(key);
  if (until === undefined) return false;
  suppressedSignupVerification.delete(key);
  return until > Date.now();
}

export const SET_PASSWORD_LINK_TTL_SEC = 72 * 60 * 60;
