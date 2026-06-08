/**
 * Detect KENIC domains (.ke TLDs) with an active outgoing transfer via EPP domain:info.
 * Used by agency transfer requests list alongside OpenProvider outgoing detection.
 */
export type OutgoingKenicTransfer = {
    domainName: string;
    submittedAt: Date;
};
export declare function listOutgoingKenicTransfers(): Promise<OutgoingKenicTransfer[]>;
