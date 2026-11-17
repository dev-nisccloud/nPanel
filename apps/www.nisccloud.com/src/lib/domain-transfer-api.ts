import { trpcMutation } from "@/lib/domain-search/api.ts";

export type TransferStatus =
  | "available"
  | "locked"
  | "ready"
  | "pending_check"
  | "reserved"
  | "unavailable";

export type TransferProvider = "kenic" | "openprovider";

export type TransferBlockerCode =
  | "registrar_lock"
  | "registry_lock"
  | "recently_registered"
  | "recently_transferred"
  | "pending_transfer"
  | "redemption"
  | "pending_delete";

export type TransferWarningCode = "expired" | "expiring_soon";

export type TransferDetails = {
  registrar: string | null;
  registrarUrl: string | null;
  registeredAt: string | null;
  expiresAt: string | null;
  lastTransferredAt: string | null;
  statuses: string[];
  blockers: TransferBlockerCode[];
  warnings: TransferWarningCode[];
  eligibleFrom: string | null;
  checkedAt: string;
};

export type CheckTransferResult = {
  transferStatus: TransferStatus;
  transferrable: boolean;
  provider: TransferProvider | null;
  domain: string;
  name: string | null;
  extension: string | null;
  price: number | null;
  currency: string | null;
  createPrice?: number | null;
  createCurrency?: string | null;
  error: string | null;
  details?: TransferDetails | null;
};

/** Public tRPC procedure  no auth required. */
export function checkDomainTransfer(domain: string): Promise<CheckTransferResult> {
  return trpcMutation<CheckTransferResult>("domainTransfer.checkTransfer", { domain });
}
