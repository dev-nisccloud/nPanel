/**
 * Hivelocity option tag/expression compatibility (store checkout guardrails).
 * Expression grammar matches Hivelocity's reference LR parser (OR, AND, NOT, tags).
 */

export type HivelocityOptionLike = {
	id?: number | string;
	name?: string;
	tags?: string[];
	expressions?: string[];
	operatingSystemFeatures?: {
		sshKey?: boolean;
		postInstall?: boolean;
		cloudInit?: boolean;
	} | null;
	monthlyPrice?: number;
};

export type HivelocityOsFeatures = {
	sshKey?: boolean;
	postInstall?: boolean;
	cloudInit?: boolean;
};

export type HivelocityAddonDisabledDetails = {
	reason: string;
	fix: string;
};

type Token =
	| { type: "TAG"; value: string }
	| { type: "OR" }
	| { type: "AND" }
	| { type: "NOT" }
	| { type: "LPAREN" }
	| { type: "RPAREN" }
	| { type: "EOF" };

function normalizeTag(tag: string): string {
	return tag.trim().toLowerCase();
}

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
		const wordMatch = src.slice(i).match(/^([a-zA-Z0-9_.:-]+)/);
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
			const tag = normalizeTag(token.value);
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
	try {
		const tokens = tokenizeExpression(trimmed);
		const evaluator = new ExprParser(tokens).parse();
		const tagSet = new Set(selectedTags.map(normalizeTag));
		return evaluator((tag) => tagSet.has(tag));
	} catch {
		// Unknown expression grammar — don't block the whole category client-side.
		return true;
	}
}

export function collectHivelocityOptionTags(
	os: HivelocityOptionLike | null | undefined,
	options: readonly HivelocityOptionLike[],
): string[] {
	const tags = new Set<string>();
	for (const opt of options) {
		for (const tag of opt.tags ?? []) {
			const t = normalizeTag(String(tag));
			if (t) tags.add(t);
		}
	}
	if (os) {
		for (const tag of os.tags ?? []) {
			const t = normalizeTag(String(tag));
			if (t) tags.add(t);
		}
	}
	return [...tags];
}

export function isHivelocityOptOutOption(
	option: HivelocityOptionLike,
	groupName?: string,
): boolean {
	const name = String(option.name ?? "").trim().toLowerCase();
	if (!name) return false;

	if (/^none\b/.test(name)) return true;
	if (/^no\b/.test(name)) return true;
	if (/\bwithout\b/.test(name)) return true;
	if (name === "—" || name === "-") return true;

	const g = String(groupName ?? "").trim().toLowerCase();
	const isOptionalCategory =
		g.includes("app") || g.includes("control panel") || g.includes("application");
	if (isOptionalCategory && Number(option.monthlyPrice ?? 0) <= 0 && /^none\b|^no\b/.test(name)) {
		return true;
	}

	return false;
}

function osHasExplicitCapabilities(osFeatures: HivelocityOsFeatures | null | undefined): boolean {
	if (!osFeatures || typeof osFeatures !== "object") return false;
	return ["sshKey", "cloudInit", "postInstall"].some(
		(key) => typeof osFeatures[key as keyof HivelocityOsFeatures] === "boolean",
	);
}

function shouldSkipOsFeatureGuardrail(groupName?: string): boolean {
	const g = String(groupName ?? "").trim().toLowerCase();
	return (
		g.includes("app") ||
		g.includes("control panel") ||
		g.includes("application") ||
		g.includes("software")
	);
}

function getManagedServiceOsReason(input: {
	addon: HivelocityOptionLike;
	groupName?: string;
	os: HivelocityOptionLike | null | undefined;
}): HivelocityAddonDisabledDetails | null {
	const { addon, groupName, os } = input;
	if (!os) return null;

	const g = String(groupName ?? "").trim().toLowerCase();
	if (!g.includes("managed service")) return null;

	const osName = String(os.name ?? "selected OS");
	const osNameLower = osName.toLowerCase();
	const isWindowsOs = osNameLower.includes("windows");
	const addonNameLower = String(addon.name ?? "").toLowerCase();
	const isWindowsAddon = addonNameLower.includes("windows");

	if (isWindowsOs && !isWindowsAddon) {
		return {
			reason: `${addon.name ?? "This managed service"} is only offered for Linux operating systems, but you selected ${osName}.`,
			fix: "Choose a Windows-specific managed service, or switch to a Linux operating system above.",
		};
	}
	if (!isWindowsOs && isWindowsAddon) {
		return {
			reason: `${addon.name ?? "This managed service"} requires a Windows operating system, but you selected ${osName}.`,
			fix: "Select a Windows OS in the operating system table, or pick a Linux managed service instead.",
		};
	}
	return null;
}

function getOsFeatureIncompatibilityDetails(input: {
	addon: HivelocityOptionLike;
	groupName?: string;
	os: HivelocityOptionLike | null | undefined;
	osFeatures: HivelocityOsFeatures;
}): HivelocityAddonDisabledDetails | null {
	const { addon, groupName, os, osFeatures } = input;
	if (!os || shouldSkipOsFeatureGuardrail(groupName)) return null;
	if (!osHasExplicitCapabilities(osFeatures)) return null;

	const req = addon.operatingSystemFeatures ?? null;
	if (!req) return null;

	const missing: string[] = [];
	if (req.sshKey === true && osFeatures.sshKey !== true) missing.push("SSH keys");
	if (req.cloudInit === true && osFeatures.cloudInit !== true) missing.push("Cloud-init");
	if (req.postInstall === true && osFeatures.postInstall !== true) missing.push("Post-install scripts");

	if (!missing.length) return null;

	const osName = String(os.name ?? "selected OS");
	return {
		reason: `${addon.name ?? "This add-on"} requires ${missing.join(", ")} support, which ${osName} does not provide.`,
		fix: `Select an operating system that supports ${missing.join(", ")}, or remove other add-ons that conflict with this requirement.`,
	};
}

function getExpressionIncompatibilityDetails(
	option: HivelocityOptionLike,
	selectedTags: readonly string[],
): HivelocityAddonDisabledDetails | null {
	const expressions = option.expressions ?? [];
	if (!expressions.length) return null;

	const failed = expressions.filter(
		(expr) => !evaluateHivelocityCompatibilityExpression(expr, selectedTags),
	);
	if (!failed.length) return null;

	const name = String(option.name ?? "This add-on");
	const tagPreview = selectedTags.length ? selectedTags.slice(0, 8).join(", ") : "none";
	const rulePreview = failed.slice(0, 2).join("; ");

	return {
		reason: `${name} is not compatible with your current operating system and add-on combination.`,
		fix: `Try a different OS or change other add-ons in Apps / Control Panel. Active tags: ${tagPreview}. Unmet rule(s): ${rulePreview}.`,
	};
}

export function getHivelocityAddonDisabledDetails(input: {
	addon: HivelocityOptionLike;
	groupName?: string;
	os: HivelocityOptionLike | null | undefined;
	osFeatures: HivelocityOsFeatures;
	selectedTags: readonly string[];
	/** When true, still evaluate even for opt-out / already-selected options. */
	force?: boolean;
}): HivelocityAddonDisabledDetails | null {
	const { addon, groupName, os, osFeatures, selectedTags, force = false } = input;

	if (!force && isHivelocityOptOutOption(addon, groupName)) {
		return null;
	}

	if (!os) {
		return {
			reason: "Select an operating system first.",
			fix: "Choose an OS in the table above — add-on compatibility depends on it.",
		};
	}

	return (
		getManagedServiceOsReason({ addon, groupName, os }) ??
		getOsFeatureIncompatibilityDetails({ addon, groupName, os, osFeatures }) ??
		getExpressionIncompatibilityDetails(addon, selectedTags)
	);
}

export function getOptionExpressionIncompatibilityReason(
	option: HivelocityOptionLike,
	selectedTags: readonly string[],
): string | null {
	const details = getExpressionIncompatibilityDetails(option, selectedTags);
	return details?.reason ?? null;
}

export function optionExpressionsAreCompatible(
	option: HivelocityOptionLike,
	selectedTags: readonly string[],
): boolean {
	const expressions = option.expressions ?? [];
	if (!expressions.length) return true;
	return expressions.every((expr) => evaluateHivelocityCompatibilityExpression(expr, selectedTags));
}

/** Groups where Hivelocity allows more than one option at a time (rare). */
const MULTI_SELECT_GROUP_KEYWORDS: string[] = [];

export function isHivelocityOptionGroupMultiSelect(groupName: string): boolean {
	const g = groupName.trim().toLowerCase();
	return MULTI_SELECT_GROUP_KEYWORDS.some((k) => g.includes(k));
}

/** Single-select groups where skipping all options is valid (show explicit "No selection"). */
export function isHivelocityOptionalSingleSelectGroup(groupName: string): boolean {
	const g = groupName.trim().toLowerCase();
	if (isHivelocityOptionGroupMultiSelect(groupName)) return false;
	return (
		g.includes("app") ||
		g.includes("control panel") ||
		g.includes("application") ||
		g.includes("software") ||
		g.includes("managed service")
	);
}

export function groupHasOptOutOption(rows: readonly HivelocityOptionLike[]): boolean {
	return rows.some((row) => isHivelocityOptOutOption(row));
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
	osFeatures?: HivelocityOsFeatures;
}): { ok: true } | { ok: false; reasons: string[] } {
	const { os, allOptions, selectedOptionIds, groupedOptions, osFeatures = {} } = input;
	const selected = allOptions.filter((opt) => selectedOptionIds.includes(String(opt.id ?? "")));
	const tags = collectHivelocityOptionTags(os, selected);
	const reasons: string[] = [];

	if (groupedOptions) {
		const groupCheck = validateExclusiveOptionGroups({ groupedOptions, selectedOptionIds });
		if (!groupCheck.ok) reasons.push(...groupCheck.reasons);
	}

	for (const opt of selected) {
		const groupName = groupedOptions
			? Object.entries(groupedOptions).find(([, rows]) =>
					rows.some((row) => String(row.id) === String(opt.id)),
				)?.[0]
			: undefined;
		const details = getHivelocityAddonDisabledDetails({
			addon: opt,
			groupName,
			os,
			osFeatures,
			selectedTags: tags,
			force: true,
		});
		if (details) reasons.push(details.reason);
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
