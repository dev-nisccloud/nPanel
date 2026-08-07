import { publicProcedure, protectedProcedure } from "../../trpc";
/**
 * TEMPORARY  KRA Developer Platform automated certification testing.
 * Set ETIMS_CERTIFICATION_PUBLIC=1 in apps/server/.env to allow unauthenticated
 * calls to eTIMS routers. Remove / set to 0 after certification is complete.
 */
export const isEtimsCertificationPublic = () => process.env.ETIMS_CERTIFICATION_PUBLIC === "1";
export const etimsProcedure = isEtimsCertificationPublic()
    ? publicProcedure
    : protectedProcedure;
export function skipEtimsAuthChecks() {
    return isEtimsCertificationPublic();
}
