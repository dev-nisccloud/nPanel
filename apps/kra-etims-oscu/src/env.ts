/**
 * KRA eTIMS OSCU hosts.
 *
 * Gava Connect (Developer Platform / Apigee) is what the certification dashboard
 * scores. Classic OSCU (`etims-api*.kra.go.ke/etims-api`) uses the original
 * `/selectInitOsdcInfo` path names and does NOT update Gava Connect.
 */

export type KraEnvironment = "sandbox" | "production";
export type KraHostKind = "gava" | "classic";

export const KRA_OSCU_URLS = {
  sandbox: {
    gava: {
      baseUrl: "https://sbx.kra.go.ke/etims-oscu/api/v1",
      tokenUrl: "https://sbx.kra.go.ke/v1/token/generate",
      receiptHost: "https://etims-sbx.kra.go.ke",
    },
    classic: {
      baseUrl: "https://etims-api-sbx.kra.go.ke/etims-api",
      tokenUrl: "https://etims-api-sbx.kra.go.ke/oauth/token",
      receiptHost: "https://etims-sbx.kra.go.ke",
    },
  },
  production: {
    gava: {
      baseUrl: "https://ra.kra.go.ke/etims-oscu/api/v1",
      tokenUrl: "https://ra.kra.go.ke/v1/token/generate",
      receiptHost: "https://etims.kra.go.ke",
    },
    classic: {
      baseUrl: "https://etims-api.kra.go.ke/etims-api",
      tokenUrl: "https://api.kra.go.ke/v1/token/generate",
      receiptHost: "https://etims.kra.go.ke",
    },
  },
} as const;

/** Default lastReqDt used for full-catalog lookups (KRA incremental sync). */
export const DEFAULT_LAST_REQ_DT = "20180101000000";

export function detectHostKind(baseUrl: string): KraHostKind {
  return /etims-oscu/i.test(baseUrl) ? "gava" : "classic";
}

export function resolveOscuUrls(
  environment: KraEnvironment,
  host: KraHostKind = "gava",
): { baseUrl: string; tokenUrl: string; receiptHost: string } {
  return KRA_OSCU_URLS[environment][host];
}
