export type AudienceContactStatus = "SUBSCRIBED" | "UNSUBSCRIBED" | "BOUNCED" | "COMPLAINED";

export type ParsedAudienceContact = {
	id: string;
	name: string;
	emailAddress: string;
	phoneNumber: string;
	company: string;
	description: string;
	status: AudienceContactStatus | null;
};

export type AudienceContactInput = {
	name?: string;
	emailAddress?: string;
	phoneNumber?: string;
	company?: string;
	description?: string;
	status?: AudienceContactStatus;
};

export type ContactImportResult = {
	added: number;
	skippedDuplicate: number;
	skippedMissingEmail: number;
};

const CHUNK_SIZE = 400;

function normalizeHeader(value: string): string {
	return value.replace(/^\uFEFF/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function detectDelimiter(headerLine: string): "," | ";" | "\t" {
	let commas = 0;
	let semis = 0;
	let tabs = 0;
	let inQuotes = false;

	for (let i = 0; i < headerLine.length; i++) {
		const char = headerLine[i];
		if (char === '"') {
			if (inQuotes && headerLine[i + 1] === '"') {
				i += 1;
				continue;
			}
			inQuotes = !inQuotes;
			continue;
		}
		if (inQuotes) continue;
		if (char === "\n" || char === "\r") break;
		if (char === ",") commas += 1;
		else if (char === ";") semis += 1;
		else if (char === "\t") tabs += 1;
	}

	if (tabs > 0 && tabs >= commas && tabs >= semis) return "\t";
	if (semis > commas) return ";";
	return ",";
}

export function parseCsvRecords(csvText: string): string[][] {
	const normalized = csvText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
	const input = normalized.replace(/^sep=.*\n/i, "");
	const delimiter = detectDelimiter(input.split("\n")[0] ?? "");
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let inQuotes = false;

	const pushRow = () => {
		row.push(field.trim());
		field = "";
		if (row.some((cell) => cell.length > 0)) rows.push(row);
		row = [];
	};

	for (let i = 0; i < input.length; i++) {
		const char = input[i];
		if (inQuotes) {
			if (char === '"') {
				if (input[i + 1] === '"') {
					field += '"';
					i += 1;
				} else {
					inQuotes = false;
				}
			} else {
				field += char;
			}
			continue;
		}

		if (char === '"') {
			inQuotes = true;
			continue;
		}
		if (char === delimiter) {
			row.push(field.trim());
			field = "";
			continue;
		}
		if (char === "\n") {
			pushRow();
			continue;
		}
		field += char;
	}

	if (field.length > 0 || row.length > 0) pushRow();
	return rows;
}

function cell(row: string[], index: number): string {
	if (index < 0) return "";
	return (row[index] ?? "").trim();
}

function headerIndex(header: string[], keys: string[]): number {
	for (const key of keys) {
		const index = header.indexOf(key);
		if (index >= 0) return index;
	}
	return -1;
}

function parseStatus(raw: string): AudienceContactStatus | null {
	const upper = raw.trim().toUpperCase();
	if (upper === "SUBSCRIBED" || upper === "ACTIVE" || upper === "YES") return "SUBSCRIBED";
	if (upper === "UNSUBSCRIBED" || upper === "INACTIVE" || upper === "NO") return "UNSUBSCRIBED";
	if (upper === "BOUNCED") return "BOUNCED";
	if (upper === "COMPLAINED") return "COMPLAINED";
	return null;
}

function guessEmailColumn(records: string[][]): number {
	const sample = records.slice(1, 21);
	const width = records.reduce((max, row) => Math.max(max, row.length), 0);
	let bestIndex = -1;
	let bestScore = 0;
	for (let column = 0; column < width; column++) {
		const score = sample.filter((row) => (row[column] ?? "").includes("@")).length;
		if (score > bestScore) {
			bestScore = score;
			bestIndex = column;
		}
	}
	return bestScore > 0 ? bestIndex : -1;
}

export function parseContactsCsv(csvText: string): ParsedAudienceContact[] {
	const records = parseCsvRecords(csvText);
	if (records.length <= 1) return [];

	const header = records[0].map(normalizeHeader);
	const nameIdx = headerIndex(header, ["name", "fullname", "contactname", "contact"]);
	const firstIdx = headerIndex(header, ["firstname", "givenname"]);
	const lastIdx = headerIndex(header, ["lastname", "surname", "familyname"]);
	const phoneIdx = headerIndex(header, ["phone", "phonenumber", "telephone", "tel", "mobile"]);
	const companyIdx = headerIndex(header, ["company", "organization", "organisation", "org"]);
	const descriptionIdx = headerIndex(header, ["description", "notes", "note"]);
	const statusIdx = headerIndex(header, ["status", "subscriptionstatus"]);
	const emailIdx =
		headerIndex(header, ["email", "emailaddress", "emailaddr", "mail"]) >= 0
			? headerIndex(header, ["email", "emailaddress", "emailaddr", "mail"])
			: guessEmailColumn(records);

	const contacts: ParsedAudienceContact[] = [];
	for (let i = 1; i < records.length; i++) {
		const row = records[i];
		const name = cell(row, nameIdx) || [cell(row, firstIdx), cell(row, lastIdx)].filter(Boolean).join(" ");
		const emailAddress = cell(row, emailIdx);
		const phoneNumber = cell(row, phoneIdx);
		const company = cell(row, companyIdx);
		const description = cell(row, descriptionIdx);
		const status = parseStatus(cell(row, statusIdx));
		if (!name && !emailAddress && !phoneNumber && !company && !description) continue;

		contacts.push({
			id: crypto.randomUUID(),
			name,
			emailAddress,
			phoneNumber,
			company,
			description,
			status,
		});
	}

	return contacts;
}

export async function addContactsInChunks(
	add: (contacts: AudienceContactInput[]) => Promise<Partial<ContactImportResult> & { added: number }>,
	contacts: AudienceContactInput[],
): Promise<ContactImportResult> {
	const totals: ContactImportResult = { added: 0, skippedDuplicate: 0, skippedMissingEmail: 0 };
	for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
		const result = await add(contacts.slice(i, i + CHUNK_SIZE));
		totals.added += result.added ?? 0;
		totals.skippedDuplicate += result.skippedDuplicate ?? 0;
		totals.skippedMissingEmail += result.skippedMissingEmail ?? 0;
	}
	return totals;
}

export function describeContactImport(parsedCount: number, result: ContactImportResult): string {
	const added = result.added.toLocaleString();
	const parsed = parsedCount.toLocaleString();
	if (
		result.added === parsedCount &&
		result.skippedDuplicate === 0 &&
		result.skippedMissingEmail === 0
	) {
		return `Saved ${added} contact${result.added === 1 ? "" : "s"}.`;
	}

	const parts = [`Saved ${added} of ${parsed} contact${parsedCount === 1 ? "" : "s"}.`];
	if (result.skippedDuplicate > 0) {
		parts.push(
			`${result.skippedDuplicate.toLocaleString()} duplicate email${result.skippedDuplicate === 1 ? " was" : "s were"} skipped.`,
		);
	}
	if (result.skippedMissingEmail > 0) {
		parts.push(
			`${result.skippedMissingEmail.toLocaleString()} row${result.skippedMissingEmail === 1 ? "" : "s"} had no email address.`,
		);
	}
	return parts.join(" ");
}
