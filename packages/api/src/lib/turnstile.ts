import { TRPCError } from "@trpc/server";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** No-op until TURNSTILE_SECRET_KEY is set, so forms keep working before keys exist. */
export async function assertTurnstile(token: string | undefined, ip?: string | null): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return;

  if (!token) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Please complete the security check." });
  }

  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== "unknown") body.set("remoteip", ip);

  let success = false;
  try {
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(8000) });
    const data = (await res.json()) as { success?: boolean };
    success = data.success === true;
  } catch (error) {
    console.error("[turnstile] verification request failed:", error);
  }

  if (!success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The security check failed. Refresh the page and try again.",
    });
  }
}
