export type KenicPortfolioStatus =
	| "ACTIVE"
	| "EXPIRED"
	| "PENDING"
	| "SUSPENDED"
	| "TRANSFERRING";

const CLIENT_LOCK_STATUSES = new Set([
	"clienttransferprohibited",
	"clientupdateprohibited",
	"clientdeleteprohibited",
	"clientrenewprohibited",
]);

const ACTIVE_STATUSES = new Set(["ok", "active"]);

const PENDING_STATUSES = new Set([
	"pendingcreate",
	"pendingupdate",
	"pendingrenew",
	"pendingdelete",
	"inactive",
]);

const HOLD_STATUSES = new Set(["clienthold", "serverhold"]);

function normalizeStatus(status: string): string {
	return status.trim().toLowerCase();
}

/**
 * Map KENIC/CoCCA EPP domain statuses to portfolio display status.
 * Locked domains often lose `active`/`ok` and only show clientTransferProhibited — still ACTIVE.
 */
export function mapKenicEppStatusesToPortfolioStatus(
	statuses: Array<{ status?: string }>,
	exDate?: string | null,
): KenicPortfolioStatus {
	const codes = statuses
		.map((s) => s.status?.trim() ?? "")
		.filter(Boolean);
	const normalized = codes.map(normalizeStatus);

	if (exDate) {
		const expiry = new Date(exDate);
		if (!Number.isNaN(expiry.getTime()) && expiry < new Date()) {
			return "EXPIRED";
		}
	}

	if (normalized.includes("pendingtransfer")) {
		return "TRANSFERRING";
	}

	if (normalized.some((c) => HOLD_STATUSES.has(c))) {
		return "SUSPENDED";
	}

	if (normalized.some((c) => PENDING_STATUSES.has(c))) {
		return "PENDING";
	}

	if (normalized.some((c) => ACTIVE_STATUSES.has(c))) {
		return "ACTIVE";
	}

	// Locked-only (or other client prohibitions) without pending/hold = still active
	if (normalized.length > 0 && normalized.every((c) => CLIENT_LOCK_STATUSES.has(c))) {
		return "ACTIVE";
	}

	if (normalized.some((c) => CLIENT_LOCK_STATUSES.has(c))) {
		return "ACTIVE";
	}

	return normalized.length === 0 ? "ACTIVE" : "PENDING";
}

export function isKenicTransferLocked(statuses: Array<{ status?: string }>): boolean {
	return statuses.some((s) => normalizeStatus(s.status ?? "") === "clienttransferprohibited");
}

export function isKenicServerTransferLocked(statuses: Array<{ status?: string }>): boolean {
	return statuses.some((s) => normalizeStatus(s.status ?? "") === "servertransferprohibited");
}
