import { apiUrl } from "./auth-client";

export type ReauthStatus = {
  required: boolean;
  email?: string | null;
};

export async function fetchReauthStatus(): Promise<ReauthStatus> {
  const res = await fetch(apiUrl("/api/auth/reauth/status"), {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || "Failed to fetch re-authentication status");
  }

  return (await res.json()) as ReauthStatus;
}

export async function submitReauthPassword(password: string): Promise<void> {
  const res = await fetch(apiUrl("/api/auth/reauth"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) {
    throw new Error(data?.error || "Re-authentication failed");
  }
}
