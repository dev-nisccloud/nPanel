import Replicate from "replicate";
import { z } from "zod";
import type { ZeepoModel } from "../zeepo-canvas/models";

const orchestrationResponseSchema = z.object({
	assistant_text: z.string(),
	tool_calls: z
		.array(
			z.object({
				name: z.string(),
				arguments: z.record(z.string(), z.unknown()).optional(),
			}),
		)
		.default([]),
});

export type AgentOrchestrationMessage = {
	role: "system" | "user" | "assistant" | "tool";
	content: string;
	toolCalls?: unknown;
	toolCallId?: string | null;
};

export type AgentToolCall = {
	name: string;
	arguments: Record<string, unknown>;
};

export function stripCodeFences(raw: string): string {
	let t = raw.trim();
	if (t.startsWith("```")) {
		t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/s, "");
	}
	return t.trim();
}

export async function collectTextOutput(output: unknown): Promise<string> {
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

function buildReplicateLlmInput(
	model: ZeepoModel,
	systemBlock: string,
	userBlock: string,
	maxTokens: number,
): Record<string, unknown> {
	if (model.id.startsWith("anthropic/")) {
		return {
			system_prompt: systemBlock,
			prompt: userBlock,
			max_tokens: maxTokens,
		};
	}
	return {
		prompt: `${systemBlock}\n\n---\n\n${userBlock}`,
		max_tokens: maxTokens,
	};
}

function extractFirstJsonObject(s: string): string | null {
	const start = s.indexOf("{");
	if (start < 0) return null;
	let depth = 0;
	let inString = false;
	let escape = false;
	let stringQuote: string | null = null;
	for (let i = start; i < s.length; i++) {
		const ch = s[i]!;
		if (escape) {
			escape = false;
			continue;
		}
		if (ch === "\\" && inString) {
			escape = true;
			continue;
		}
		if (!inString && (ch === '"' || ch === "'")) {
			inString = true;
			stringQuote = ch;
			continue;
		}
		if (inString && stringQuote && ch === stringQuote) {
			inString = false;
			stringQuote = null;
			continue;
		}
		if (inString) continue;
		if (ch === "{") depth++;
		else if (ch === "}") {
			depth--;
			if (depth === 0) return s.slice(start, i + 1);
		}
	}
	return null;
}

export type ParsedOrchestrationResult =
	| {
			ok: true;
			assistant_text: string;
			tool_calls: AgentToolCall[];
	  }
	| {
			ok: false;
			raw: string;
	  };

export function parseOrchestrationResponse(raw: string): ParsedOrchestrationResult {
	const stripped = stripCodeFences(raw);
	const candidates = [stripped, extractFirstJsonObject(stripped)].filter(
		(x): x is string => Boolean(x),
	);
	for (const c of candidates) {
		try {
			const parsed = JSON.parse(c);
			const safe = orchestrationResponseSchema.safeParse(parsed);
			if (safe.success) {
				return {
					ok: true,
					assistant_text: safe.data.assistant_text,
					tool_calls: safe.data.tool_calls.map((t) => ({
						name: t.name,
						arguments: (t.arguments ?? {}) as Record<string, unknown>,
					})),
				};
			}
		} catch {
			/* try next candidate */
		}
	}
	return { ok: false, raw: stripped };
}

export function serializeAgentTurnPrompt(
	messages: AgentOrchestrationMessage[],
	jsonInstruction: string,
): { systemBlock: string; userBlock: string } {
	const systemParts: string[] = [];
	const transcriptParts: string[] = [];
	for (const m of messages) {
		if (m.role === "system") {
			systemParts.push(m.content);
			continue;
		}
		if (m.role === "user") {
			transcriptParts.push(`[USER]\n<<<\n${m.content}\n>>>`);
			continue;
		}
		if (m.role === "assistant") {
			let block = `[ASSISTANT]\n${m.content}`;
			if (m.toolCalls) {
				block += `\n[ASSISTANT_TOOL_REQUEST]\n${JSON.stringify(m.toolCalls)}`;
			}
			transcriptParts.push(block);
			continue;
		}
		if (m.role === "tool") {
			transcriptParts.push(
				`[TOOL_RESULT tool_call_id=${m.toolCallId ?? ""}]\n${m.content}`,
			);
		}
	}
	const systemBlock = systemParts.join("\n\n---\n\n");
	const userBlock = `${transcriptParts.join("\n\n")}\n\n${jsonInstruction}`;
	return { systemBlock, userBlock };
}

export const ORCHESTRATION_JSON_INSTRUCTION = `Your reply MUST be a single valid JSON object — no markdown, no fences, no commentary before or after. Use this exact shape:
{
  "assistant_text": "string — markdown response shown to the user; may be an empty string only when tool_calls is non-empty",
  "tool_calls": [
    {
      "name": "list_models" | "run_media_generation",
      "arguments": { /* tool-specific object */ }
    }
  ]
}
If no tool is needed this turn, return "tool_calls": [].
Do NOT include any other top-level keys. Do NOT prepend "Sure" or "Here is".
In assistant_text, never expose technical ids: no generationId, no UUIDs, no "(ID: …)" or "job id" strings — the product UI already tracks jobs.`;

const REPAIR_INSTRUCTION = `Your previous reply could not be parsed as the required JSON object. Re-emit ONLY a single valid JSON object matching the schema above. Do not apologize. Do not include any text outside the JSON.`;

async function callReplicateOnce(params: {
	replicate: Replicate;
	model: ZeepoModel;
	systemBlock: string;
	userBlock: string;
	maxTokens: number;
	maxMs: number;
}): Promise<string> {
	const { replicate, model, systemBlock, userBlock, maxTokens, maxMs } = params;
	const input = buildReplicateLlmInput(model, systemBlock, userBlock, maxTokens);
	const timeout = new Promise<never>((_, reject) =>
		setTimeout(() => reject(new Error(`timed out after ${maxMs / 1000}s`)), maxMs),
	);
	const output = await Promise.race([
		replicate.run(model.id as `${string}/${string}`, { input }),
		timeout,
	]);
	return collectTextOutput(output);
}

export async function runOrchestrationTurnWithRepair(params: {
	replicate: Replicate;
	model: ZeepoModel;
	messages: AgentOrchestrationMessage[];
	maxMs: number;
	maxTokens: number;
}): Promise<{
	parsed: ParsedOrchestrationResult;
	rawAttempts: string[];
	repairUsed: boolean;
}> {
	const { replicate, model, messages, maxMs, maxTokens } = params;
	const { systemBlock, userBlock } = serializeAgentTurnPrompt(
		messages,
		ORCHESTRATION_JSON_INSTRUCTION,
	);

	const rawAttempts: string[] = [];
	const first = await callReplicateOnce({
		replicate,
		model,
		systemBlock,
		userBlock,
		maxTokens,
		maxMs,
	});
	rawAttempts.push(first);
	const firstParsed = parseOrchestrationResponse(first);
	if (firstParsed.ok) {
		return { parsed: firstParsed, rawAttempts, repairUsed: false };
	}

	const repairUser = `${userBlock}\n\n[PREVIOUS_REPLY_TO_REPAIR]\n<<<\n${first.slice(0, 8000)}\n>>>\n\n${REPAIR_INSTRUCTION}`;
	const second = await callReplicateOnce({
		replicate,
		model,
		systemBlock,
		userBlock: repairUser,
		maxTokens,
		maxMs,
	});
	rawAttempts.push(second);
	const secondParsed = parseOrchestrationResponse(second);
	return { parsed: secondParsed, rawAttempts, repairUsed: true };
}

export function toolCallSignature(tc: AgentToolCall): string {
	const sortedArgs = JSON.stringify(tc.arguments, Object.keys(tc.arguments).sort());
	return `${tc.name}::${sortedArgs}`;
}
