import { apiUrl } from "./auth-client";

export type MfaStatus = {
  required: boolean;
  verified: boolean;
  enabled?: boolean;
  setupRequired?: boolean;
  reauthRequired?: boolean;
};

export type MfaIntent = "LOGIN" | "SETUP";

export async function fetchMfaStatus(): Promise<MfaStatus> {
  const res = await fetch(apiUrl("/api/auth/mfa/status"), {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || "Failed to fetch MFA status");
  }

  return (await res.json()) as MfaStatus;
}

export function mfaIntentFromStatus(status: MfaStatus): MfaIntent {
  return status.setupRequired ? "SETUP" : "LOGIN";
}

export function mfaVerificationRequired(status: MfaStatus): boolean {
  return Boolean(status.enabled) && status.required && !status.verified;
}

export async function sendMfaChallenge(intent: MfaIntent = "LOGIN"): Promise<string | null> {
  const res = await fetch(apiUrl("/api/auth/mfa/challenge"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent }),
  });

  const data = (await res.json().catch(() => null)) as
    | { error?: string; expiresAt?: string }
    | null;

  if (!res.ok) {
    throw new Error(data?.error || "Failed to send verification code");
  }

  return data?.expiresAt ?? null;
}

export async function verifyMfaCode(code: string, intent: MfaIntent): Promise<void> {
  const res = await fetch(apiUrl("/api/auth/mfa/verify"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, intent }),
  });

  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) {
    throw new Error(data?.error || "Verification failed");
  }
}
