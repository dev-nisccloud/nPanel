export type CreditNoteKraSyncResult = {
    ok: true;
    creditNoteId: string;
    kraStatus: "SYNCED";
} | {
    ok: false;
    creditNoteId: string;
    kraStatus: "FAILED" | "SKIPPED";
    reason: string;
} | {
    ok: false;
    creditNoteId: string;
    skipped: true;
    reason: string;
};
export declare function processCreditNoteKraSync(creditNoteId: string): Promise<CreditNoteKraSyncResult>;
