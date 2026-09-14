import type { TokenStore } from "./types";

export class MemoryTokenStore implements TokenStore {
  private token: { token: string; expiresAtMs: number } | null = null;

  async get() {
    if (!this.token || Date.now() >= this.token.expiresAtMs) return null;
    return this.token;
  }

  async set(token: string, expiresAtMs: number) {
    this.token = { token, expiresAtMs };
  }

  async clear() {
    this.token = null;
  }
}

export function basicAuth(consumerKey: string, consumerSecret: string): string {
  const raw = `${consumerKey}:${consumerSecret}`;
  if (typeof Buffer !== "undefined") return Buffer.from(raw).toString("base64");
  return btoa(raw);
}

export async function fetchJson(
  url: string,
  init: RequestInit,
): Promise<{ status: number; text: string; json: unknown | null }> {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: unknown | null = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, text, json };
}
