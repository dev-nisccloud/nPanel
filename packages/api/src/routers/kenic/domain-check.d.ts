import { type DomainCheckNormalized } from "../../lib/epp/domain-check-types";
/** Optional extended error from EPP result (RFC 5730 extValue). */
export type EppResultExtValue = {
    value?: string;
    reason?: string;
};
/**
 * KENIC EPP domain check router.
 * Connects, login, sends domain:check, returns raw and parsed response for type discovery.
 */
export declare const kenicDomainCheckRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Check availability of one or more .ke domains.
     * Optionally request pricing via EPP fee extension (RFC 8748); server may return fee:chkData in response.extension.
     * Input: { domains, withFee?, currency?, periodYears? }.
     * Returns raw and parsed EPP domain:check response (and fee data when withFee and server supports it).
     */
    check: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            domains: string[];
            withFee?: boolean | undefined;
            currency?: string | undefined;
            periodYears?: number | undefined;
            phase?: string | undefined;
            subphase?: string | undefined;
            includeRestoreFee?: boolean | undefined;
        };
        output: {
            raw: string;
            parsed: null;
            checkResultCode: null;
            checkResultMsg: null;
            loginResultExtValue?: EppResultExtValue | undefined;
            loginSuccess: boolean;
            loginResultCode: string;
            loginResultMsg: string;
            parseError?: undefined;
        } | {
            loginSuccess: boolean;
            raw: string;
            parsed: null;
            parseError: string;
            checkResultCode: null;
            checkResultMsg: null;
        } | {
            checkResultExtValue?: EppResultExtValue | undefined;
            loginSuccess: boolean;
            raw: string;
            parsed: Record<string, unknown>;
            normalized: null;
            checkResultCode: string;
            checkResultMsg: string;
            parseError?: undefined;
        } | {
            batched?: boolean | undefined;
            batchCount?: number | undefined;
            loginSuccess: boolean;
            raw: string | undefined;
            parsed: Record<string, unknown> | undefined;
            normalized: DomainCheckNormalized | null;
            checkResultCode: string;
            checkResultMsg: string;
            parseError?: undefined;
        };
        meta: object;
    }>;
}>>;
