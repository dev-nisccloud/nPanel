/**
 * Hivelocity option tag/expression compatibility (store checkout guardrails).
 * Expression grammar matches Hivelocity's reference LR parser (OR, AND, NOT, tags).
 */

export type HivelocityOptionLike = {
	id?: number | string;
	name?: string;
	tags?: string[];
	expressions?: string[];
};

type Token =
	| { type: "TAG"; value: string }
	| { type: "OR" }
	| { type: "AND" }
	| { type: "NOT" }
	| { type: "LPAREN" }
	| { type: "RPAREN" }
	| { type: "EOF" };

function tokenizeExpression(input: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;
	const src = input.trim();
	while (i < src.length) {
		const ch = src[i];
		if (/\s/.test(ch)) {
			i++;
			continue;
		}
		if (ch === "(") {
			tokens.push({ type: "LPAREN" });
			i++;
			continue;
		}
		if (ch === ")") {
			tokens.push({ type: "RPAREN" });
			i++;
			continue;
		}
		const wordMatch = src.slice(i).match(/^(\w+)/);
		if (wordMatch) {
			const word = wordMatch[1];
			const lower = word.toLowerCase();
			if (lower === "or") tokens.push({ type: "OR" });
			else if (lower === "and") tokens.push({ type: "AND" });
			else if (lower === "not") tokens.push({ type: "NOT" });
			else tokens.push({ type: "TAG", value: word });
			i += word.length;
			continue;
		}
		throw new Error(`Invalid expression near "${src.slice(i, i + 12)}"`);
	}
	tokens.push({ type: "EOF" });
	return tokens;
}

class ExprParser {
	private pos = 0;

	constructor(private readonly tokens: Token[]) {}

	private peek(): Token {
		return this.tokens[this.pos] ?? { type: "EOF" };
	}

	private consume(): Token {
		return this.tokens[this.pos++] ?? { type: "EOF" };
	}

	parse(): (hasTag: (tag: string) => boolean) => boolean {
		const expr = this.parseOr();
		if (this.peek().type !== "EOF") {
			throw new Error("Unexpected tokens after expression");
		}
		return expr;
	}

	private parseOr(): (hasTag: (tag: string) => boolean) => boolean {
		let left = this.parseAnd();
		while (this.peek().type === "OR") {
			this.consume();
			const right = this.parseAnd();
			const l = left;
			left = (hasTag) => l(hasTag) || right(hasTag);
		}
		return left;
	}

	private parseAnd(): (hasTag: (tag: string) => boolean) => boolean {
		let left = this.parseNot();
		while (this.peek().type === "AND") {
			this.consume();
			const right = this.parseNot();
			const l = left;
			left = (hasTag) => l(hasTag) && right(hasTag);
		}
		return left;
	}

	private parseNot(): (hasTag: (tag: string) => boolean) => boolean {
		if (this.peek().type === "NOT") {
			this.consume();
			const inner = this.parseNot();
			return (hasTag) => !inner(hasTag);
		}
		return this.parsePrimary();
	}

	private parsePrimary(): (hasTag: (tag: string) => boolean) => boolean {
		const token = this.peek();
		if (token.type === "LPAREN") {
			this.consume();
			const inner = this.parseOr();
			if (this.consume().type !== "RPAREN") {
				throw new Error("Expected closing parenthesis");
			}
			return inner;
		}
		if (token.type === "TAG") {
			this.consume();
			const tag = token.value;
			return (hasTag) => hasTag(tag);
		}
		throw new Error(`Unexpected token in expression: ${token.type}`);
	}
}

export function evaluateHivelocityCompatibilityExpression(
	expression: string,
	selectedTags: readonly string[],
): boolean {
	const trimmed = expression.trim();
	if (!trimmed) return true;
	const tokens = tokenizeExpression(trimmed);
	const evaluator = new ExprParser(tokens).parse();
	const tagSet = new Set(selectedTags);
	return evaluator((tag) => tagSet.has(tag));
}

export function collectHivelocityOptionTags(
	os: HivelocityOptionLike | null | undefined,
	options: readonly HivelocityOptionLike[],
): string[] {
	const tags = new Set<string>();
	for (const opt of options) {
		for (const tag of opt.tags ?? []) {
			const t = String(tag).trim();
			if (t) tags.add(t);
		}
	}
	if (os) {
		for (const tag of os.tags ?? []) {
			const t = String(tag).trim();
			if (t) tags.add(t);
		}
	}
	return [...tags];
}

export function optionExpressionsAreCompatible(
	option: HivelocityOptionLike,
	selectedTags: readonly string[],
): boolean {
	const expressions = option.expressions ?? [];
	if (!expressions.length) return true;
	return expressions.every((expr) => evaluateHivelocityCompatibilityExpression(expr, selectedTags));
}

export function getOptionExpressionIncompatibilityReason(
	option: HivelocityOptionLike,
	selectedTags: readonly string[],
): string | null {
	const expressions = option.expressions ?? [];
	if (!expressions.length) return null;
	const failed = expressions.filter(
		(expr) => !evaluateHivelocityCompatibilityExpression(expr, selectedTags),
	);
	if (!failed.length) return null;
	const name = String(option.name ?? "This add-on");
	return `${name} is incompatible with your current OS and add-on selection.`;
}

/** Groups where Hivelocity allows more than one option at a time (rare). */
const MULTI_SELECT_GROUP_KEYWORDS: string[] = [];

export function isHivelocityOptionGroupMultiSelect(groupName: string): boolean {
	const g = groupName.trim().toLowerCase();
	return MULTI_SELECT_GROUP_KEYWORDS.some((k) => g.includes(k));
}

export function validateExclusiveOptionGroups(input: {
	groupedOptions: Record<string, readonly HivelocityOptionLike[]>;
	selectedOptionIds: readonly string[];
}): { ok: true } | { ok: false; reasons: string[] } {
	const { groupedOptions, selectedOptionIds } = input;
	const selectedSet = new Set(selectedOptionIds.map(String));
	const reasons: string[] = [];

	for (const [groupName, rows] of Object.entries(groupedOptions)) {
		if (groupName.trim().toLowerCase() === "operating system") continue;
		if (isHivelocityOptionGroupMultiSelect(groupName)) continue;

		const selectedInGroup = rows.filter((opt) => selectedSet.has(String(opt.id ?? "")));
		if (selectedInGroup.length <= 1) continue;

		const names = selectedInGroup.map((o) => String(o.name ?? o.id)).join(", ");
		reasons.push(
			`Choose only one option in "${groupName}" (selected: ${names}).`,
		);
	}

	if (reasons.length) {
		return { ok: false, reasons: [...new Set(reasons)] };
	}
	return { ok: true };
}

export function validateHivelocityOptionSelection(input: {
	os: HivelocityOptionLike | null | undefined;
	allOptions: readonly HivelocityOptionLike[];
	selectedOptionIds: readonly string[];
	groupedOptions?: Record<string, readonly HivelocityOptionLike[]>;
}): { ok: true } | { ok: false; reasons: string[] } {
	const { os, allOptions, selectedOptionIds, groupedOptions } = input;
	const selected = allOptions.filter((opt) => selectedOptionIds.includes(String(opt.id ?? "")));
	const tags = collectHivelocityOptionTags(os, selected);
	const reasons: string[] = [];

	if (groupedOptions) {
		const groupCheck = validateExclusiveOptionGroups({ groupedOptions, selectedOptionIds });
		if (!groupCheck.ok) reasons.push(...groupCheck.reasons);
	}

	for (const opt of selected) {
		const reason = getOptionExpressionIncompatibilityReason(opt, tags);
		if (reason) reasons.push(reason);
	}

	if (reasons.length) {
		return { ok: false, reasons: [...new Set(reasons)] };
	}
	return { ok: true };
}

/** Keep the most recently selected option when a category allows only one. */
export function dedupeExclusiveGroupOptionIds(
	groupedOptions: Record<string, readonly HivelocityOptionLike[]>,
	selectedOptionIds: readonly string[],
): string[] {
	const keep = new Set(selectedOptionIds);

	for (const [groupName, rows] of Object.entries(groupedOptions)) {
		if (groupName.trim().toLowerCase() === "operating system") continue;
		if (isHivelocityOptionGroupMultiSelect(groupName)) continue;

		const idsInGroup = selectedOptionIds.filter((id) =>
			rows.some((r) => String(r.id) === id),
		);
		if (idsInGroup.length <= 1) continue;

		const keepId = idsInGroup[idsInGroup.length - 1];
		for (const id of idsInGroup) {
			if (id !== keepId) keep.delete(id);
		}
	}

	return selectedOptionIds.filter((id) => keep.has(id));
}
