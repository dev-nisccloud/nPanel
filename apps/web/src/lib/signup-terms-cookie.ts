import { SIGNUP_TERMS_COOKIE } from "@npanel/auth/signup-terms-constants";

const COOKIE_MAX_AGE_SEC = 10 * 60;

/** Set before Google OAuth on the register page so the server can verify terms acceptance. */
export function setSignupTermsCookie(): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SIGNUP_TERMS_COOKIE}=1; Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

export function clearSignupTermsCookie(): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SIGNUP_TERMS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
