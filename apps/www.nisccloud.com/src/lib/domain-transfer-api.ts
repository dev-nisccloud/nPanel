import { trpcMutation } from "@/lib/domain-search/api.ts";

export type TransferStatus =
  | "available"
  | "locked"
  | "ready"
  | "pending_check"
  | "reserved"
  | "unavailable";

export type TransferProvider = "kenic" | "openprovider";

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
};

/** Public tRPC procedure — no auth required. */
export function checkDomainTransfer(domain: string): Promise<CheckTransferResult> {
  return trpcMutation<CheckTransferResult>("domainTransfer.checkTransfer", { domain });
}
