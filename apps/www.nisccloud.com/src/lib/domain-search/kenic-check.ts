import { trpcMutation } from "@/lib/domain-search/api.ts";

/** One normalised availability row as returned by `kenic.domainCheck.check`. */
export type KenicCheckItem = {
  domain: string;
  available: boolean;
  reason?: string;
  currency?: string;
  createFee?: { amount: number; currency: string };
  renewFee?: { amount: number; currency: string };
  transferFee?: { amount: number; currency: string };
};

/**
 * The KeNIC registry answers checks one at a time and its first check after idle can take
 * ~30 s, so the browser must wait longer than the default 30 s tRPC timeout.
 */
const KENIC_TIMEOUT_MS = 60_000;
/** Collect lookups fired by sibling sections in the same render into one registry call. */
const COALESCE_WINDOW_MS = 40;
/** Availability is shown from a verified registry answer for at most this long; checkout re-verifies. */
const RESULT_TTL_MS = 60_000;

type Deferred = { resolve: (item: KenicCheckItem | undefined) => void; reject: (err: unknown) => void };

const cache = new Map<string, { at: number; item: KenicCheckItem | undefined }>();
const inflight = new Map<string, Promise<KenicCheckItem | undefined>>();
let queue = new Map<string, Deferred[]>();
/** Lookups nobody is waiting on (e.g. price probes); sent only when no customer check is queued. */
let backgroundQueue = new Map<string, Deferred[]>();
let timer: ReturnType<typeof setTimeout> | null = null;
/**
 * The registry serialises checks, so parallel requests only queue upstream and share one
 * timeout budget. Keep one request in flight and fold everything asked meanwhile into the next.
 */
let busy = false;

async function flush() {
  timer = null;
  if (busy) return;
  busy = true;
  const background = queue.size === 0;
  const batch = background ? backgroundQueue : queue;
  if (background) backgroundQueue = new Map();
  else queue = new Map();
  const domains = [...batch.keys()];
  if (domains.length === 0) {
    busy = false;
    return;
  }
  try {
    const data = await trpcMutation<{ normalized?: KenicCheckItem[] }>(
      "kenic.domainCheck.check",
      { domains, withFee: true, currency: "KES", periodYears: 1 },
      KENIC_TIMEOUT_MS,
    );
    const byDomain = new Map((data?.normalized ?? []).map((n) => [n.domain.toLowerCase(), n]));
    const now = Date.now();
    for (const [domain, waiters] of batch) {
      const item = byDomain.get(domain);
      cache.set(domain, { at: now, item });
      inflight.delete(domain);
      for (const w of waiters) w.resolve(item);
    }
  } catch (err) {
    for (const [domain, waiters] of batch) {
      inflight.delete(domain);
      for (const w of waiters) w.reject(err);
    }
  } finally {
    busy = false;
    if ((queue.size > 0 || backgroundQueue.size > 0) && !timer) timer = setTimeout(() => void flush(), 0);
  }
}

function lookup(domain: string, background: boolean): Promise<KenicCheckItem | undefined> {
  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < RESULT_TTL_MS) return Promise.resolve(hit.item);
  const pending = inflight.get(domain);
  if (pending) return pending;
  const promise = new Promise<KenicCheckItem | undefined>((resolve, reject) => {
    const target = background ? backgroundQueue : queue;
    const waiters = target.get(domain) ?? [];
    waiters.push({ resolve, reject });
    target.set(domain, waiters);
  });
  inflight.set(domain, promise);
  if (!timer && !busy) timer = setTimeout(() => void flush(), COALESCE_WINDOW_MS);
  return promise;
}

/**
 * Availability + fees for KeNIC domains. Concurrent callers share one registry request and
 * a short-lived cache; a failed lookup rejects (never resolves as "available").
 * `background` lookups never share a request with, or go ahead of, a customer's own check.
 */
export async function checkKenicDomains(
  domains: string[],
  options: { background?: boolean } = {},
): Promise<{ normalized: KenicCheckItem[] }> {
  const unique = [...new Set(domains.map((d) => d.trim().toLowerCase()).filter(Boolean))];
  const items = await Promise.all(unique.map((d) => lookup(d, options.background ?? false)));
  return { normalized: items.filter((i): i is KenicCheckItem => i !== undefined) };
}

/** Clears cached answers for these domains so a retry asks the registry again. */
export function forgetKenicDomains(domains: string[]): void {
  for (const d of domains) cache.delete(d.trim().toLowerCase());
}
