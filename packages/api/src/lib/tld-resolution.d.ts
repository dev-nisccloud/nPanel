export type ResolvedNameserver = {
    name: string;
    ip?: string;
};
/**
 * Resolves nameservers for any domain by strictly using the global default TLD setting.
 * Per requirements: we only use the one which has the state of default only.
 */
export declare function resolveNameserversForDomain(_domain: string): Promise<ResolvedNameserver[]>;
