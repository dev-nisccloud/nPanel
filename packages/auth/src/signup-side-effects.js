import { db } from "@npanel/db";
import { userActivityLog } from "@npanel/db/schema/auth-extras";
import { notification, notificationActivityLog, } from "@npanel/db/schema/notifications";
import { renderWelcomeEmail } from "react-email-starter/src/email-templates";
import { sendAuthEmail } from "./transactional-email";
function frontendBaseUrl() {
    const raw = process.env.APP_URL ||
        process.env.CORS_ORIGIN ||
        process.env.VITE_PUBLIC_APP_URL ||
        "http://localhost:3002";
    return raw.replace(/\/+$/, "");
}
function requestMeta(headers) {
    const ipAddress = headers?.get("x-forwarded-for") || headers?.get("x-real-ip") || null;
    return {
        ipAddress,
        ipDisplay: ipAddress ? ` from ${ipAddress}` : "",
        userAgent: headers?.get("user-agent") || "unknown",
        ipForLog: ipAddress || "unknown",
    };
}
/** Shared DB side effects for new accounts (notification, activity log). MFA is opt-in from account settings. */
export async function completeSignupSideEffects(params) {
    const { userId, emailVerified, signupMethod, headers } = params;
    const { ipAddress, ipDisplay, userAgent, ipForLog } = requestMeta(headers);
    await db.transaction(async (tx) => {
        await tx.insert(userActivityLog).values({
            id: crypto.randomUUID(),
            userId,
            action: "SIGNUP_SUCCESS",
            description: "User successfully signed up",
            metadata: {
                signupMethod,
                emailVerified,
                acceptedTermsAndConditions: true,
            },
            ipAddress: ipForLog,
            userAgent,
            createdAt: new Date(),
        });
        const message = `Your account was successfully created${ipDisplay}. Welcome to Nisc Cloud®!`;
        const nid = crypto.randomUUID();
        await tx.insert(notification).values({
            id: nid,
            userId,
            teamId: null,
            type: "SYSTEM",
            priority: "NORMAL",
            title: "Account Created",
            message,
            link: null,
            metadata: { ipAddress, signupMethod },
            seen: false,
            readAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await tx.insert(notificationActivityLog).values({
            id: crypto.randomUUID(),
            notificationId: nid,
            userId,
            action: "CREATE",
            description: "Signup notification created",
            metadata: { ipAddress, signupMethod },
            ipAddress,
            userAgent: userAgent === "unknown" ? null : userAgent,
            createdAt: new Date(),
        });
    });
}
/** Welcome email for Google sign-up (email/password uses sendVerificationEmail instead). */
export async function sendGoogleSignupWelcomeEmail(params) {
    const loginLink = `${frontendBaseUrl()}/auth/login`;
    const html = await renderWelcomeEmail({
        userFirstname: params.name || "User",
        loginLink,
    });
    await sendAuthEmail({
        to: params.email,
        subject: "Welcome to Nisc Cloud®",
        html,
    });
}
export function isGoogleOAuthCallbackPath(path) {
    return path === "/callback/google" || path.endsWith("/callback/google");
}
/** Detect first-time Google registration in the OAuth callback after hook. */
export function isNewGoogleRegistration(returned, userCreatedAt) {
    const result = returned;
    if (result?.isRegister === true)
        return true;
    if (!userCreatedAt)
        return false;
    return Date.now() - userCreatedAt.getTime() < 120_000;
}
