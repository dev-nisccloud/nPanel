/**
 * KENIC registrar account balance via CoCCA finance EPP extension.
 * @see https://faq.cocca.org.nz/ (EPP Balance  finance:info)
 */
export type KenicBalanceEntry = {
    /** Registry zone / TLD label from CoCCA (e.g. "ke"). */
    tld: string;
    currency: string;
    balance: number;
};
export type KenicBalanceResult = {
    balances: KenicBalanceEntry[];
    /** Preferred display amount: sum of KES entries if any, else first entry. */
    balance: number;
    currency: string;
};
/**
 * Parse CoCCA finance:infData balance strings: TLD|CURRENCY|BALANCE
 */
export declare function parseFinanceBalanceResponse(parsed: Record<string, unknown>): KenicBalanceEntry[];
/**
 * Query KENIC registrar account balance via CoCCA finance:info EPP command.
 */
export declare function getKenicBalance(): Promise<KenicBalanceResult>;
