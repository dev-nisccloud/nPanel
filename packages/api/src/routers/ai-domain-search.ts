import { TRPCError } from "@trpc/server";
import Replicate from "replicate";
import { z } from "zod";
import { env } from "@npanel/env/server";
import { protectedProcedure, router } from "../trpc";

export const AI_DOMAIN_SEARCH_MODEL = "anthropic/claude-4.5-haiku";

// ---------- schemas ----------

const generateInputSchema = z.object({
  businessDescription: z
    .string()
    .trim()
    .min(40, "Please enter a more detailed business description (at least 40 characters).")
    .max(12_000, "Description is too long."),
});

const nameIdeaSchema = z.object({
  businessName: z.string().trim().min(1).max(160),
  businessDescription: z.string().trim().min(1).max(900),
  domainName: z
    .string()
    .trim()
    .min(2)
    .max(63)
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      "domainName must be a valid DNS label: lowercase letters/digits/hyphens, no leading or trailing hyphens."
    ),
});

const generateOutputSchema = z.object({
  suggestions: z.array(nameIdeaSchema).min(6).max(6),
});

// ---------- prompts ----------

function buildSystemPrompt(): string {
  return `You are a sharp, opinionated naming strategist hired to name things that end up in Fast Company.
Your task: suggest 6 business names with matching domain labels. You do NOT default to safe, generic, or category-average suggestions.

## What makes a great name:
- Memorability over clarity: "Stripe" or "Notion" beats "PaymentSolutionsPro". Evocative beats descriptive.
- Phonetic appeal: easy to say aloud, spell from hearing, and remember 24 hours later.
- Distinctiveness: avoid tired suffixes like "-ify", "-ly", "-hub", "-io", "-pro", "-app", "-tech", "-connect", "-solutions".
- No generic mashups: never glue two category-obvious words together (e.g. "QuickShip", "SmartLoan").

## You MUST use each naming strategy exactly twice across the 6 suggestions (2 of each):
1. "invented_portmanteau" — blend two concepts into something new (e.g. Pinterest = pin + interest)
2. "unexpected_noun" — a familiar word in an unfamiliar category context (e.g. Apple for computers)
3. "evocative_metaphor" — feels emotionally right without being literal (e.g. Slack, Notion, Drift)

That means: 2 invented_portmanteau + 2 unexpected_noun + 2 evocative_metaphor = 6 total.
The two suggestions within each strategy must feel clearly different from each other — different sounds, lengths, and angles.

## Domain label rules (CRITICAL — read carefully):
- The domain label is the SLD only — no dots, no TLD.
- Lowercase Latin letters, digits, and hyphens only; 2–63 characters.
- NEVER start or end with a hyphen.
- STRONGLY PREFER a single unhyphenated word (e.g. "peleka", "savanu", "groundspeed", "nexara").
- Only use a hyphen if the name is genuinely two separate standalone words that cannot be merged (e.g. "go-relay"). If the name can be written as one continuous word, write it as one word — no hyphen.
- Do NOT add hyphens to separate syllables or improve readability. "kopa-cloud" is WRONG if "kopacloud" works. "get-relay" is WRONG if "getrelay" works.
- When in doubt: no hyphen.

## Output format:
Valid JSON only — a single **flat** array of exactly 6 objects (array.length === 6). No markdown, no code fences, no commentary before or after.
Each object must have exactly these keys:
- "businessName": string — the brand name as it would appear in a logo
- "domainName": string — SLD only, strongly prefer a single unhyphenated word
- "namingStrategy": exactly one of: "invented_portmanteau", "unexpected_noun", "evocative_metaphor"
- "businessDescription": 2–3 sentences on WHY this name works — emotional resonance, audience fit, memorability
- "domainRationale": 1 sentence on why this domain label is the right choice`;
}

function buildUserPrompt(businessDescription: string): string {
  return `Business description:

---
${businessDescription}
---

Return exactly 6 JSON objects in one **flat** array (not nested inside another array). The array length must be 6. Use each namingStrategy exactly twice (2 invented_portmanteau + 2 unexpected_noun + 2 evocative_metaphor). The two names within each strategy must be clearly different from each other. Domain labels should be single unhyphenated words wherever possible.`;
}

// ---------- helpers ----------

async function collectTextOutput(output: unknown): Promise<string> {
  if (typeof output === "string") return output;
  if (Array.isArray(output))
    return output.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join("");
  if (output != null && typeof output === "object" && Symbol.asyncIterator in output) {
    let acc = "";
    for await (const chunk of output as AsyncIterable<unknown>) {
      acc += typeof chunk === "string" ? chunk : String(chunk);
    }
    return acc;
  }
  throw new Error(`Unexpected model output type from Replicate: ${typeof output}`);
}

function stripCodeFences(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/s, "");
  }
  return t.trim();
}

/** Extract first top-level JSON array substring (bracket depth, strings ignored). */
function extractFirstTopLevelJsonArray(s: string): string | null {
  const start = s.indexOf("[");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i]!;
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Parse model output into a JSON value. Prefer parsing the whole string; if that fails,
 * try the first balanced top-level JSON array substring.
 */
function parseSuggestionsJson(text: string): unknown {
  const stripped = stripCodeFences(text);
  try {
    return JSON.parse(stripped);
  } catch {
    const slice = extractFirstTopLevelJsonArray(stripped);
    if (slice) {
      try {
        return JSON.parse(slice);
      } catch {
        // fall through
      }
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The AI did not return valid JSON. Please try again.",
    });
  }
}

const ARRAY_WRAPPER_KEYS = ["suggestions", "ideas", "results", "names", "data", "output", "items"] as const;

/**
 * Normalize model JSON to a flat array of suggestion objects.
 * Handles: top-level array, { suggestions: [...] }, and accidental [[ ... ]] wrapping.
 */
function extractSuggestionRows(parsed: unknown): unknown[] {
  let cur: unknown = parsed;

  if (cur && typeof cur === "object" && !Array.isArray(cur)) {
    const o = cur as Record<string, unknown>;
    let found: unknown[] | undefined;
    for (const key of ARRAY_WRAPPER_KEYS) {
      const v = o[key];
      if (Array.isArray(v) && v.length > 0) {
        found = v;
        break;
      }
    }
    if (!found) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "The AI returned an object without a suggestions array. Please try again.",
      });
    }
    cur = found;
  }

  if (!Array.isArray(cur)) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The AI did not return a JSON array of suggestions. Please try again.",
    });
  }

  // Common mistake: [[{...}, ...]] — one outer array wrapping the real list
  if (cur.length === 1 && Array.isArray(cur[0])) {
    cur = cur[0] as unknown[];
  }

  return cur;
}

/**
 * Removes unnecessary hyphens from a domain label.
 * Prefers a single unhyphenated word — only keeps hyphens if the
 * dehyphenated form would be invalid (too long, empty, etc.).
 */
function cleanDomainLabel(raw: string): string {
  const normalized = raw.trim().toLowerCase();

  const dehyphenated = normalized.replace(/-/g, "");
  if (dehyphenated.length >= 2 && dehyphenated.length <= 63 && /^[a-z0-9]+$/.test(dehyphenated)) {
    return dehyphenated;
  }

  const validLabel = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  if (validLabel.test(normalized)) return normalized;

  return normalized.replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}

async function runReplicateWithTimeout(
  replicate: Replicate,
  input: Record<string, unknown>,
  maxMs: number
): Promise<unknown> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`timed out after ${maxMs / 1000}s`)), maxMs)
  );
  return Promise.race([
    replicate.run(AI_DOMAIN_SEARCH_MODEL as `${string}/${string}`, { input }),
    timeout,
  ]);
}

// ---------- router ----------

export const aiDomainSearchRouter = router({
  generateNameIdeas: protectedProcedure
    .input(generateInputSchema)
    .output(generateOutputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be signed in." });
      }

      const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

      let rawText: string;
      try {
        const output = await runReplicateWithTimeout(
          replicate,
          {
            system_prompt: buildSystemPrompt(),
            prompt: buildUserPrompt(input.businessDescription),
            max_tokens: 8192,
          },
          120_000
        );
        rawText = await collectTextOutput(output);
      } catch (e) {
        if (e instanceof TRPCError) throw e;
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "AI is temporarily busy. Please wait a moment and try again.",
          });
        }
        if (msg.includes("timed out")) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "The AI request took too long. Please try again.",
          });
        }
        console.error("[aiDomainSearch.generateNameIdeas] Replicate error:", e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not generate name ideas. Please try again.",
        });
      }

      const parsed = parseSuggestionsJson(rawText);
      const rows = extractSuggestionRows(parsed);

      if (rows.length !== 6) {
        console.warn(
          `[aiDomainSearch.generateNameIdeas] Expected 6 suggestion rows, got ${rows.length}. Raw (truncated):`,
          rawText.slice(0, 500)
        );
      }

      const normalized = rows.slice(0, 6).map((row) => {
        const o = row as Record<string, unknown>;
        return {
          businessName: String(o.businessName ?? "").trim(),
          businessDescription: String(o.businessDescription ?? "").trim(),
          domainName: cleanDomainLabel(String(o.domainName ?? "")),
        };
      });

      const validated = generateOutputSchema.safeParse({ suggestions: normalized });
      if (!validated.success) {
        console.warn("[aiDomainSearch.generateNameIdeas] Zod validation failed:", validated.error.flatten());
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Some suggestions could not be validated. Please try again.",
        });
      }

      if (validated.data.suggestions.length < 6) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "The AI returned fewer than 6 ideas. Please try again.",
        });
      }

      return { suggestions: validated.data.suggestions };
    }),
});