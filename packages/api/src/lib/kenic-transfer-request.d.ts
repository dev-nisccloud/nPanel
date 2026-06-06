/**
 * Execute KENIC EPP domain transfer request. Shared by kenic.domainTransfer.request
 * and domainTransfer.initiateTransfer (save to DB then call provider).
 */
export interface ExecuteKenicTransferInput {
    name: string;
    authCode: string;
    roid?: string;
    period?: number;
    nameServers?: Array<{
        name: string;
        ip?: string;
    }>;
}
export interface ExecuteKenicTransferResult {
    success: true;
    pending: boolean;
    domain: string;
    trStatus: string | null;
    reId: string | null;
    reDate: string | null;
    acId: string | null;
    acDate: string | null;
    exDate: string | null;
    raw: string;
}
/**
 * Run KENIC EPP domain transfer (RFC 5731, op="request"). Caller is responsible for
 * creating/updating any DB record (e.g. DomainTransferRequest).
 */
export declare function executeKenicTransferRequest(input: ExecuteKenicTransferInput): Promise<ExecuteKenicTransferResult>;
