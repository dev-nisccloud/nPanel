import { publicProcedure, protectedProcedure } from "../../trpc";

/**
 * TEMPORARY — KRA Developer Platform automated certification testing against this API.
 * Set ETIMS_CERTIFICATION_PUBLIC=1 in apps/server/.env (the live app env).
 * Do not load .env.etims-certification here; that file is for cert scripts only.
 * Remove / set to 0 after certification is complete.
 */
export const isEtimsCertificationPublic = () =>
    process.env.ETIMS_CERTIFICATION_PUBLIC === "1";

export const etimsProcedure = isEtimsCertificationPublic()
    ? publicProcedure
    : protectedProcedure;

export function skipEtimsAuthChecks(): boolean {
    return isEtimsCertificationPublic();
}
